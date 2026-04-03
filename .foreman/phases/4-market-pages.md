# Phase 4: Market Pages

## Scope
Implement homepage (market list) and market detail page with betting flow.

## Deliverables

1. **Homepage** — Market grid with filters
2. **Market detail page** — Outcomes, betting panel
3. **Betting flow** — MetaMask transaction signing

## Tasks

### 4.1 Migrate Site Header
Copy and modify `apps/mock/components/site-header.tsx`:
- Replace mock balance with MetaMask balance
- Add connect/disconnect from WalletContext
- Keep Japanese navigation: マーケット, マイページ
- Show wallet address when connected

### 4.2 Create Filter Bar
Copy `apps/mock/components/filter-bar.tsx`:
- Category filter (all, politics, economy, local, etc.)
- Status filter (all, open, closed, resolved)
- Wire up to URL params or state

### 4.3 Create Market Card
Copy and modify `apps/mock/components/market-card.tsx`:
- Fetch probabilities from API
- Format amounts as JPYC
- Link to `/market/[id]`
- Show top 2-3 outcomes with percentages

### 4.4 Create Markets Grid
Copy `apps/mock/components/markets-grid.tsx`:
- Grid layout for market cards
- Loading skeleton
- Empty state

### 4.5 Implement Homepage
Modify `apps/web/app/page.tsx`:
- Fetch markets from API with filters
- Render filter bar + markets grid
- Handle loading/error states
- Keep hero section (optional)

### 4.6 Create Outcomes List
Copy `apps/mock/components/outcomes-list.tsx`:
- Show all outcomes with probabilities
- Progress bar for each
- Selection state for betting
- Total bets per outcome

### 4.7 Create Market Info Box
Copy `apps/mock/components/market-info-box.tsx`:
- Total volume (JPYC)
- Participant count
- End date
- Created date

### 4.8 Create Bet Panel
Copy and heavily modify `apps/mock/components/bet-panel.tsx`:
- Amount input in JPYC
- Quick amounts: 100, 500, 1000, 5000 JPYC
- Show user's weight score from UserContext
- Calculate effective amount
- **Integration:** 
  - POST /markets/:id/bets to get unsigned tx
  - Call `signAndSubmitTransaction(tx)`
  - POST confirm on success
  - Show success/error toast
  - Refetch market data

### 4.9 Create Market Detail Page
Modify `apps/web/app/market/[id]/page.tsx`:
- Fetch market with outcomes
- Render: header, outcomes list, bet panel, info box
- Show recent bets list
- Back link to homepage

### 4.10 Handle Betting Flow

Full flow:
```
1. User selects outcome
2. User enters JPYC amount
3. Preview shows effective amount (with weight)
4. User clicks "予測する"
5. POST /markets/:id/bets → get unsigned tx
6. signAndSubmitTransaction(tx) → MetaMask popup
7. User signs in MetaMask
8. POST /markets/:id/bets/:id/confirm with txHash
9. Show success toast
10. Refetch market data to update probabilities
```

Error handling:
- User rejects in MetaMask → Show message
- Transaction fails → Show error with details
- Network error → Retry option

## Acceptance Criteria

- [ ] Homepage shows market list from API
- [ ] Category filter works
- [ ] Status filter works
- [ ] Market cards show probabilities
- [ ] Market detail shows all outcomes
- [ ] Can select outcome for betting
- [ ] Bet panel calculates effective amount
- [ ] MetaMask signing works
- [ ] Bet confirmation updates UI
- [ ] Toast notifications on success/error
- [ ] All text in Japanese

## Implementation Notes

- Use `useCallback` for handlers to prevent re-renders
- Debounce preview API calls (300ms)
- Currency display: Always show 2 decimal places for JPYC
- Test with 3+ outcome markets
- Handle case: no wallet connected (show connect prompt)
