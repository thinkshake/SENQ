# Phase Brief: 2-api-extension

**Generated:** 2026-02-13T00:04:22+09:00
**Status:** planned

## Project Context

**Name:** senq-ui-migration

## Requirements

# SENQ UI Migration Requirements

## Background

SENQ is a prediction market on Avalanche C-Chain for the Avalanche Build Games hackathon. The initial implementation is complete with:
- Backend API (Hono + SQLite + viem)
- EVM integration (ERC20 JPYC, SENQMarket contract, Multi-Sign)
- Basic frontend (apps/web) with MetaMask integration

A team member created a new UI design in `apps/mock/` with superior design and new features. This migration integrates that UI with our existing backend while adding new capabilities.

## Goals

1. Replace `apps/web` with the new UI from `apps/mock/`
2. Add multi-outcome market support (not just YES/NO)
3. Implement weighted betting system (user attributes affect bet weight)
4. Integrate with existing EVM backend
5. Keep Japanese UI language
6. Use JPYC as currency

## Non-Goals

- Admin panel UI (use API/CLI for market management)
- Mobile app
- Mainnet deployment (Testnet only for hackathon)

## Features to Migrate from apps/mock

### UI Components
- Site header with wallet connection
- Market listing page with filter bar (category, status)
- Market detail page with outcomes list
- Bet panel with amount input and quick select
- My Page (portfolio with positions)
- Market card component with category badges

### New Features to Implement
1. **Multi-Outcome Markets** — Support 2-5 outcomes per market (not just YES/NO)
2. **Weighted Betting** — User attributes (region, expertise, experience) multiply bet effectiveness
3. **Attribute System** — Users can register verified attributes that grant weight bonuses
4. **Category System** — Markets belong to categories (政治, 経済, 地域, etc.)

## Technical Constraints

- Keep bun as package manager
- Keep MetaMask as wallet
- Keep JPYC as currency
- Keep existing API structure in apps/api
- Must work with existing EVM transaction builders

## API Changes Required

### Markets
- Add `outcomes` field (array of {id, label, probability})
- Add `category` and `categoryLabel` fields
- Change from hardcoded YES/NO to dynamic outcomes

### Users/Attributes
- New endpoint: GET/POST /users/:address/attributes
- Store verified attributes per wallet address
- Calculate weight score from attributes

### Bets
- Update to reference outcome ID (not just "YES"/"NO")
- Store weight multiplier applied at bet time
- Calculate effective amount (amount × weight)

## Acceptance Criteria

1. Homepage shows market list with category filter
2. Market detail shows all outcomes with probabilities
3. Users can connect MetaMask and see their address
4. Users can place bets on any outcome with JPYC
5. Bet amounts are multiplied by user's weight score
6. Portfolio page shows user's positions
7. All EVM transactions work (contract calls, JPYC transfers, etc.)

## Tech Stack

- Frontend: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- Backend: Hono, SQLite, viem
- Wallet: MetaMask
- Chain: Avalanche C-Chain (Fuji Testnet)

## Design Context

## api.md

# API Design

## Base URL
`http://localhost:3001` (dev) / `https://api.senq.app` (prod)

## Endpoints

### Markets

#### GET /markets
List all markets with optional filters.

Query params:
- `status` — Filter by status (open, closed, resolved)
- `category` — Filter by category (politics, economy, etc.)

Response:
```json
{
  "markets": [
    {
      "id": "m1",
      "title": "宮城県知事選挙の当選者予想",
      "description": "2026年に予定される宮城県知事選挙...",
      "category": "politics",
      "categoryLabel": "政治",
      "status": "open",
      "bettingDeadline": "2026-06-15T00:00:00Z",
      "totalPoolDrops": "1234500000000",
      "outcomes": [
        { "id": "o1", "label": "村井嘉浩（現職）", "probability": 42, "totalAmountDrops": "518490000000" },
        { "id": "o2", "label": "新人候補A", "probability": 28, "totalAmountDrops": "345660000000" },
        { "id": "o3", "label": "新人候補B", "probability": 18, "totalAmountDrops": "222210000000" },
        { "id": "o4", "label": "その他", "probability": 12, "totalAmountDrops": "148140000000" }
      ],
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

#### GET /markets/:id
Get single market with full details.

Response: Same as market object above, plus:
```json
{
  "escrowTxHash": "ABC123...",
  "escrowSequence": 12345,
  "resolutionTime": "2026-06-20T00:00:00Z",
  "resolvedOutcomeId": null
}
```

#### POST /markets
Create a new market (admin only).

Request:
```json
{
  "title": "市場タイトル",
  "description": "詳細説明",
  "category": "politics",
  "categoryLabel": "政治",
  "bettingDeadline": "2026-06-15T00:00:00Z",
  "resolutionTime": "2026-06-20T00:00:00Z",
  "outcomes": [
    { "label": "候補A" },
    { "label": "候補B" },
    { "label": "その他" }
  ]
}
```

Response: Created market object with IDs assigned.

#### POST /markets/:id/resolve
Resolve a market (admin/multi-sign only).

Request:
```json
{
  "outcomeId": "o1",
  "txHash": "DEF456..."
}
```

---

### Bets

#### GET /markets/:id/bets
Get recent bets for a market.

Query params:
- `limit` — Max results (default 20)

Response:
```json
{
  "bets": [
    {
      "id": "b1",
      "marketId": "m1",
      "outcomeId": "o1",
      "outcomeLabel": "村井嘉浩（現職）",
      "bettorAddress": "rXXX...",
      "amountDrops": "10000000",
      "weightScore": 1.5,
      "effectiveAmountDrops": "15000000",
      "txHash": "ABC...",
      "createdAt": "2026-02-10T12:00:00Z"
    }
  ]
}
```

#### POST /markets/:id/bets
Place a bet.

Request:
```json
{
  "outcomeId": "o1",
  "bettorAddress": "rXXX...",
  "amountDrops": "10000000"
}
```

Response:
```json
{
  "bet": { ... },
  "weightScore": 1.5,
  "effectiveAmountDrops": "15000000",
  "unsignedTx": { /* EVM transaction to sign */ }
}
```

#### POST /markets/:id/bets/:betId/confirm
Confirm a bet after EVM transaction.

Request:
```json
{
  "txHash": "ABC123..."
}
```

#### GET /markets/:id/preview
Preview potential payout for a bet.

Query params:
- `outcomeId` — Outcome to bet on
- `amountDrops` — Amount in drops
- `bettorAddress` — For weight calculation

Response:
```json
{
  "potentialPayout": "25000000",
  "impliedOdds": "2.5",
  "weightScore": 1.5,
  "effectiveAmount": "15000000",
  "newProbability": 45
}
```

---

### User Attributes

#### GET /users/:address/attributes
Get user's verified attributes.

Response:
```json
{
  "address": "rXXX...",
  "weightScore": 1.8,
  "attributes": [
    {
      "id": "a1",
      "type": "region",
      "typeLabel": "地域",
      "label": "宮城県在住",
      "weight": 1.5,
      "verifiedAt": "2026-01-10T00:00:00Z"
    },
    {
      "id": "a2",
      "type": "expertise",
      "typeLabel": "専門知識",
      "label": "政治学専攻",
      "weight": 1.2,
      "verifiedAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

#### POST /users/:address/attributes
Add a new attribute (admin verification flow).

Request:
```json
{
  "type": "region",
  "label": "東京都在住",
  "weight": 1.3
}
```

#### DELETE /users/:address/attributes/:id
Remove an attribute.

---

### User Bets (Portfolio)

#### GET /users/:address/bets
Get all bets for a user.

Query params:
- `status` — Filter by bet status (open, closed)

Response:
```json
{
  "bets": [
    {
      "id": "b1",
      "marketId": "m1",
      "marketTitle": "宮城県知事選挙の当選者予想",
      "outcomeId": "o1",
      "outcomeLabel": "村井嘉浩（現職）",
      "amountDrops": "10000000",
      "weightScore": 1.5,
      "effectiveAmountDrops": "15000000",
      "currentProbability": 42,
      "status": "open",
      "createdAt": "2026-02-10T12:00:00Z"
    }
  ],
  "totalBets": 3,
  "totalAmountDrops": "35000000"
}
```

---

### Categories

#### GET /categories
Get available market categories.

Response:
```json
{
  "categories": [
    { "value": "all", "label": "すべて" },
    { "value": "politics", "label": "政治" },
    { "value": "economy", "label": "経済" },
    { "value": "local", "label": "地域" },
    { "value": "culture", "label": "文化" },
    { "value": "tech", "label": "テック" }
  ]
}
```

---

## Error Responses

All errors follow:
```json
{
  "error": {
    "code": "MARKET_NOT_FOUND",
    "message": "Market with ID m999 not found"
  }
}
```

Common codes:
- `MARKET_NOT_FOUND`
- `OUTCOME_NOT_FOUND`
- `INVALID_AMOUNT`
- `BETTING_CLOSED`
- `INSUFFICIENT_BALANCE`
- `WALLET_NOT_CONNECTED`

---

## data-model.md

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

---

## ui-architecture.md

# UI Architecture

## Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage (market list)
│   ├── market/
│   │   └── [id]/
│   │       └── page.tsx     # Market detail
│   └── mypage/
│       └── page.tsx         # Portfolio/positions
├── components/
│   ├── site-header.tsx      # Header with wallet
│   ├── market-card.tsx      # Market list item
│   ├── markets-grid.tsx     # Market grid container
│   ├── filter-bar.tsx       # Category/status filters
│   ├── market-detail.tsx    # Full market view
│   ├── outcomes-list.tsx    # Outcome selection
│   ├── bet-panel.tsx        # Betting interface
│   ├── market-info-box.tsx  # Market stats
│   ├── position-box.tsx     # User's positions
│   ├── profile-section.tsx  # User attributes
│   ├── active-bets.tsx      # Portfolio bets list
│   └── ui/                  # shadcn components
├── contexts/
│   └── WalletContext.tsx    # MetaMask state
├── hooks/
│   ├── useMarkets.ts        # Market data fetching
│   ├── useUser.ts           # User attributes/bets
│   └── useMobile.ts         # Responsive detection
├── lib/
│   ├── api.ts               # API client
│   └── utils.ts             # Utilities
└── styles/
    └── globals.css          # Tailwind + custom
```

## Component Migration Map

| apps/mock | apps/web (new) | Changes |
|-----------|---------------|---------|
| site-header.tsx | site-header.tsx | Add MetaMask, JPYC balance |
| market-card.tsx | market-card.tsx | Fetch from API, JPYC amounts |
| market-detail.tsx | market-detail.tsx | API integration, wallet tx |
| bet-panel.tsx | bet-panel.tsx | MetaMask signing, JPYC |
| outcomes-list.tsx | outcomes-list.tsx | Minimal changes |
| filter-bar.tsx | filter-bar.tsx | Minimal changes |
| my-page.tsx | mypage/page.tsx | API integration |
| profile-section.tsx | profile-section.tsx | API integration |
| active-bets.tsx | active-bets.tsx | API integration |
| ❌ admin-*.tsx | (skipped) | Admin via API only |

## State Management

### WalletContext (existing, enhanced)
```typescript
interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  balance: string | null;  // NEW: JPYC balance
  loading: boolean;
  error: string | null;
  gemWalletInstalled: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (tx: unknown) => Promise<{ hash: string } | null>;
  refreshBalance: () => Promise<void>;  // NEW
}
```

### UserContext (new)
```typescript
interface UserState {
  attributes: Attribute[];
  weightScore: number;
  loading: boolean;
}

interface UserContextType extends UserState {
  fetchAttributes: (address: string) => Promise<void>;
  addAttribute: (attr: NewAttribute) => Promise<void>;
}
```

## Data Flow

### Market List Page
```
Page Load
  → useMarkets(filters)
  → GET /markets?category=X&status=Y
  → Render MarketCard[] with real probabilities
```

### Market Detail Page
```
Page Load
  → useMarket(id)
  → GET /markets/:id
  → Render outcomes, bet panel

Bet Flow
  → User selects outcome, enters amount
  → POST /markets/:id/bets (get unsigned tx)
  → signAndSubmitTransaction(tx)
  → POST /markets/:id/bets/:id/confirm
  → Refetch market data
```

### My Page
```
Page Load
  → useUser(address)
  → GET /users/:address/attributes
  → GET /users/:address/bets
  → Render profile + positions
```

## Currency Display

Use JPYC for all amounts:

```typescript
// apps/mock (JPYC)
formatVolume(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`
}

// apps/web (JPYC)
formatJpyc(amount: string): string {
  const xrp = Number(drops) / 1_000_000;
  return `${jpyc.toLocaleString("ja-JP")} JPYC`;
}
```

UI changes:
- "¥12,500 JPYC" — JPYC amounts displayed directly
- Quick amounts: 100, 500, 1000, 5000 JPYC
- All internal amounts in JPYC (18 decimals)

## Japanese Text

Keep all UI text in Japanese from apps/mock:
- Navigation: マーケット, マイページ
- Buttons: 予測する, 接続中
- Labels: ベット金額, 利用可能, 重みスコア
- Status: オープン, クローズ, 解決済み

## Responsive Design

apps/mock already has mobile support via:
- `use-mobile.tsx` hook
- Tailwind responsive classes (`lg:`, `md:`, `sm:`)
- Flexible grid layouts

Preserve all responsive behavior.

## shadcn/ui Components Used

From apps/mock (to migrate):
- Button, Card, Input, Label
- Select, Tabs, Badge
- Dialog, DropdownMenu
- Tooltip, Toast

Already in apps/web:
- Button, Card, Input
- DropdownMenu, Separator
- Tabs, Badge

## Phase Overview

# Phase Overview

Total phases: 5
Estimated time: 2-3 days

## Phase Order

1. **schema-migration** — Database changes for multi-outcome and attributes
2. **api-extension** — New endpoints and modified responses
3. **ui-foundation** — Migrate base components and providers
4. **market-pages** — Homepage, market detail, betting flow
5. **user-features** — My Page, portfolio, attributes display

## Dependencies

```
schema-migration
       ↓
  api-extension
       ↓
  ui-foundation
       ↓
   market-pages
       ↓
  user-features
```

Each phase builds on the previous. No parallel execution.

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| schema-migration | Existing data migration | Keep old columns, add new ones |
| api-extension | Breaking API changes | Version responses, update frontend in sync |
| ui-foundation | shadcn version conflicts | Use apps/mock versions, test early |
| market-pages | EVM contract integration | Multi-outcome support needs outcome ID mapping |
| user-features | Weight calculation edge cases | Cap at 0.5-3.0 range |

## Definition of Done

- All phases complete
- Docker compose runs successfully
- MetaMask can connect
- Can view markets with multiple outcomes
- Can place bet on any outcome
- Portfolio shows positions
- All Japanese UI text preserved

## Dependencies

- **1-schema-migration**: ✅ `done`

## Phase Spec: 2-api-extension

# Phase 2: API Extension

## Scope
Extend API endpoints to support multi-outcome markets and user attributes.

## Deliverables

1. **Modified routes** — Update markets.ts, bets.ts
2. **New routes** — Create users.ts for attributes
3. **New route** — Create categories.ts
4. **Updated services** — Extend business logic

## Tasks

### 2.1 Update Markets Routes

#### GET /markets
- Add `category` query param filter
- Include `outcomes` array in response
- Include `categoryLabel` field
- Calculate probability per outcome

#### GET /markets/:id
- Full outcome details
- Include total pool calculation

#### POST /markets
- Accept `outcomes` array in request
- Accept `category` and `categoryLabel`
- Create outcome records with currency codes
- Generate unique currency codes per outcome

### 2.2 Update Bets Routes

#### GET /markets/:id/bets
- Include `outcomeId` and `outcomeLabel`
- Include `weightScore` and `effectiveAmountDrops`

#### POST /markets/:id/bets
- Accept `outcomeId` instead of `side`
- Look up user attributes for weight calculation
- Calculate `effectiveAmountDrops = amount × weightScore`
- Build EVM tx for correct outcome

#### GET /markets/:id/preview
- Accept `outcomeId`
- Accept `bettorAddress` for weight lookup
- Return `weightScore` and `effectiveAmount`

### 2.3 Create Users Routes

New file: `apps/api/src/routes/users.ts`

#### GET /users/:address/attributes
- Return all verified attributes
- Return calculated weightScore

#### POST /users/:address/attributes
- Add new attribute (admin flow)
- Validate type (region/expertise/experience)
- Default weights by type

#### DELETE /users/:address/attributes/:id
- Remove attribute

#### GET /users/:address/bets
- Return all bets for user
- Include market title, outcome label
- Include current probability

### 2.4 Create Categories Route

New file: `apps/api/src/routes/categories.ts`

#### GET /categories
- Return static category list
- Japanese labels

### 2.5 Update Services

#### markets.ts
- `createMarketWithOutcomes(data, outcomes[])`
- `getMarketWithOutcomes(id)`
- `calculateOutcomeProbabilities(outcomes[])`

#### bets.ts
- `createBetWithWeight(marketId, outcomeId, address, amount)`
- `getBetsForMarket(marketId)` — include outcome info

#### New: users.ts
- `getUserAttributes(address)`
- `addUserAttribute(address, type, label, weight)`
- `calculateWeightScore(attributes)`

### 2.6 Update EVM Transaction Builder

- `buildOutcomePaymentTx(market, outcome, amount, sender)`
- Generate correct currency code for outcome
- Keep memo structure with outcome ID

## Acceptance Criteria

- [ ] GET /markets returns outcomes array
- [ ] GET /markets?category=politics filters correctly
- [ ] POST /markets creates market with outcomes
- [ ] POST /bets accepts outcomeId
- [ ] GET /users/:address/attributes returns attributes
- [ ] Weight calculation applied to bets
- [ ] All existing tests pass (if any)

## Implementation Notes

- Currency code format: `O` + first 2 chars of outcome ID (e.g., "Oa1b")
- Maintain backward compatibility for existing binary markets
- Weight score cached at bet time (not recalculated on read)

## Implementation Guidelines

- This phase is currently: **planned**
- Ready to start implementation

### Related Phases

- ✅ 1-schema-migration (`done`)
- ⬜ 3-ui-foundation (`planned`)
- ⬜ 4-market-pages (`planned`)
- ⬜ 5-user-features (`planned`)

### Completion

When this phase is complete:
- Run `foreman phase 2-api-extension done` to mark it as finished
- Ensure all deliverables are implemented and tested
- Document any changes or decisions made during implementation
