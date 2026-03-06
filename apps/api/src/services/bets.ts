/**
 * Bets service - business logic for placing and managing bets.
 */
import { config } from "../config";
import {
  createBet,
  getBetById,
  getBetByPaymentTx,
  listBetsByMarket,
  listBetsByUser,
  listConfirmedBetsByOutcome,
  listConfirmedBetsByOutcomeId,
  updateBet,
  getTotalBetAmount,
  getTotalEffectiveAmount,
  type BetInsert,
  type Bet,
  type BetOutcome,
} from "../db/models/bets";
import {
  getMarketById,
  canPlaceBet,
  addToPool,
  addToPoolMultiOutcome,
} from "../db/models/markets";
import {
  getOutcomeById,
  addToOutcomeTotal,
  getOutcomesWithProbability,
  type Outcome,
} from "../db/models/outcomes";
import {
  getAttributesForUser,
  calculateWeightScore,
} from "../db/models/user-attributes";
import { getOrCreateUser, getUserById } from "../db/models/users";

// ── Types ──────────────────────────────────────────────────────────

export interface PlaceBetInput {
  marketId: string;
  outcomeId: string;
  amountWei: string;
  userAddress: string;
}

export interface PlaceBetResult {
  bet: Bet;
  weightScore: number;
  effectiveAmountWei: string;
  paymentTx: unknown;
}

export interface ConfirmBetInput {
  betId: string;
  paymentTxHash: string;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a bet intent for a multi-outcome market.
 * Returns an EVM payment tx object for the user to sign and submit.
 */
export function placeBet(input: PlaceBetInput): PlaceBetResult {
  const amount = BigInt(input.amountWei);
  if (amount <= 0n) {
    throw new Error("Bet amount must be positive");
  }

  const market = getMarketById(input.marketId);
  if (!market) throw new Error("Market not found");
  if (!canPlaceBet(market)) throw new Error("Market is not accepting bets");

  const outcome = getOutcomeById(input.outcomeId);
  if (!outcome) throw new Error("Outcome not found");
  if (outcome.market_id !== input.marketId) throw new Error("Outcome does not belong to this market");

  const user = getOrCreateUser(input.userAddress);

  const attributes = getAttributesForUser(input.userAddress);
  const weightScore = calculateWeightScore(attributes);
  const effectiveAmountWei = Math.round(Number(input.amountWei) * weightScore).toString();

  const bet = createBet({
    marketId: input.marketId,
    userId: user.id,
    outcome: "YES",
    outcomeId: input.outcomeId,
    amountWei: input.amountWei,
    weightScore,
    effectiveAmountWei,
    memoJson: JSON.stringify({ marketId: input.marketId, outcomeId: input.outcomeId }),
  });

  const operatorAddress = market.operator_address || config.operatorAddress;

  if (!operatorAddress) {
    throw new Error("Operator address not configured");
  }

  if (operatorAddress.toLowerCase() === input.userAddress.toLowerCase()) {
    throw new Error("Cannot place bet: operator address cannot be the same as bettor address");
  }

  // EVM payment transaction: user sends ETH to operator
  const paymentTx = {
    from: input.userAddress,
    to: operatorAddress,
    value: "0x" + amount.toString(16),
  };

  return { bet, weightScore, effectiveAmountWei, paymentTx };
}

/**
 * Confirm a bet after payment tx is submitted on-chain.
 */
export async function confirmBet(input: ConfirmBetInput): Promise<Bet> {
  const bet = getBetById(input.betId);
  if (!bet) throw new Error("Bet not found");
  if (bet.status !== "Pending") throw new Error(`Bet is already ${bet.status}`);

  const existingBet = getBetByPaymentTx(input.paymentTxHash);
  if (existingBet) throw new Error("Payment tx already used for another bet");

  const market = getMarketById(bet.market_id);
  if (!market) throw new Error("Market not found");

  updateBet(bet.id, {
    status: "Confirmed",
    paymentTx: input.paymentTxHash,
  });

  const effectiveAmount = bet.effective_amount_wei ?? bet.amount_wei;
  addToPoolMultiOutcome(market.id, effectiveAmount);

  if (bet.outcome_id) {
    addToOutcomeTotal(bet.outcome_id, effectiveAmount);
  }

  return getBetById(bet.id)!;
}

export function markBetFailed(betId: string): Bet | null {
  return updateBet(betId, { status: "Failed" });
}

export function getBet(id: string): Bet | null {
  return getBetById(id);
}

export function getBetsForMarket(marketId: string, status?: string): Bet[] {
  if (status && ["Pending", "Confirmed", "Failed", "Refunded"].includes(status)) {
    return listBetsByMarket(marketId, status as Bet["status"]);
  }
  return listBetsByMarket(marketId);
}

export function getBetsForUser(userId: string): Bet[] {
  return listBetsByUser(userId);
}

export function calculatePotentialPayout(
  marketId: string,
  outcomeId: string,
  amountWei: string,
  userAddress?: string
): { potentialPayout: string; weightScore: number; effectiveAmount: string } {
  const market = getMarketById(marketId);
  if (!market) {
    return { potentialPayout: "0", weightScore: 1.0, effectiveAmount: amountWei };
  }

  let weightScore = 1.0;
  if (userAddress) {
    const attributes = getAttributesForUser(userAddress);
    weightScore = calculateWeightScore(attributes);
  }
  const effectiveAmount = Math.round(Number(amountWei) * weightScore).toString();

  const outcomes = getOutcomesWithProbability(marketId);
  const targetOutcome = outcomes.find((o) => o.id === outcomeId);
  if (!targetOutcome) {
    return { potentialPayout: "0", weightScore, effectiveAmount };
  }

  const totalPool = outcomes.reduce((sum, o) => sum + BigInt(o.total_amount_wei), 0n);
  const outcomeTotal = BigInt(targetOutcome.total_amount_wei);
  const betEffective = BigInt(effectiveAmount);

  const newTotal = totalPool + betEffective;
  const newOutcomeTotal = outcomeTotal + betEffective;

  if (newOutcomeTotal === 0n) {
    return { potentialPayout: newTotal.toString(), weightScore, effectiveAmount };
  }

  const payout = (newTotal * betEffective) / newOutcomeTotal;
  return { potentialPayout: payout.toString(), weightScore, effectiveAmount };
}

export function calculateActualPayout(bet: Bet): string {
  const market = getMarketById(bet.market_id);
  if (!market || market.status !== "Resolved") return "0";

  const resolvedOutcomeId = market.resolved_outcome_id;
  if (!resolvedOutcomeId) {
    if (!market.outcome || bet.outcome !== market.outcome) return "0";
    const totalPool = BigInt(market.pool_total_wei);
    const winningTotal = BigInt(
      market.outcome === "YES" ? market.yes_total_wei : market.no_total_wei
    );
    const betAmount = BigInt(bet.amount_wei);
    if (winningTotal === 0n) return "0";
    return ((totalPool * betAmount) / winningTotal).toString();
  }

  if (bet.outcome_id !== resolvedOutcomeId) return "0";

  const totalPool = BigInt(market.pool_total_wei);
  const winningTotal = BigInt(getTotalEffectiveAmount(market.id, resolvedOutcomeId));
  const betEffective = BigInt(bet.effective_amount_wei ?? bet.amount_wei);

  if (winningTotal === 0n) return "0";
  return ((totalPool * betEffective) / winningTotal).toString();
}
