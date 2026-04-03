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
| market-pages | EVM contract integration | Multi-outcome tokens need new currency codes |
| user-features | Weight calculation edge cases | Cap at 0.5-3.0 range |

## Definition of Done

- All phases complete
- Docker compose runs successfully
- MetaMask can connect
- Can view markets with multiple outcomes
- Can place bet on any outcome
- Portfolio shows positions
- All Japanese UI text preserved
