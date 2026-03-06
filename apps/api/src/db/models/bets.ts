/**
 * DB model for the bets table.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type BetStatus = "Pending" | "Confirmed" | "Failed" | "Refunded";
export type BetOutcome = "YES" | "NO";

export interface Bet {
  id: string;
  market_id: string;
  user_id: string;
  outcome: BetOutcome;
  outcome_id: string | null;
  amount_wei: string;
  weight_score: number;
  effective_amount_wei: string | null;
  status: BetStatus;
  placed_at: string;
  payment_tx: string | null;
  memo_json: string | null;
}

export interface BetInsert {
  marketId: string;
  userId: string;
  outcome: BetOutcome;
  outcomeId?: string;
  amountWei: string;
  weightScore?: number;
  effectiveAmountWei?: string;
  memoJson?: string;
}

export interface BetUpdate {
  status?: BetStatus;
  paymentTx?: string;
}

// ── Queries ────────────────────────────────────────────────────────

export function createBet(bet: BetInsert): Bet {
  const db = getDb();
  const id = generateId("bet");
  const weightScore = bet.weightScore ?? 1.0;
  const effectiveAmountWei =
    bet.effectiveAmountWei ??
    Math.round(Number(bet.amountWei) * weightScore).toString();

  db.query(
    `INSERT INTO bets (id, market_id, user_id, outcome, outcome_id, amount_wei,
      weight_score, effective_amount_wei, status, memo_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`
  ).run(
    id,
    bet.marketId,
    bet.userId,
    bet.outcome,
    bet.outcomeId ?? null,
    bet.amountWei,
    weightScore,
    effectiveAmountWei,
    bet.memoJson ?? null
  );

  return getBetById(id)!;
}

export function getBetById(id: string): Bet | null {
  const db = getDb();
  return db.query("SELECT * FROM bets WHERE id = ?").get(id) as Bet | null;
}

export function getBetByPaymentTx(paymentTx: string): Bet | null {
  const db = getDb();
  return db.query("SELECT * FROM bets WHERE payment_tx = ?").get(paymentTx) as Bet | null;
}

export function listBetsByMarket(marketId: string, status?: BetStatus): Bet[] {
  const db = getDb();
  if (status) {
    return db.query(
      "SELECT * FROM bets WHERE market_id = ? AND status = ? ORDER BY placed_at DESC"
    ).all(marketId, status) as Bet[];
  }
  return db.query(
    "SELECT * FROM bets WHERE market_id = ? ORDER BY placed_at DESC"
  ).all(marketId) as Bet[];
}

export function listBetsByUser(userId: string): Bet[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC"
  ).all(userId) as Bet[];
}

export function listConfirmedBetsByOutcome(marketId: string, outcome: BetOutcome): Bet[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM bets
     WHERE market_id = ? AND outcome = ? AND status = 'Confirmed'
     ORDER BY placed_at ASC`
  ).all(marketId, outcome) as Bet[];
}

export function listConfirmedBetsByOutcomeId(marketId: string, outcomeId: string): Bet[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM bets
     WHERE market_id = ? AND outcome_id = ? AND status = 'Confirmed'
     ORDER BY placed_at ASC`
  ).all(marketId, outcomeId) as Bet[];
}

export function getTotalEffectiveAmount(marketId: string, outcomeId?: string): string {
  const db = getDb();
  if (outcomeId) {
    const result = db.query(
      `SELECT COALESCE(SUM(CAST(effective_amount_wei AS INTEGER)), 0) as total
       FROM bets WHERE market_id = ? AND outcome_id = ? AND status = 'Confirmed'`
    ).get(marketId, outcomeId) as { total: number };
    return result.total.toString();
  }
  const result = db.query(
    `SELECT COALESCE(SUM(CAST(effective_amount_wei AS INTEGER)), 0) as total
     FROM bets WHERE market_id = ? AND status = 'Confirmed'`
  ).get(marketId) as { total: number };
  return result.total.toString();
}

export function updateBet(id: string, update: BetUpdate): Bet | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.status !== undefined) { sets.push("status = ?"); values.push(update.status); }
  if (update.paymentTx !== undefined) { sets.push("payment_tx = ?"); values.push(update.paymentTx); }

  if (sets.length === 0) return getBetById(id);

  values.push(id);
  db.query(`UPDATE bets SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getBetById(id);
}

export function getTotalBetAmount(marketId: string, outcome?: BetOutcome): string {
  const db = getDb();
  if (outcome) {
    const result = db.query(
      `SELECT COALESCE(SUM(CAST(amount_wei AS INTEGER)), 0) as total
       FROM bets WHERE market_id = ? AND outcome = ? AND status = 'Confirmed'`
    ).get(marketId, outcome) as { total: number };
    return result.total.toString();
  }
  const result = db.query(
    `SELECT COALESCE(SUM(CAST(amount_wei AS INTEGER)), 0) as total
     FROM bets WHERE market_id = ? AND status = 'Confirmed'`
  ).get(marketId) as { total: number };
  return result.total.toString();
}

export function getStalePendingBets(olderThanMinutes: number): Bet[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM bets
     WHERE status = 'Pending'
     AND datetime(placed_at) < datetime('now', '-' || ? || ' minutes')`
  ).all(olderThanMinutes) as Bet[];
}
