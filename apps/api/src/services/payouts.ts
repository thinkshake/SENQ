/**
 * Payouts service - resolution and payout distribution.
 */
import { config } from "../config";
import {
  getMarketById,
  updateMarket,
  type Market,
  type MarketOutcome,
} from "../db/models/markets";
import { listConfirmedBetsByOutcome, type Bet } from "../db/models/bets";
import {
  createPayout,
  createPayoutsBatch,
  getPayoutById,
  listPayoutsByMarket,
  listPayoutsByUser,
  getPendingPayouts,
  updatePayout,
  getPayoutStats,
  payoutExistsForUser,
  type Payout,
} from "../db/models/payouts";

// ── Types ──────────────────────────────────────────────────────────

export interface ResolveMarketInput {
  marketId: string;
  outcome: MarketOutcome;
  action: "finish" | "cancel";
}

export interface ResolveMarketResult {
  market: Market;
  payoutsCreated?: number;
}

export interface ExecutePayoutsInput {
  marketId: string;
  batchSize?: number;
}

export interface ExecutePayoutsResult {
  payouts: Array<{
    id: string;
    userId: string;
    amountWei: string;
    payoutTx: unknown;
  }>;
}

export interface PayoutCalculation {
  userId: string;
  betAmount: string;
  payoutAmount: string;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Resolve a market and prepare payouts, or cancel and refund.
 */
export function resolveMarket(input: ResolveMarketInput): ResolveMarketResult {
  const market = getMarketById(input.marketId);
  if (!market) throw new Error("Market not found");

  if (market.status !== "Closed") {
    throw new Error(`Cannot resolve market in ${market.status} status`);
  }

  let payoutsCreated = 0;

  if (input.action === "finish") {
    const payoutCalcs = calculatePayouts(input.marketId, input.outcome);
    if (payoutCalcs.length > 0) {
      const payoutInserts = payoutCalcs.map((p) => ({
        marketId: input.marketId,
        userId: p.userId,
        amountWei: p.payoutAmount,
      }));
      createPayoutsBatch(payoutInserts);
      payoutsCreated = payoutCalcs.length;
    }

    updateMarket(input.marketId, { status: "Resolved", outcome: input.outcome });
  } else {
    updateMarket(input.marketId, { status: "Canceled" });
  }

  return {
    market: getMarketById(input.marketId)!,
    payoutsCreated,
  };
}

/**
 * Calculate payouts for winning bettors.
 */
export function calculatePayouts(
  marketId: string,
  winningOutcome: MarketOutcome
): PayoutCalculation[] {
  const market = getMarketById(marketId);
  if (!market) return [];

  const totalPool = BigInt(market.pool_total_wei);
  const winningTotal = BigInt(
    winningOutcome === "YES" ? market.yes_total_wei : market.no_total_wei
  );

  if (winningTotal === 0n) return [];

  const winningBets = listConfirmedBetsByOutcome(marketId, winningOutcome);
  const payouts: PayoutCalculation[] = [];

  for (const bet of winningBets) {
    const betAmount = BigInt(bet.amount_wei);
    const payoutAmount = (totalPool * betAmount) / winningTotal;

    payouts.push({
      userId: bet.user_id,
      betAmount: bet.amount_wei,
      payoutAmount: payoutAmount.toString(),
    });
  }

  return payouts;
}

/**
 * Execute pending payouts in batches.
 * Returns EVM payment tx objects for each payout.
 */
export function executePayouts(input: ExecutePayoutsInput): ExecutePayoutsResult {
  const market = getMarketById(input.marketId);
  if (!market) throw new Error("Market not found");

  if (market.status !== "Resolved") {
    throw new Error(`Cannot execute payouts for market in ${market.status} status`);
  }

  if (!market.outcome) throw new Error("Market has no resolved outcome");

  const batchSize = input.batchSize ?? 50;
  const pendingPayouts = getPendingPayouts(input.marketId, batchSize);

  const results: ExecutePayoutsResult["payouts"] = [];

  for (const payout of pendingPayouts) {
    // EVM payment tx: operator sends ETH to winner
    const payoutTx = {
      from: market.operator_address || config.operatorAddress,
      to: payout.user_id,
      value: "0x" + BigInt(payout.amount_wei).toString(16),
    };

    results.push({
      id: payout.id,
      userId: payout.user_id,
      amountWei: payout.amount_wei,
      payoutTx,
    });
  }

  return { payouts: results };
}

export function confirmPayout(payoutId: string, txHash: string): Payout | null {
  return updatePayout(payoutId, { status: "Sent", payoutTx: txHash });
}

export function markPayoutFailed(payoutId: string): Payout | null {
  return updatePayout(payoutId, { status: "Failed" });
}

export function getPayoutsForMarket(marketId: string, status?: string): Payout[] {
  if (status && ["Pending", "Sent", "Failed"].includes(status)) {
    return listPayoutsByMarket(marketId, status as Payout["status"]);
  }
  return listPayoutsByMarket(marketId);
}

export function getPayoutsForUser(userId: string): Payout[] {
  return listPayoutsByUser(userId);
}

export function getMarketPayoutStats(marketId: string) {
  return getPayoutStats(marketId);
}

export function arePayoutsComplete(marketId: string): boolean {
  const stats = getPayoutStats(marketId);
  return stats.pending === 0 && stats.failed === 0;
}

export function finalizeMarketIfComplete(marketId: string): Market | null {
  if (arePayoutsComplete(marketId)) {
    return updateMarket(marketId, { status: "Paid" });
  }
  return getMarketById(marketId);
}
