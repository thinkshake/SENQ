/**
 * DB model for the payouts table.
 * Tracks ETH payouts to winning bettors.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type PayoutStatus = "Pending" | "Sent" | "Failed";

export interface Payout {
  id: string;
  market_id: string;
  user_id: string;
  amount_wei: string;
  status: PayoutStatus;
  payout_tx: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutInsert {
  marketId: string;
  userId: string;
  amountWei: string;
}

export interface PayoutUpdate {
  status?: PayoutStatus;
  payoutTx?: string;
}

// ── Queries ────────────────────────────────────────────────────────

export function createPayout(payout: PayoutInsert): Payout {
  const db = getDb();
  const id = generateId("pay");

  db.query(
    `INSERT INTO payouts (id, market_id, user_id, amount_wei, status)
     VALUES (?, ?, ?, ?, 'Pending')`
  ).run(id, payout.marketId, payout.userId, payout.amountWei);

  return getPayoutById(id)!;
}

export function createPayoutsBatch(payouts: PayoutInsert[]): Payout[] {
  const db = getDb();
  const results: Payout[] = [];

  const stmt = db.query(
    `INSERT INTO payouts (id, market_id, user_id, amount_wei, status)
     VALUES (?, ?, ?, ?, 'Pending')`
  );

  for (const payout of payouts) {
    const id = generateId("pay");
    stmt.run(id, payout.marketId, payout.userId, payout.amountWei);
    results.push(getPayoutById(id)!);
  }

  return results;
}

export function getPayoutById(id: string): Payout | null {
  const db = getDb();
  return db.query("SELECT * FROM payouts WHERE id = ?").get(id) as Payout | null;
}

export function listPayoutsByMarket(marketId: string, status?: PayoutStatus): Payout[] {
  const db = getDb();
  if (status) {
    return db.query(
      "SELECT * FROM payouts WHERE market_id = ? AND status = ? ORDER BY created_at ASC"
    ).all(marketId, status) as Payout[];
  }
  return db.query(
    "SELECT * FROM payouts WHERE market_id = ? ORDER BY created_at ASC"
  ).all(marketId) as Payout[];
}

export function listPayoutsByUser(userId: string): Payout[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId) as Payout[];
}

export function getPendingPayouts(marketId: string, limit = 50): Payout[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM payouts WHERE market_id = ? AND status = 'Pending' ORDER BY amount_wei DESC LIMIT ?"
  ).all(marketId, limit) as Payout[];
}

export function updatePayout(id: string, update: PayoutUpdate): Payout | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.status !== undefined) { sets.push("status = ?"); values.push(update.status); }
  if (update.payoutTx !== undefined) { sets.push("payout_tx = ?"); values.push(update.payoutTx); }

  if (sets.length === 0) return getPayoutById(id);

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  values.push(id);

  db.query(`UPDATE payouts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getPayoutById(id);
}

export function getPayoutStats(marketId: string): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  totalWei: string;
  sentWei: string;
} {
  const db = getDb();
  const result = db.query(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
      COALESCE(SUM(CAST(amount_wei AS INTEGER)), 0) as total_wei,
      COALESCE(SUM(CASE WHEN status = 'Sent' THEN CAST(amount_wei AS INTEGER) ELSE 0 END), 0) as sent_wei
     FROM payouts WHERE market_id = ?`
  ).get(marketId) as {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    total_wei: number;
    sent_wei: number;
  };

  return {
    total: result.total,
    pending: result.pending,
    sent: result.sent,
    failed: result.failed,
    totalWei: result.total_wei.toString(),
    sentWei: result.sent_wei.toString(),
  };
}

export function payoutExistsForUser(marketId: string, userId: string): boolean {
  const db = getDb();
  const result = db.query(
    "SELECT 1 FROM payouts WHERE market_id = ? AND user_id = ? LIMIT 1"
  ).get(marketId, userId);
  return result !== null;
}
