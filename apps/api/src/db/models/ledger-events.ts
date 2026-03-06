/**
 * DB model for the chain_events table.
 *
 * Provides idempotent ingestion of EVM transaction events via
 * INSERT OR IGNORE on the unique tx_hash column.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface ChainEvent {
  id: string;
  tx_hash: string;
  event_type: string;
  market_id: string | null;
  payload_json: string;
  block_number: number;
  created_at: string;
}

export interface ChainEventInsert {
  txHash: string;
  eventType: string;
  marketId?: string;
  payloadJson: string;
  blockNumber: number;
}

// ── Queries ────────────────────────────────────────────────────────

export function insertChainEvent(event: ChainEventInsert): void {
  const db = getDb();
  const id = generateId("evt");
  db.query(
    `INSERT OR IGNORE INTO chain_events
       (id, tx_hash, event_type, market_id, payload_json, block_number)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    event.txHash,
    event.eventType,
    event.marketId ?? null,
    event.payloadJson,
    event.blockNumber
  );
}

export function getChainEventByTxHash(txHash: string): ChainEvent | null {
  const db = getDb();
  return (
    db
      .query("SELECT * FROM chain_events WHERE tx_hash = ?")
      .get(txHash) as ChainEvent | null
  );
}

export function getChainEventsByMarket(marketId: string): ChainEvent[] {
  const db = getDb();
  return db
    .query(
      "SELECT * FROM chain_events WHERE market_id = ? ORDER BY block_number ASC"
    )
    .all(marketId) as ChainEvent[];
}
