/**
 * DB model for the trades table.
 * Tracks secondary market trades of outcome positions.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  market_id: string;
  offer_tx: string;
  taker_gets: string;
  taker_pays: string;
  executed_at: string;
  block_number: number;
  memo_json: string | null;
}

export interface TradeInsert {
  marketId: string;
  offerTx: string;
  takerGets: string;
  takerPays: string;
  executedAt: string;
  blockNumber: number;
  memoJson?: string;
}

// ── Queries ────────────────────────────────────────────────────────

export function createTrade(trade: TradeInsert): Trade {
  const db = getDb();
  const id = generateId("trd");

  db.query(
    `INSERT INTO trades (id, market_id, offer_tx, taker_gets, taker_pays, executed_at, block_number, memo_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    trade.marketId,
    trade.offerTx,
    trade.takerGets,
    trade.takerPays,
    trade.executedAt,
    trade.blockNumber,
    trade.memoJson ?? null
  );

  return getTradeById(id)!;
}

export function getTradeById(id: string): Trade | null {
  const db = getDb();
  return db.query("SELECT * FROM trades WHERE id = ?").get(id) as Trade | null;
}

export function getTradeByOfferTx(offerTx: string): Trade | null {
  const db = getDb();
  return db.query("SELECT * FROM trades WHERE offer_tx = ?").get(offerTx) as Trade | null;
}

export function listTradesByMarket(marketId: string): Trade[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM trades WHERE market_id = ? ORDER BY executed_at DESC"
  ).all(marketId) as Trade[];
}

export function listTradesBeforeDeadline(marketId: string, deadline: string): Trade[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM trades WHERE market_id = ? AND executed_at <= ? ORDER BY executed_at ASC"
  ).all(marketId, deadline) as Trade[];
}

export function getTradeVolume(marketId: string): { count: number; totalWei: string } {
  const db = getDb();
  const result = db.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(CAST(taker_pays AS INTEGER)), 0) as total
     FROM trades WHERE market_id = ?`
  ).get(marketId) as { count: number; total: number };

  return {
    count: result.count,
    totalWei: result.total.toString(),
  };
}

export function tradeExists(offerTx: string): boolean {
  const db = getDb();
  const result = db.query(
    "SELECT 1 FROM trades WHERE offer_tx = ? LIMIT 1"
  ).get(offerTx);
  return result !== null;
}
