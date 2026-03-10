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
