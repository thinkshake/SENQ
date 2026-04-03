# Data Model Changes

## Current Schema (apps/api)

### markets
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
description TEXT
status TEXT DEFAULT 'pending'  -- pending, open, closed, resolved
betting_deadline TEXT
resolution_time TEXT
resolved_outcome TEXT  -- 'YES' or 'NO'
escrow_tx_hash TEXT
escrow_sequence INTEGER
issuer_address TEXT
yes_currency_code TEXT
no_currency_code TEXT
total_yes_amount TEXT DEFAULT '0'
total_no_amount TEXT DEFAULT '0'
created_at TEXT
updated_at TEXT
```

### bets
```sql
id TEXT PRIMARY KEY
market_id TEXT REFERENCES markets(id)
bettor_address TEXT NOT NULL
side TEXT NOT NULL  -- 'YES' or 'NO'
amount_drops TEXT NOT NULL
tx_hash TEXT
status TEXT DEFAULT 'pending'
created_at TEXT
```

## New Schema

### markets (modified)
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
description TEXT
category TEXT DEFAULT 'general'  -- politics, economy, local, culture, tech
category_label TEXT  -- 政治, 経済, 地域, 文化, テック
status TEXT DEFAULT 'pending'  -- pending, open, closed, resolved
betting_deadline TEXT
resolution_time TEXT
resolved_outcome_id TEXT  -- ID of winning outcome
escrow_tx_hash TEXT
escrow_sequence INTEGER
issuer_address TEXT
total_pool_drops TEXT DEFAULT '0'  -- Total XRP in pool
created_at TEXT
updated_at TEXT
```

### outcomes (new)
```sql
id TEXT PRIMARY KEY
market_id TEXT REFERENCES markets(id)
label TEXT NOT NULL  -- "村井嘉浩（現職）", "新人候補A", etc.
outcome_token TEXT  -- EVM outcome identifier
total_amount_drops TEXT DEFAULT '0'  -- Total bet on this outcome
display_order INTEGER DEFAULT 0
created_at TEXT
```

### user_attributes (new)
```sql
id TEXT PRIMARY KEY
wallet_address TEXT NOT NULL
attribute_type TEXT NOT NULL  -- 'region', 'expertise', 'experience'
attribute_label TEXT NOT NULL  -- "宮城県在住", "政治学専攻", etc.
weight REAL DEFAULT 1.0  -- Multiplier (e.g., 1.3, 1.5)
verified_at TEXT
created_at TEXT

UNIQUE(wallet_address, attribute_type, attribute_label)
```

### bets (modified)
```sql
id TEXT PRIMARY KEY
market_id TEXT REFERENCES markets(id)
outcome_id TEXT REFERENCES outcomes(id)  -- Changed from 'side'
bettor_address TEXT NOT NULL
amount_drops TEXT NOT NULL  -- Original amount
weight_score REAL DEFAULT 1.0  -- User's weight at bet time
effective_amount_drops TEXT NOT NULL  -- amount × weight
tx_hash TEXT
status TEXT DEFAULT 'pending'
created_at TEXT
```

## Weight Calculation

```typescript
function calculateWeightScore(attributes: Attribute[]): number {
  const BASE_WEIGHT = 1.0;
  const additionalWeight = attributes.reduce((sum, attr) => sum + (attr.weight - 1.0), 0);
  return Math.min(3.0, Math.max(0.5, BASE_WEIGHT + additionalWeight));
}
```

Weight ranges:
- Minimum: 0.5 (no relevant attributes)
- Base: 1.0 (new user, no attributes)
- Maximum: 3.0 (multiple high-value attributes)

## Category System

| Code | Label (JP) | Markets |
|------|-----------|---------|
| politics | 政治 | Elections, policy decisions |
| economy | 経済 | Economic indicators, prices |
| local | 地域 | Local events, regional |
| culture | 文化 | Entertainment, sports |
| tech | テック | Technology, product launches |
| general | その他 | Uncategorized |

## Migration Strategy

1. Add new columns to `markets` table (category, category_label)
2. Create `outcomes` table
3. Create `user_attributes` table
4. Modify `bets` table (add outcome_id, weight_score, effective_amount_drops)
5. Migrate existing YES/NO bets to new outcome format
