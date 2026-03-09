# SENQ Demo Guide

**Hackathon:** JFIIP Demo Day — February 24, 2026
**Duration:** 3 minutes
**Audience:** Judges evaluating EVM feature usage

---

## Quick Reference: Market Lifecycle

```
1. CREATE    POST /api/markets              → Draft status
2. OPEN      POST /api/markets/:id/test-open → Open status (accepts bets)
3. BET       POST /api/markets/:id/bets     → Users place bets
4. CLOSE     POST /api/markets/:id/close    → Closed status (no more bets)
5. RESOLVE   POST /api/markets/:id/resolve  → Resolved status (winner declared)
6. PAYOUT    POST /api/markets/:id/payouts  → Generate payout transactions
7. CONFIRM   POST /api/markets/:id/payouts/confirm → Confirm each payout
```

---

## Pre-Demo Setup

### 1. Configure Environment

Create `apps/api/.env`:
```bash
PORT=3001
NODE_ENV=development
DATABASE_PATH=/data/senq.db
EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Operator wallet address (0x...)
EVM_OPERATOR_ADDRESS=0xYourOperatorAddress...

ADMIN_API_KEY=your-secure-admin-key
```

### 2. Start Services

```bash
cd ~/dev/senq
docker-compose up -d

# Verify
curl http://localhost:3001/health
```

### 3. Fund Wallets

Get testnet ETH for operator wallet from an EVM testnet faucet:
```bash
# Example: Sepolia faucet
# https://sepoliafaucet.com
```

---

## Complete Flow: Admin UI + API

### Step 1: Create Market (Admin UI)

1. Go to `http://localhost:3000/admin`
2. Enter admin key → Login
3. Click "マーケット作成"
4. Fill form:
   - Title: 宮城県知事選挙の当選者予想
   - Description: 2026年の宮城県知事選挙の当選者を予測
   - Category: 政治
   - Deadline: (future date)
   - Outcomes: 村井嘉浩, 新人候補A, 新人候補B, その他
5. Click "作成"

### Step 2: Open Market (Admin UI)

Click "Test Open" button next to the Draft market.

### Step 3: Place Bets (User Flow)

1. Go to `http://localhost:3000`
2. Connect MetaMask (must be on Testnet)
3. Click a market → Select outcome → Enter amount
4. Click "予測する" → Sign in MetaMask

### Step 4: Close Market (Admin UI)

Click "Close" button next to the Open market.

### Step 5: Resolve Market (Admin UI)

1. Click "Resolve" button
2. Select winning outcome from dropdown
3. Confirm

### Step 6: Execute Payouts (API)

```bash
# Generate payout transactions
curl -X POST http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"batchSize": 50}'
```

Response includes payout transactions to sign:
```json
{
  "data": {
    "payouts": [
      {
        "id": "pay_xxx",
        "userId": "0xWinnerAddress...",
        "amountWei": "15000000000000000",
        "payoutTx": { /* ETH transfer tx to sign */ }
      }
    ]
  }
}
```

### Step 7: Sign & Confirm Payouts

For each payout, sign the `payoutTx` with the operator wallet, then confirm:

```bash
curl -X POST http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"payoutId": "pay_xxx", "txHash": "SIGNED_TX_HASH"}'
```

### Step 8: Check Payout Status

```bash
curl http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts
```

---

## API Reference

### Markets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets` | GET | List all markets |
| `/api/markets` | POST | Create market (admin) |
| `/api/markets/:id` | GET | Get market details |
| `/api/markets/:id/test-open` | POST | Open market for testing (admin) |
| `/api/markets/:id/fix-operator` | POST | Fix operator address (admin) |
| `/api/markets/:id/close` | POST | Close market (admin) |
| `/api/markets/:id/resolve` | POST | Resolve market (admin) |

### Bets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets/:id/bets` | GET | List bets for market |
| `/api/markets/:id/bets` | POST | Place bet |
| `/api/markets/:id/bets/:betId/confirm` | POST | Confirm bet after signing |

### Payouts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets/:id/payouts` | GET | List payouts for market |
| `/api/markets/:id/payouts` | POST | Generate payout transactions (admin) |
| `/api/markets/:id/payouts/confirm` | POST | Confirm payout after signing (admin) |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:address/bets` | GET | List user's bets |
| `/api/users/:address/attributes` | GET | Get user attributes |
| `/balance/:address` | GET | Get ETH balance |

---

## Demo Script (3 Minutes)

### Opening (0:00 - 0:20)

> "SENQ is a prediction market powered by EVM. It uses native EVM features — ETH transfers, calldata, and multi-sign governance."

**Show:** Homepage with markets

---

### Connect & Bet (0:20 - 1:00)

> "Let's bet on the Miyagi governor election."

**Actions:**
1. Connect MetaMask
2. Select market → Select outcome → Enter 0.01 ETH
3. Sign transaction

> "My bet is recorded on-chain with calldata containing the market and outcome."

---

### Show EVM Features (1:00 - 2:00)

> "Three EVM features power this:"

1. **ETH Transfer** — "Bets sent directly to operator with deadline enforced by block_number"
2. **calldata** — "All transactions carry structured market and outcome data"
3. **Multi-Sign** — "Resolution requires committee approval"

**Show:** Transaction on EVM Explorer

---

### Resolution (2:00 - 2:50)

> "When resolved, winners share the pool proportionally — parimutuel betting."

**Show:** Admin resolving market (if time permits)

---

### Closing (2:50 - 3:00)

> "SENQ proves EVM's native primitives can power a complete prediction market — all verifiable on-chain."

---

## EVM Features Summary

| Feature | Usage |
|---------|-------|
| **ETH Transfer** | Native ETH pool for bets and payouts |
| **calldata** | Structured audit trail on all transactions |
| **Multi-Sign** | Resolution governance |

---

## Troubleshooting

### "Nonce too low" Error
- Transaction sent with stale nonce
- Fix: Refresh MetaMask account or reset account nonce in MetaMask settings

### "Transaction underpriced" Error
- Gas price too low
- Fix: Increase gas price or use EIP-1559 fee estimation

### Market Stuck in Draft
- Run `POST /api/markets/:id/test-open` to open

### Operator Address Not Set
- Run `POST /api/markets/:id/fix-operator` to update

### No Payouts After Resolution
- Payouts must be explicitly executed via API
- Run `POST /api/markets/:id/payouts` then confirm each

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/api/.env` | API configuration |
| `apps/api/src/services/bets.ts` | Bet placement logic |
| `apps/api/src/services/payouts.ts` | Payout calculation |
| `apps/api/src/evm/tx-builder.ts` | EVM transaction builders |
| `apps/web/app/admin/page.tsx` | Admin dashboard |
