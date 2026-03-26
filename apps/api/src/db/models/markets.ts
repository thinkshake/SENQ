/**
 * DB model for the markets table.
 */
import { getDb, generateId } from "../index";
import { createOutcomesBatch, getOutcomesWithProbability, type Outcome } from "./outcomes";

// ── Types ──────────────────────────────────────────────────────────

export type MarketStatus =
  | "Draft"
  | "Open"
  | "Closed"
  | "Resolved"
  | "Paid"
  | "Canceled"
  | "Stalled";

export type MarketOutcome = "YES" | "NO";

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string | null;
  category_label: string | null;
  status: MarketStatus;
  outcome: MarketOutcome | null;
  resolved_outcome_id: string | null;
  created_by: string;
  betting_deadline: string;
  resolution_time: string | null;
  created_at: string;
  updated_at: string;
  pool_total_wei: string;
  yes_total_wei: string;
  no_total_wei: string;
  operator_address: string;
  chain_market_id: number | null;
}

export interface MarketWithOutcomes extends Market {
  outcomes: (Outcome & { probability: number })[];
}

export interface MarketInsert {
  title: string;
  description: string;
  category?: string;
  categoryLabel?: string;
  createdBy: string;
  bettingDeadline: string;
  resolutionTime?: string;
  operatorAddress: string;
}

export interface MarketWithOutcomesInsert extends MarketInsert {
  outcomes: { label: string }[];
}

export interface MarketUpdate {
  title?: string;
  description?: string;
  category?: string;
  categoryLabel?: string;
  status?: MarketStatus;
  outcome?: MarketOutcome;
  resolvedOutcomeId?: string;
  bettingDeadline?: string;
  resolutionTime?: string;
  poolTotalWei?: string;
  yesTotalWei?: string;
  noTotalWei?: string;
  operatorAddress?: string;
  chainMarketId?: number;
}

// ── Queries ────────────────────────────────────────────────────────

export function createMarket(market: MarketInsert): Market {
  const db = getDb();
  const id = generateId("mkt");

  db.query(
    `INSERT INTO markets (
      id, title, description, category, category_label, status, created_by,
      betting_deadline, resolution_time, operator_address
    ) VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?)`
  ).run(
    id,
    market.title,
    market.description,
    market.category ?? null,
    market.categoryLabel ?? null,
    market.createdBy,
    market.bettingDeadline,
    market.resolutionTime ?? null,
    market.operatorAddress
  );

  return getMarketById(id)!;
}

export function createMarketWithOutcomes(
  market: MarketWithOutcomesInsert
): MarketWithOutcomes {
  const db = getDb();
  db.exec("BEGIN TRANSACTION");
  try {
    const created = createMarket(market);
    createOutcomesBatch(
      created.id,
      market.outcomes.map((o) => ({ label: o.label }))
    );
    db.exec("COMMIT");
    return getMarketWithOutcomes(created.id)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function getMarketWithOutcomes(id: string): MarketWithOutcomes | null {
  const market = getMarketById(id);
  if (!market) return null;
  const outcomes = getOutcomesWithProbability(id);
  return { ...market, outcomes };
}

export function listMarketsWithOutcomes(
  filters?: { status?: MarketStatus; category?: string }
): MarketWithOutcomes[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters?.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters?.category) {
    conditions.push("category = ?");
    values.push(filters.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const markets = db
    .query(`SELECT * FROM markets ${where} ORDER BY created_at DESC`)
    .all(...values) as Market[];

  return markets.map((m) => ({
    ...m,
    outcomes: getOutcomesWithProbability(m.id),
  }));
}

export function getMarketById(id: string): Market | null {
  const db = getDb();
  return db.query("SELECT * FROM markets WHERE id = ?").get(id) as Market | null;
}

export function listMarkets(status?: MarketStatus): Market[] {
  const db = getDb();
  if (status) {
    return db.query("SELECT * FROM markets WHERE status = ? ORDER BY created_at DESC")
      .all(status) as Market[];
  }
  return db.query("SELECT * FROM markets ORDER BY created_at DESC").all() as Market[];
}

export function listOpenMarkets(): Market[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM markets
     WHERE status = 'Open'
     AND betting_deadline > strftime('%Y-%m-%dT%H:%M:%fZ','now')
     ORDER BY betting_deadline ASC`
  ).all() as Market[];
}

export function updateMarket(id: string, update: MarketUpdate): Market | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.title !== undefined) { sets.push("title = ?"); values.push(update.title); }
  if (update.description !== undefined) { sets.push("description = ?"); values.push(update.description); }
  if (update.category !== undefined) { sets.push("category = ?"); values.push(update.category); }
  if (update.categoryLabel !== undefined) { sets.push("category_label = ?"); values.push(update.categoryLabel); }
  if (update.status !== undefined) { sets.push("status = ?"); values.push(update.status); }
  if (update.outcome !== undefined) { sets.push("outcome = ?"); values.push(update.outcome); }
  if (update.resolvedOutcomeId !== undefined) { sets.push("resolved_outcome_id = ?"); values.push(update.resolvedOutcomeId); }
  if (update.bettingDeadline !== undefined) { sets.push("betting_deadline = ?"); values.push(update.bettingDeadline); }
  if (update.resolutionTime !== undefined) { sets.push("resolution_time = ?"); values.push(update.resolutionTime); }
  if (update.poolTotalWei !== undefined) { sets.push("pool_total_wei = ?"); values.push(update.poolTotalWei); }
  if (update.yesTotalWei !== undefined) { sets.push("yes_total_wei = ?"); values.push(update.yesTotalWei); }
  if (update.noTotalWei !== undefined) { sets.push("no_total_wei = ?"); values.push(update.noTotalWei); }
  if (update.operatorAddress !== undefined) { sets.push("operator_address = ?"); values.push(update.operatorAddress); }
  if (update.chainMarketId !== undefined) { sets.push("chain_market_id = ?"); values.push(update.chainMarketId); }

  if (sets.length === 0) return getMarketById(id);

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  values.push(id);

  db.query(`UPDATE markets SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getMarketById(id);
}

export function addToPoolMultiOutcome(id: string, amountWei: string): void {
  const db = getDb();
  const row = db.query(`SELECT pool_total_wei FROM markets WHERE id = ?`).get(id) as { pool_total_wei: string } | null;
  const current = BigInt(row?.pool_total_wei || "0");
  const updated = (current + BigInt(amountWei)).toString();
  db.query(
    `UPDATE markets SET
      pool_total_wei = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id = ?`
  ).run(updated, id);
}

export function addToPool(id: string, outcome: MarketOutcome, amountWei: string): void {
  const db = getDb();
  const row = db.query(`SELECT pool_total_wei, yes_total_wei, no_total_wei FROM markets WHERE id = ?`).get(id) as {
    pool_total_wei: string;
    yes_total_wei: string;
    no_total_wei: string;
  } | null;
  if (!row) return;

  const amount = BigInt(amountWei);
  const newPool = (BigInt(row.pool_total_wei || "0") + amount).toString();

  if (outcome === "YES") {
    const newYes = (BigInt(row.yes_total_wei || "0") + amount).toString();
    db.query(
      `UPDATE markets SET
        pool_total_wei = ?,
        yes_total_wei = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`
    ).run(newPool, newYes, id);
  } else {
    const newNo = (BigInt(row.no_total_wei || "0") + amount).toString();
    db.query(
      `UPDATE markets SET
        pool_total_wei = ?,
        no_total_wei = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`
    ).run(newPool, newNo, id);
  }
}

export function canPlaceBet(market: Market): boolean {
  if (market.status !== "Open") return false;
  return new Date(market.betting_deadline) > new Date();
}

export function getMarketsToClose(): Market[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM markets
     WHERE status = 'Open'
     AND betting_deadline <= strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  ).all() as Market[];
}
