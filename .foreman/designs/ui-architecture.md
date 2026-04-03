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
