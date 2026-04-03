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
  return `${jpyc.toLocaleString("ja-JP")} JPYC`;
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
- [ ] WalletContext still connects MetaMask
- [ ] UserContext loads attributes
- [ ] No TypeScript errors
- [ ] `bun run dev` starts without errors

## Implementation Notes

- Keep existing WalletContext MetaMask logic intact
- Use JPYC amounts from apps/mock as-is
- Test responsive breakpoints work
- Check font loading (if custom fonts used)
