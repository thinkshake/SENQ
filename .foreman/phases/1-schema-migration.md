# Phase 1: Schema Migration

## Scope
Update SQLite schema to support multi-outcome markets and user attributes.

## Deliverables

1. **New migration file** — `apps/api/src/db/migrations/002_multi_outcome.sql`
2. **Updated models** — Modify markets.ts, bets.ts; create outcomes.ts, user-attributes.ts
3. **Seed data** — Demo markets with multi-outcome structure

## Tasks

### 1.1 Create Migration SQL
```sql
-- Add category columns to markets
ALTER TABLE markets ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE markets ADD COLUMN category_label TEXT;

-- Rename total columns for clarity
ALTER TABLE markets RENAME COLUMN total_yes_amount TO total_pool_drops;
-- Remove total_no_amount (now calculated from outcomes)

-- Create outcomes table
CREATE TABLE outcomes (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id),
  label TEXT NOT NULL,
  currency_code TEXT,
  total_amount_drops TEXT DEFAULT '0',
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create user_attributes table
CREATE TABLE user_attributes (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  attribute_type TEXT NOT NULL,
  attribute_label TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(wallet_address, attribute_type, attribute_label)
);

-- Modify bets table
ALTER TABLE bets ADD COLUMN outcome_id TEXT REFERENCES outcomes(id);
ALTER TABLE bets ADD COLUMN weight_score REAL DEFAULT 1.0;
ALTER TABLE bets ADD COLUMN effective_amount_drops TEXT;
```

### 1.2 Update Market Model
- Add getMarketWithOutcomes() function
- Add createMarketWithOutcomes() function
- Calculate probabilities from outcome totals

### 1.3 Create Outcome Model
- CRUD operations for outcomes
- Currency code generation (e.g., "M1O1" for Market 1 Outcome 1)

### 1.4 Create User Attributes Model
- getAttributesForUser(address)
- addAttribute(address, type, label, weight)
- removeAttribute(id)
- calculateWeightScore(attributes)

### 1.5 Update Bet Model
- Change from side (YES/NO) to outcome_id
- Add weight_score and effective_amount_drops fields

### 1.6 Create Seed Data
Create demo markets matching apps/mock data:
- 宮城県知事選挙の当選者予想 (4 outcomes)
- 2026年の日本国内の米の平均価格帯 (4 outcomes)
- 2026年 日銀の政策金利 年末時点 (4 outcomes)

## Acceptance Criteria

- [ ] Migration runs without errors
- [ ] Can create market with 3+ outcomes
- [ ] Can query market and get outcomes with probabilities
- [ ] Can create user attributes
- [ ] Weight score calculation works (0.5 to 3.0 range)
- [ ] Existing data (if any) not corrupted

## Implementation Notes

- Use UUID v4 for outcome IDs
- Outcome IDs: UUID assigned at market creation
- Keep old yes_currency_code/no_currency_code columns for backward compat
- SQLite ALTER TABLE limitations: may need table recreation for some changes
