/**
 * Market service - business logic for market creation and management.
 */
import { config } from "../config";
import {
  createMarket,
  createMarketWithOutcomes,
  getMarketById,
  getMarketWithOutcomes,
  listMarkets,
  listMarketsWithOutcomes,
  listOpenMarkets,
  updateMarket,
  getMarketsToClose,
  type MarketInsert,
  type MarketUpdate,
  type Market,
  type MarketWithOutcomes,
  type MarketStatus,
} from "../db/models/markets";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateMarketInput {
  title: string;
  description: string;
  category?: string;
  categoryLabel?: string;
  bettingDeadline: string;
  resolutionTime?: string;
  outcomes?: { label: string }[];
}

export interface CreateMarketResult {
  market: MarketWithOutcomes;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a new market with outcomes.
 * Markets open immediately on EVM (no escrow tx needed).
 */
export async function createNewMarket(
  input: CreateMarketInput,
  creatorAddress: string
): Promise<CreateMarketResult> {
  const deadline = new Date(input.bettingDeadline);
  if (deadline <= new Date()) {
    throw new Error("Betting deadline must be in the future");
  }

  const outcomes = input.outcomes ?? [{ label: "YES" }, { label: "NO" }];
  if (outcomes.length < 2 || outcomes.length > 5) {
    throw new Error("Markets must have 2-5 outcomes");
  }

  const marketData = {
    title: input.title,
    description: input.description,
    category: input.category,
    categoryLabel: input.categoryLabel,
    createdBy: creatorAddress,
    bettingDeadline: input.bettingDeadline,
    resolutionTime: input.resolutionTime,
    operatorAddress: config.operatorAddress,
    outcomes,
  };

  const market = createMarketWithOutcomes(marketData);

  // Auto-open: no blockchain tx needed on EVM
  const opened = updateMarket(market.id, { status: "Open" });

  return { market: getMarketWithOutcomes(opened!.id)! };
}

export function getMarket(id: string): Market | null {
  return getMarketById(id);
}

export function getMarketFull(id: string): MarketWithOutcomes | null {
  return getMarketWithOutcomes(id);
}

export function getMarkets(status?: string, category?: string): MarketWithOutcomes[] {
  const filters: { status?: MarketStatus; category?: string } = {};

  if (status && ["Draft", "Open", "Closed", "Resolved", "Paid", "Canceled", "Stalled"].includes(status)) {
    filters.status = status as MarketStatus;
  }
  if (category) {
    filters.category = category;
  }

  return listMarketsWithOutcomes(Object.keys(filters).length > 0 ? filters : undefined);
}

export function getOpenMarketsForBetting(): Market[] {
  return listOpenMarkets();
}

export function updateMarketMetadata(
  id: string,
  update: Partial<Pick<MarketUpdate, "title" | "description" | "category" | "categoryLabel">>
): Market | null {
  const market = getMarketById(id);
  if (!market) throw new Error("Market not found");
  if (market.status !== "Draft" && market.status !== "Open") {
    throw new Error(`Cannot update market in ${market.status} status`);
  }
  return updateMarket(id, update);
}

export function closeExpiredMarkets(): Market[] {
  const markets = getMarketsToClose();
  const closed: Market[] = [];

  for (const market of markets) {
    const updated = updateMarket(market.id, { status: "Closed" });
    if (updated) closed.push(updated);
  }

  return closed;
}

export function calculateOdds(market: Market): { yes: number; no: number } {
  const yesTotal = BigInt(market.yes_total_wei);
  const noTotal = BigInt(market.no_total_wei);
  const total = yesTotal + noTotal;

  if (total === 0n) return { yes: 0.5, no: 0.5 };

  return {
    yes: Number(yesTotal) / Number(total),
    no: Number(noTotal) / Number(total),
  };
}

export function calculatePrice(market: Market): { yes: number; no: number } {
  return calculateOdds(market);
}
