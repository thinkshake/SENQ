# SENQ SENQ

> EVM Parimutuel Prediction Market

## Overview

SENQ is a prediction market DApp built on EVM using parimutuel betting mechanics. Users bet on binary outcomes (YES/NO) with ETH, and winners share the entire pool proportionally.

### What Makes SENQ Special?

- **EVM-Native Design**: Uses EVM primitives (ETH transfer, calldata, Multi-Sign)
- **Parimutuel Pricing**: No complex AMM math — simple pool-based payouts
- **Verifiable On-Chain**: All bets and outcomes recorded on the EVM blockchain
- **Multi-Sign Resolution**: 2-of-3 governance prevents manipulation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                            Vercel                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend (Hono)                          │
│                      Fly.io + SQLite                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EVM Testnet                               │
│              ETH Transfer │ calldata │ Multi-Sign                │
└─────────────────────────────────────────────────────────────────┘
```

## EVM Features Used

| Feature | Usage |
|---------|-------|
| **ETH Transfer** | Pool ETH bets and release to winners |
| **calldata** | On-chain metadata for all transactions |
| **Multi-Sign** | 2-of-3 resolution governance |

## User Flow

1. **Market Created** → Admin creates market with betting deadline
2. **Bets Placed** → Users bet ETH on YES or NO
3. **Resolution** → Multi-sign committee resolves outcome
4. **Payout** → Winners receive proportional share of pool

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui |
| Backend | Hono, Bun, SQLite (WAL mode) |
| Blockchain | EVM (Anvil locally / any EVM testnet), viem |
| Deployment | Vercel (frontend), Fly.io (backend) |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Node.js 20+ (for Next.js)
- [Foundry](https://book.getfoundry.sh) (for Anvil local node)

### Running Locally with Anvil (Recommended)

[Anvil](https://book.getfoundry.sh/anvil/) is a local EVM node that ships with Foundry. It starts with 10 pre-funded accounts — no faucet or real ETH needed.

#### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify:

```bash
anvil --version
```

#### 2. Clone and Install

```bash
git clone https://github.com/thinkshake/senq.git
cd senq
bun install
```

#### 3. Start Anvil

In a dedicated terminal:

```bash
anvil
```

Anvil starts at `http://127.0.0.1:8545` (Chain ID: 31337) and prints pre-funded accounts:

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Keep this terminal running throughout development.

#### 4. Configure Environment

**Backend:**

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
PORT=3001
DATABASE_PATH=./data/senq.db
EVM_RPC_URL=http://127.0.0.1:8545
EVM_CHAIN_ID=31337
EVM_OPERATOR_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
EVM_OPERATOR_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ADMIN_API_KEY=dev-admin-key
```

> ⚠️ These are Anvil's well-known dev keys — safe to use locally, **never use in production**.

**Frontend:**

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > apps/web/.env.local
```

#### 5. Run Database Migrations

```bash
cd apps/api
bun run migrate
cd ../..
```

#### 6. Start the Services

Open two more terminals:

**Terminal 2 — API:**
```bash
cd apps/api
bun run dev
```

**Terminal 3 — Web:**
```bash
cd apps/web
bun run dev
```

#### 7. Verify Everything is Running

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Anvil RPC | http://127.0.0.1:8545 |

Quick sanity checks:

```bash
# API health
curl http://localhost:3001/api/markets

# Anvil block number
cast block-number --rpc-url http://127.0.0.1:8545
```

---

### Option 2: Docker Compose (includes Anvil)

Anvil is included as a service in `docker-compose.yml` — no separate install needed.

```bash
git clone https://github.com/thinkshake/senq.git
cd senq

# Configure the API environment (Anvil keys pre-filled)
cp apps/api/.env.example apps/api/.env
# EVM_RPC_URL and EVM_CHAIN_ID are overridden by docker-compose automatically

# Start everything (Anvil → API → Web)
docker-compose up -d

# View logs
docker-compose logs -f
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Anvil RPC | http://localhost:8545 |

> The API container connects to Anvil via the internal Docker network (`http://anvil:8545`).
> Anvil is exposed on your host at `http://localhost:8545` for tools like `cast` or MetaMask.

### Option 3: Manual Local (EVM Testnet)

```bash
git clone https://github.com/thinkshake/senq.git
cd senq
bun install

cp apps/api/.env.example apps/api/.env
# Edit .env with your testnet RPC URL and operator wallet

cd apps/api && bun run migrate && cd ../..
bun run dev
```

### Getting Testnet Accounts (Option 3)

You need an EVM testnet account as **Operator** (holds ETH, receives bets, sends payouts).

1. Get testnet ETH (e.g. Sepolia): https://sepoliafaucet.com  
   Or generate a wallet: `cast wallet new`

2. Generate an Admin API Key:
   ```bash
   openssl rand -hex 16
   ```

### Environment Variables Reference

**Backend (apps/api/.env)**
```env
PORT=3001
DATABASE_PATH=./data/senq.db
EVM_RPC_URL=http://127.0.0.1:8545          # Anvil; or https://sepolia.infura.io/v3/KEY
EVM_CHAIN_ID=31337                          # Anvil; or 11155111 for Sepolia
EVM_OPERATOR_ADDRESS=0xYourOperatorAddress
EVM_OPERATOR_PRIVATE_KEY=0xYourPrivateKey
ADMIN_API_KEY=your-secret-key
```

**Frontend (apps/web/.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints

### Markets
- `GET /api/markets` — List all markets
- `GET /api/markets/:id` — Market details
- `POST /api/markets` — Create market (admin)
- `POST /api/markets/:id/close` — Close market (admin)

### Betting
- `POST /api/markets/:id/bets` — Place bet (returns tx payloads)
- `POST /api/markets/:id/bets/confirm` — Confirm bet
- `GET /api/markets/:id/bets/preview` — Preview payout

### Trading
- `POST /api/markets/:id/offers` — Create EVM trade
- `GET /api/markets/:id/trades` — List trades

### Resolution
- `POST /api/markets/:id/resolve` — Resolve market (admin)
- `POST /api/markets/:id/payouts` — Execute payouts (admin)
- `GET /api/markets/:id/payouts` — List payouts


## Smart Contracts

SENQ uses a **SENQMarket** Solidity contract (`contracts/src/SENQMarket.sol`) for trustless, on-chain prediction markets. All bets, resolution, and payouts happen on-chain — no operator EOA pooling required.

- **Parimutuel pool**: ETH bets go directly into the contract
- **Owner-only resolution**: Market outcomes resolved by contract owner
- **Automatic payouts**: Winners claim proportional share on-chain (2% protocol fee)
- **Cancel & refund**: Owner can cancel markets; bettors reclaim their ETH

### Contract Architecture

| Component | Implementation |
|-----------|---------------|
| Pool | SENQMarket contract holds all ETH |
| Bets | `betYes()` / `betNo()` — payable functions |
| Resolution | `resolve()` — owner-only, after deadline |
| Payouts | `claimPayout()` — winners claim proportional share |
| Fees | 2% of losing pool; withdrawable by owner |

### Local Deployment (Anvil)

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
# Copy deployed address to EVM_CONTRACT_ADDRESS in apps/api/.env
```

### Testnet Deployment (Sepolia)

```bash
forge script script/Deploy.s.sol --rpc-url $EVM_RPC_URL --private-key $EVM_OPERATOR_PRIVATE_KEY --broadcast --verify
```

### Operator Wallet Setup

The operator wallet deploys the contract and resolves markets. It needs ETH for gas.

#### Local (Anvil)

Anvil's pre-funded dev account is used automatically — no setup needed.

#### Testnet (e.g. Sepolia)

1. Generate a new wallet:
   ```bash
   cast wallet new
   ```

2. Fund it from a faucet (e.g. https://sepoliafaucet.com)

3. Set in your `.env`:
   ```env
   EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   EVM_CHAIN_ID=11155111
   EVM_OPERATOR_ADDRESS=0xYourAddress
   EVM_OPERATOR_PRIVATE_KEY=0xYourPrivateKey
   EVM_CONTRACT_ADDRESS=0xDeployedContractAddress
   ```

#### Mainnet

Same as testnet — use a mainnet RPC and fund the operator wallet with real ETH for gas.

> ⚠️ Keep `EVM_OPERATOR_PRIVATE_KEY` secret. Use environment secrets (Fly.io secrets, Vercel env vars) — never commit it.

## Deployment

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set EVM_OPERATOR_ADDRESS=0xXXX...
fly secrets set EVM_OPERATOR_PRIVATE_KEY=0xXXX...
fly secrets set ADMIN_API_KEY=your-secret-key
fly deploy
```

### Frontend (Vercel)

```bash
cd apps/web
vercel
# Set NEXT_PUBLIC_API_URL to your Fly.io URL
```

## Demo Script

See [docs/demo-script.md](docs/demo-script.md) for the 3-minute demo walkthrough.

## License

MIT

## Team

Built for JFIIP Hackathon 2026 by:
- [Shota](https://github.com/hitsuji-haneta) — Developer
- [Aston](https://github.com/aston-ai) — AI Assistant
