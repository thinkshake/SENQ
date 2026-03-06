/**
 * DB model for the outcomes table.
 * Each market has 2-5 outcomes that users can bet on.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface Outcome {
  id: string;
  market_id: string;
  label: string;
  total_amount_wei: string;
  display_order: number;
  created_at: string;
}

export interface OutcomeInsert {
  marketId: string;
  label: string;
  displayOrder?: number;
}

// ── Queries ────────────────────────────────────────────────────────

export function createOutcome(outcome: OutcomeInsert): Outcome {
  const db = getDb();
  const id = generateId("out");

  db.query(
    `INSERT INTO outcomes (id, market_id, label, display_order)
     VALUES (?, ?, ?, ?)`
  ).run(id, outcome.marketId, outcome.label, outcome.displayOrder ?? 0);

  return getOutcomeById(id)!;
}

export function createOutcomesBatch(
  marketId: string,
  outcomes: { label: string }[]
): Outcome[] {
  const db = getDb();
  const results: Outcome[] = [];

  const stmt = db.query(
    `INSERT INTO outcomes (id, market_id, label, display_order)
     VALUES (?, ?, ?, ?)`
  );

  for (let i = 0; i < outcomes.length; i++) {
    const id = generateId("out");
    stmt.run(id, marketId, outcomes[i].label, i);
    results.push(getOutcomeById(id)!);
  }

  return results;
}

export function getOutcomeById(id: string): Outcome | null {
  const db = getDb();
  return db.query("SELECT * FROM outcomes WHERE id = ?").get(id) as Outcome | null;
}

export function listOutcomesByMarket(marketId: string): Outcome[] {
  const db = getDb();
  return db
    .query("SELECT * FROM outcomes WHERE market_id = ? ORDER BY display_order ASC")
    .all(marketId) as Outcome[];
}

export function addToOutcomeTotal(id: string, amountWei: string): void {
  const db = getDb();
  db.query(
    `UPDATE outcomes SET
      total_amount_wei = CAST(CAST(total_amount_wei AS INTEGER) + ? AS TEXT)
     WHERE id = ?`
  ).run(amountWei, id);
}

export function getOutcomesWithProbability(
  marketId: string
): (Outcome & { probability: number })[] {
  const outcomes = listOutcomesByMarket(marketId);
  const totalPool = outcomes.reduce(
    (sum, o) => sum + BigInt(o.total_amount_wei),
    0n
  );

  if (totalPool === 0n) {
    const equalProb = Math.floor(100 / outcomes.length);
    const remainder = 100 - equalProb * outcomes.length;
    return outcomes.map((o, i) => ({
      ...o,
      probability: equalProb + (i === 0 ? remainder : 0),
    }));
  }

  const rawProbs = outcomes.map((o) => ({
    outcome: o,
    raw: Number((BigInt(o.total_amount_wei) * 10000n) / totalPool) / 100,
  }));

  const rounded = rawProbs.map((p) => Math.round(p.raw));
  const diff = 100 - rounded.reduce((s, v) => s + v, 0);
  if (diff !== 0) {
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }

  return rawProbs.map((p, i) => ({ ...p.outcome, probability: rounded[i] }));
}

export function deleteOutcomesByMarket(marketId: string): void {
  const db = getDb();
  db.query("DELETE FROM outcomes WHERE market_id = ?").run(marketId);
}
