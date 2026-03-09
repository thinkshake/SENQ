# Phase Brief: 3-ui-foundation

**Generated:** 2026-02-13T00:35:30+09:00
**Status:** planned

## Project Context

**Name:** senq-ui-migration

## Requirements

# SENQ UI Migration Requirements

## Background

SENQ is an XRPL-powered prediction market for the JFIIP hackathon (demo day: Feb 24, 2026). The initial implementation is complete with:
- Backend API (Hono + SQLite + xrpl.js)
- XRPL integration (Escrow, Issued Currency, Trust Lines, DEX, Multi-Sign, Memo)
- Basic frontend (apps/web) with GemWallet integration

A team member created a new UI design in `apps/mock/` with superior design and new features. This migration integrates that UI with our existing backend while adding new capabilities.

## Goals

1. Replace `apps/web` with the new UI from `apps/mock/`
2. Add multi-outcome market support (not just YES/NO)
3. Implement weighted betting system (user attributes affect bet weight)
4. Integrate with existing XRPL backend
5. Keep Japanese UI language
6. Use XRP as currency (not JPYC from mock)

## Non-Goals

- Admin panel UI (use API/CLI for market management)
- Mobile app
- Mainnet deployment (Testnet only for hackathon)
- JPYC or other stablecoins

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
- Keep GemWallet as wallet (no other wallets)
- Keep XRP as currency (convert JPYC references)
- Keep existing API structure in apps/api
- Must work with existing XRPL transaction builders

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
3. Users can connect GemWallet and see their address
4. Users can place bets on any outcome with XRP
5. Bet amounts are multiplied by user's weight score
6. Portfolio page shows user's positions
7. All XRPL transactions work (escrow, tokens, etc.)

## Tech Stack

- Frontend: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- Backend: Hono, SQLite, xrpl.js
- Wallet: GemWallet (@gemwallet/api)
- XRPL: Testnet

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
  "unsignedTx": { /* XRPL transaction to sign */ }
}
```

#### POST /markets/:id/bets/:betId/confirm
Confirm a bet after XRPL transaction.

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
currency_code TEXT  -- XRPL issued currency code for this outcome
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
│   └── WalletContext.tsx    # GemWallet state
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
| site-header.tsx | site-header.tsx | Add GemWallet, XRP balance |
| market-card.tsx | market-card.tsx | Fetch from API, XRP amounts |
| market-detail.tsx | market-detail.tsx | API integration, wallet tx |
| bet-panel.tsx | bet-panel.tsx | GemWallet signing, XRP |
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
  balance: string | null;  // NEW: XRP balance in drops
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

Convert JPYC references to XRP:

```typescript
// apps/mock (JPYC)
formatVolume(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`
}

// apps/web (XRP)
formatXrp(drops: string): string {
  const xrp = Number(drops) / 1_000_000;
  return `${xrp.toLocaleString("ja-JP")} XRP`;
}
```

UI changes:
- "¥12,500 JPYC" → "12.5 XRP"
- Quick amounts: 100, 500, 1000, 5000 JPYC → 1, 5, 10, 50 XRP
- All internal amounts in drops (1 XRP = 1,000,000 drops)

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
| market-pages | XRPL transaction changes | Multi-outcome tokens need new currency codes |
| user-features | Weight calculation edge cases | Cap at 0.5-3.0 range |

## Definition of Done

- All phases complete
- Docker compose runs successfully
- GemWallet can connect
- Can view markets with multiple outcomes
- Can place bet on any outcome
- Portfolio shows positions
- All Japanese UI text preserved

## Dependencies

- **1-schema-migration**: ✅ `done`
- **2-api-extension**: ✅ `done`

## Phase Spec: 3-ui-foundation

# Phase 3: UI Foundation

## Scope
Migrate base UI components, styles, and providers from apps/mock to apps/web.

## Deliverables

1. **Updated styles** — Tailwind config, globals.css
2. **Migrated shadcn components** — Full UI component library
3. **Updated providers** — Layout with theme, toast
4. **Utility functions** — Formatting, hooks

## Tasks

### 3.1 Update Tailwind Config
Copy `apps/mock/tailwind.config.ts` to `apps/web/`:
- CSS variables for theming
- Dark mode support (class-based)
- Custom animations

### 3.2 Update Global Styles
Merge `apps/mock/app/globals.css` into `apps/web/app/globals.css`:
- CSS custom properties
- Base styles
- Utility classes

### 3.3 Migrate shadcn Components
Copy from `apps/mock/components/ui/` to `apps/web/components/ui/`:
- accordion.tsx
- alert-dialog.tsx
- avatar.tsx
- badge.tsx
- button.tsx (replace existing)
- card.tsx (replace existing)
- dialog.tsx
- input.tsx
- label.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- select.tsx
- separator.tsx
- slider.tsx
- tabs.tsx
- toast.tsx, toaster.tsx, use-toast.ts
- tooltip.tsx

### 3.4 Update Layout
Modify `apps/web/app/layout.tsx`:
- Add ThemeProvider (if dark mode needed)
- Add Toaster component
- Update metadata (Japanese)

### 3.5 Create/Update Hooks
Copy from `apps/mock/hooks/`:
- `use-mobile.tsx` — Responsive detection
- `use-toast.ts` — Toast notifications

Update existing:
- `useMarkets.ts` — Add category filter support

### 3.6 Update API Client
Modify `apps/web/lib/api.ts`:
- Add type definitions for new response shapes
- Add `fetchCategories()`
- Add `fetchUserAttributes(address)`
- Add `fetchUserBets(address)`
- Update `fetchMarkets()` for category filter
- Update bet functions for outcomeId

### 3.7 Create UserContext
New file: `apps/web/contexts/UserContext.tsx`:
```typescript
interface UserContextType {
  attributes: Attribute[];
  weightScore: number;
  bets: Bet[];
  loading: boolean;
  fetchUser: (address: string) => Promise<void>;
}
```

### 3.8 Update WalletContext
Modify `apps/web/contexts/WalletContext.tsx`:
- Add `balance` state (XRP balance in drops)
- Add `refreshBalance()` function
- Format balance for display

### 3.9 Add Utility Functions
Create/update `apps/web/lib/utils.ts`:
```typescript
// From apps/mock
export function cn(...inputs: ClassValue[]) { ... }

// Currency formatting (XRP instead of JPYC)
export function formatXrp(drops: string | number): string {
  const xrp = Number(drops) / 1_000_000;
  return `${xrp.toLocaleString("ja-JP")} XRP`;
}

export function formatXrpCompact(drops: string | number): string {
  const xrp = Number(drops) / 1_000_000;
  if (xrp >= 1000) return `${(xrp/1000).toFixed(1)}K XRP`;
  return `${xrp.toFixed(0)} XRP`;
}

export function xrpToDrops(xrp: number): string {
  return String(Math.floor(xrp * 1_000_000));
}
```

## Acceptance Criteria

- [ ] Tailwind styles match apps/mock design
- [ ] All shadcn components render correctly
- [ ] Toast notifications work
- [ ] WalletContext still connects GemWallet
- [ ] UserContext loads attributes
- [ ] No TypeScript errors
- [ ] `bun run dev` starts without errors

## Implementation Notes

- Keep existing WalletContext GemWallet logic intact
- Remove apps/mock JPYC references, replace with XRP
- Test responsive breakpoints work
- Check font loading (if custom fonts used)

## Implementation Guidelines

- This phase is currently: **planned**
- Ready to start implementation

### Related Phases

- ✅ 1-schema-migration (`done`)
- ✅ 2-api-extension (`done`)
- ⬜ 4-market-pages (`planned`)
- ⬜ 5-user-features (`planned`)

### Completion

When this phase is complete:
- Run `foreman phase 3-ui-foundation done` to mark it as finished
- Ensure all deliverables are implemented and tested
- Document any changes or decisions made during implementation
