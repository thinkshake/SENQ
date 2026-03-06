/**
 * Trades service - secondary market trading for outcome tokens.
 * On EVM this is simplified; primary flow is direct ETH bets.
 */
import { getMarketById, canPlaceBet } from "../db/models/markets";
import {
  createTrade,
  getTradeById,
  getTradeByOfferTx,
  listTradesByMarket,
  listTradesBeforeDeadline,
  getTradeVolume,
  tradeExists,
  type Trade,
  type TradeInsert,
} from "../db/models/trades";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateOfferInput {
  marketId: string;
  userAddress: string;
  outcome: "YES" | "NO";
  side: "buy" | "sell";
  tokenAmount: string;
  ethAmountWei: string;
}

export interface CreateOfferResult {
  offerTx: unknown;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create an offer to trade outcome positions.
 * Returns an EVM tx payload for the user to sign.
 */
export function createOffer(input: CreateOfferInput): CreateOfferResult {
  const market = getMarketById(input.marketId);
  if (!market) throw new Error("Market not found");

  if (market.status !== "Open") {
    throw new Error(`Cannot trade on market in ${market.status} status`);
  }

  // EVM offer: a simple ETH transfer representing a trade intent
  const offerTx = {
    from: input.userAddress,
    to: market.operator_address,
    value: "0x" + BigInt(input.ethAmountWei).toString(16),
    data: "0x" + Buffer.from(
      JSON.stringify({ type: "offer", marketId: input.marketId, outcome: input.outcome, side: input.side, tokenAmount: input.tokenAmount })
    ).toString("hex"),
  };

  return { offerTx };
}

export function recordTrade(trade: TradeInsert): Trade | null {
  if (tradeExists(trade.offerTx)) {
    return getTradeByOfferTx(trade.offerTx);
  }
  return createTrade(trade);
}

export function getTradesForMarket(marketId: string): Trade[] {
  return listTradesByMarket(marketId);
}

export function getValidTradesForPayout(marketId: string): Trade[] {
  const market = getMarketById(marketId);
  if (!market) return [];
  return listTradesBeforeDeadline(marketId, market.betting_deadline);
}

export function getTradeStats(marketId: string): { count: number; volumeWei: string } {
  const volume = getTradeVolume(marketId);
  return { count: volume.count, volumeWei: volume.totalWei };
}

export function getTrade(id: string): Trade | null {
  return getTradeById(id);
}
