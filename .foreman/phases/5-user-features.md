# Phase 5: User Features

## Scope
Implement My Page with portfolio, positions, and attributes display.

## Deliverables

1. **My Page** — Portfolio overview
2. **Profile Section** — Wallet info, attributes, weight score
3. **Active Bets** — Current positions
4. **Bet History** — Past bets (optional)

## Tasks

### 5.1 Create Profile Section
Copy and modify `apps/mock/components/profile-section.tsx`:
- Show connected wallet address (truncated)
- Show JPYC balance from WalletContext
- Show weight score from UserContext
- List verified attributes with weights
- Link to Snowtrace for address

### 5.2 Create Position Box
Copy `apps/mock/components/position-box.tsx`:
- Show positions for current user
- Group by market (optional)
- Show amount, weight, effective amount

### 5.3 Create Active Bets Component
Copy and modify `apps/mock/components/active-bets.tsx`:
- Fetch bets from GET /users/:address/bets
- Show market title, outcome, amount
- Show current probability
- Calculate unrealized P/L (optional)
- Filter by status (open/closed)

### 5.4 Implement My Page
Create `apps/web/app/mypage/page.tsx`:
- Require wallet connection (redirect or prompt if not)
- Fetch user attributes + bets on mount
- Layout: profile section (left), active bets (right)
- Loading state while fetching
- Empty state if no bets

### 5.5 Update Site Header for Active Page
- Highlight "マイページ" when on /mypage
- Pass `activePage` prop to SiteHeader

### 5.6 Wire Up UserContext
- Fetch attributes when wallet connects
- Refresh on page navigation
- Cache for session (optional)

### 5.7 Add Attribute Display
For each attribute:
- Type badge (地域, 専門知識, 経験)
- Label (e.g., "宮城県在住")
- Weight multiplier (×1.5)
- Verified date

### 5.8 Portfolio Summary Stats
- Total bets placed
- Total JPYC bet
- Total effective JPYC (with weights)
- Active positions count

### 5.9 Handle Not Connected State
If wallet not connected on /mypage:
- Show connect prompt
- Or redirect to homepage
- Match apps/mock behavior

## Acceptance Criteria

- [ ] My Page loads user attributes from API
- [ ] Weight score displayed correctly
- [ ] Attributes shown with weights
- [ ] Active bets fetched and displayed
- [ ] Bet details include market title, outcome
- [ ] Current probability shown per bet
- [ ] Works with multi-outcome bets
- [ ] Not-connected state handled gracefully
- [ ] All text in Japanese

## Implementation Notes

- Wallet connection check on page mount
- Consider SWR or React Query for data fetching (optional)
- Attribute weights: show with "×" prefix (×1.5, ×1.2)
- Handle edge case: user has no attributes (weight = 1.0)
- Handle edge case: user has no bets (empty state)

## Future Enhancements (Not in Scope)

- Attribute verification flow (admin adds, user sees)
- Bet history pagination
- Portfolio value over time chart
- Position trading on DEX
