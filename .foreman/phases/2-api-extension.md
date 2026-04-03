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
