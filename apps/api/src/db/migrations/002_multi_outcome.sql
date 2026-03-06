-- MITATE Multi-Outcome Migration (EVM)
-- Adds multi-outcome markets, user attributes, and weighted betting

-- ── Markets: add category_label and resolved_outcome_id ────────────

ALTER TABLE markets ADD COLUMN category_label TEXT;
ALTER TABLE markets ADD COLUMN resolved_outcome_id TEXT;

-- ── Outcomes table (new) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  label TEXT NOT NULL,
  total_amount_wei TEXT NOT NULL DEFAULT '0',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (market_id) REFERENCES markets(id)
);

CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_id);

-- ── User attributes table (new) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_attributes (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  attribute_type TEXT NOT NULL,
  attribute_label TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(wallet_address, attribute_type, attribute_label)
);

CREATE INDEX IF NOT EXISTS idx_user_attributes_wallet ON user_attributes(wallet_address);

-- ── Bets: add outcome_id, weight_score, effective_amount_wei ──────

ALTER TABLE bets ADD COLUMN outcome_id TEXT REFERENCES outcomes(id);
ALTER TABLE bets ADD COLUMN weight_score REAL NOT NULL DEFAULT 1.0;
ALTER TABLE bets ADD COLUMN effective_amount_wei TEXT;

CREATE INDEX IF NOT EXISTS idx_bets_outcome ON bets(outcome_id);

-- ── Backfill: set effective_amount_wei = amount_wei for existing bets
UPDATE bets SET effective_amount_wei = amount_wei WHERE effective_amount_wei IS NULL;
