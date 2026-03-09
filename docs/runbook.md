# SENQ Operations Runbook

## EVM Account Setup

### 1. Create Testnet Accounts

Get test ETH from an EVM testnet faucet:
```bash
# Example: Sepolia faucet
# https://sepoliafaucet.com
# Or generate a wallet with cast (Foundry):
cast wallet new
```

You need one account:
- **Operator**: Receives bets, sends payouts

### 2. Configure Operator Account

The operator account is a standard EVM EOA (Externally Owned Account). No on-chain configuration is required beyond funding it with testnet ETH.

For multi-sign governance, configure a Gnosis Safe or similar multi-sig wallet:
```javascript
// Example: Deploy a Gnosis Safe with 2-of-3 signers
// via https://app.safe.global or the Safe SDK
// Owners: [SIGNER_1, SIGNER_2, SIGNER_3]
// Threshold: 2
```

---

## Market Operations

### Create Market (Admin)

```bash
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "title": "Will Bitcoin reach $100K by end of 2025?",
    "description": "Resolves YES if BTC/USD >= 100000 before Dec 31 2025 23:59 UTC",
    "category": "crypto",
    "bettingDeadline": "2025-12-31T23:59:59Z"
  }'
```

Response includes the operator address to which bets should be sent.

### Confirm Market Creation

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "txHash": "HASH_FROM_EVM",
    "block_number": 12345
  }'
```

### Close Market (Manual)

Markets auto-close at deadline, but can be manually closed:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/close \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

---

## Resolution Operations

### Resolve Market

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/resolve \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "outcome": "YES",
    "action": "finish"
  }'
```

Response includes the resolution ETH transfer payload for multi-sign.

### Multi-Sign Process

1. Export transaction data
2. Send to signer 1 → get partial signature
3. Send to signer 2 → get partial signature
4. Combine signatures → submit to EVM node

### Execute Payouts

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/payouts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{ "batchSize": 50 }'
```

Returns ETH transfer payloads. Sign and submit each.

### Confirm Payouts

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/payouts/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "payoutId": "pay_xxx",
    "txHash": "HASH_FROM_EVM"
  }'
```

---

## Troubleshooting

### WebSocket Disconnects

The block sync service reconnects automatically. Check logs:

```bash
fly logs -a senq-api | grep "EVM"
```

### Bet Confirmation Fails

1. Check user signed the ETH transfer transaction in MetaMask
2. Verify the transaction was sent to the operator address
3. Check calldata encodes the correct market and outcome IDs

### ETH Transfer Fails

1. Ensure operator account has sufficient ETH for gas
2. Verify the recipient address is correct
3. Check gas limit is sufficient for the transaction

### Payout Calculation Mismatch

1. Verify all bet transactions are indexed from on-chain calldata
2. Re-run payout calculation against confirmed block data
3. Ensure no bets from after the betting deadline are included

---

## Database Maintenance

### Backup SQLite

```bash
fly ssh console -a senq-api
sqlite3 /data/senq.db ".backup /data/backup.db"
```

### Check Sync State

```bash
curl http://localhost:3001/health
# Returns lastBlockNumber from system_state
```

### Reset Sync (Danger!)

```sql
DELETE FROM system_state WHERE key LIKE 'sync:%';
```

---

## Deployment Checklist

### Before Demo

- [ ] EVM operator account has sufficient ETH (>0.5 ETH testnet)
- [ ] Multi-sign signers have their keys ready
- [ ] Create 2-3 demo markets with different deadlines
- [ ] Place some test bets on each market
- [ ] Verify frontend connects to production API
- [ ] Test MetaMask wallet connection flow end-to-end

### Environment Variables

**Fly.io**
```bash
fly secrets set EVM_OPERATOR_ADDRESS=0xXXX
fly secrets set ADMIN_API_KEY=xxx
```

**Vercel**
```bash
vercel env add NEXT_PUBLIC_API_URL
```

---

## Monitoring

### Health Check

```bash
curl https://senq-api.fly.dev/health
```

### EVM Connection

```bash
curl https://senq-api.fly.dev/health/evm
```

### Logs

```bash
fly logs -a senq-api --region nrt
```
