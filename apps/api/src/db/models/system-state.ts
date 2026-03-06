/**
 * DB model for the system_state key-value table.
 *
 * Used to persist sync cursors (e.g. last_block_number) and other
 * runtime configuration that must survive restarts.
 */
import { getDb } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface SystemState {
  key: string;
  value: string;
  updated_at: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Get a value by key. Returns null if the key does not exist.
 */
export function getSystemState(key: string): string | null {
  const db = getDb();
  const row = db
    .query("SELECT value FROM system_state WHERE key = ?")
    .get(key) as { value: string } | null;
  return row?.value ?? null;
}

/**
 * Set (upsert) a key-value pair.
 */
export function setSystemState(key: string, value: string): void {
  const db = getDb();
  db.query(
    `INSERT INTO system_state (key, value, updated_at)
     VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     ON CONFLICT(key) DO UPDATE
       SET value = excluded.value,
           updated_at = excluded.updated_at`
  ).run(key, value);
}

/**
 * Get all entries.
 */
export function getAllSystemState(): SystemState[] {
  const db = getDb();
  return db.query("SELECT * FROM system_state").all() as SystemState[];
}

/**
 * Delete an entry by key.
 */
export function deleteSystemState(key: string): void {
  const db = getDb();
  db.query("DELETE FROM system_state WHERE key = ?").run(key);
}
