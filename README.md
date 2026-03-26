# SENQ SENQ

> EVM Parimutuel Prediction Market

## Overview

SENQ is a prediction market DApp built on Avalanche C-Chain using parimutuel betting mechanics. Users bet on outcomes with JPYC (a JPY-pegged ERC20 stablecoin), and winners share the entire pool proportionally.

### What Makes SENQ Special?

- **Avalanche + JPYC**: Bets in JPY-pegged stablecoin via ERC20 approve/transferFrom
- **Parimutuel Pricing**: No complex AMM math — simple pool-based payouts
- **Verifiable On-Chain**: All bets and outcomes recorded on-chain via smart contract
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
│                    Avalanche C-Chain                              │
│           JPYC (ERC20) │ SENQMarket Contract │ Multi-Sign       │
└─────────────────────────────────────────────────────────────────┘
```

## EVM Features Used

| Feature | Usage |
|---------|-------|
| **ERC20 (JPYC)** | Pool JPYC bets via approve/transferFrom and release to winners |
| **Smart Contract** | SENQMarket contract holds all JPYC, handles bets/payouts |
| **Multi-Sign** | 2-of-3 resolution governance |

## User Flow

1. **Market Created** → Admin creates market with betting deadline
2. **Approve JPYC** → User approves the SENQMarket contract to spend JPYC
3. **Bets Placed** → Users bet JPYC on outcomes via the contract
4. **Resolution** → Multi-sign committee resolves outcome
5. **Payout** → Winners claim proportional share of pool from the contract

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui |
| Backend | Hono, Bun, SQLite (WAL mode) |
| Blockchain | Avalanche C-Chain (Anvil locally), JPYC (ERC20), viem |
| Deployment | Vercel (frontend), Fly.io (backend) |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Node.js 20+ (for Next.js)
- [Foundry](https://book.getfoundry.sh) (for Anvil local node)

### Running Locally with Anvil (Recommended)

[Anvil](https://book.getfoundry.sh/anvil/) is a local EVM node that ships with Foundry. It starts with 10 pre-funded accounts for gas. You'll deploy a mock JPYC token for local testing.

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
JPYC_TOKEN_ADDRESS=          # Set after deploying (see step 5)
JPYC_DECIMALS=18
EVM_CONTRACT_ADDRESS=        # Set after deploying (see step 5)
```

> ⚠️ These are Anvil's well-known dev keys — safe to use locally, **never use in production**.

**Frontend:**

```bash
cat > apps/web/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_JPYC_DECIMALS=18
EOF
```

#### 5. Deploy Contracts

Deploy a mock JPYC token and the SENQMarket contract to Anvil:

```bash
cd contracts
forge build

# Deploy using Anvil's dev key with JPYC_TOKEN_ADDRESS
# First, deploy a mock JPYC token (or use an existing ERC20 address)
# Then deploy SENQMarket with the token address:
JPYC_TOKEN_ADDRESS=<your-jpyc-address> \
  forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

cd ..
```

Copy the deployed addresses into `apps/api/.env`:
```env
JPYC_TOKEN_ADDRESS=0x...    # Mock JPYC token address
EVM_CONTRACT_ADDRESS=0x...  # SENQMarket contract address
```

#### 6. Run Database Migrations

```bash
cd apps/api
bun run migrate
cd ../..
```

#### 7. Start the Services

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

#### 8. Verify Everything is Running

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

You need an EVM testnet account as **Operator** (holds AVAX for gas, deploys and resolves markets).

1. Get testnet AVAX (Fuji): https://faucet.avax.network
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
EVM_RPC_URL=http://127.0.0.1:8545          # Anvil; or Avalanche RPC
EVM_CHAIN_ID=31337                          # Anvil; 43113 for Fuji; 43114 for mainnet
EVM_OPERATOR_ADDRESS=0xYourOperatorAddress
EVM_OPERATOR_PRIVATE_KEY=0xYourPrivateKey
EVM_CONTRACT_ADDRESS=0xDeployedContractAddress
JPYC_TOKEN_ADDRESS=0xJpycTokenAddress
JPYC_DECIMALS=18
ADMIN_API_KEY=your-secret-key
```

**Frontend (apps/web/.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=31337                  # Anvil; 43113 for Fuji; 43114 for mainnet
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_JPYC_DECIMALS=18
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

SENQ uses a **SENQMarket** Solidity contract (`contracts/src/SENQMarket.sol`) for trustless, on-chain prediction markets. All bets, resolution, and payouts happen on-chain via JPYC (ERC20) — no operator ETH pooling required.

- **ERC20 Parimutuel pool**: JPYC bets go directly into the contract via `approve` + `transferFrom`
- **Owner-only resolution**: Market outcomes resolved by contract owner
- **Automatic payouts**: Winners claim proportional share on-chain (2% protocol fee)
- **Cancel & refund**: Owner can cancel markets; bettors reclaim their JPYC

### Contract Architecture

| Component | Implementation |
|-----------|---------------|
| Token | JPYC (ERC20) — passed to constructor |
| Pool | SENQMarket contract holds all JPYC |
| Bets | `betYes(marketId, amount)` / `betNo(marketId, amount)` — ERC20 transferFrom |
| Resolution | `resolve()` — owner-only, after deadline |
| Payouts | `claimPayout()` — winners claim proportional share via ERC20 transfer |
| Fees | 2% of losing pool; withdrawable by owner |

### Local Deployment (Anvil)

```bash
cd contracts
forge build
forge test

# Deploy with JPYC token address
JPYC_TOKEN_ADDRESS=<your-jpyc-address> \
  forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Copy deployed address to EVM_CONTRACT_ADDRESS in apps/api/.env
```

### Testnet Deployment (Avalanche Fuji)

```bash
JPYC_TOKEN_ADDRESS=<jpyc-token-on-fuji> \
  forge script script/Deploy.s.sol \
  --rpc-url $EVM_RPC_URL \
  --private-key $EVM_OPERATOR_PRIVATE_KEY \
  --broadcast --verify
```

### Operator Wallet Setup

The operator wallet deploys the contract and resolves markets. It needs AVAX for gas on Avalanche.

#### Local (Anvil)

Anvil's pre-funded dev account is used automatically — no setup needed.

#### Testnet (Avalanche Fuji)

1. Generate a new wallet:
   ```bash
   cast wallet new
   ```

2. Fund it from the Avalanche faucet: https://faucet.avax.network

3. Set in your `.env`:
   ```env
   EVM_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   EVM_CHAIN_ID=43113
   EVM_OPERATOR_ADDRESS=0xYourAddress
   EVM_OPERATOR_PRIVATE_KEY=0xYourPrivateKey
   EVM_CONTRACT_ADDRESS=0xDeployedContractAddress
   JPYC_TOKEN_ADDRESS=0xJpycTokenOnFuji
   JPYC_DECIMALS=18
   ```

#### Mainnet (Avalanche C-Chain)

Same as testnet — use a mainnet RPC (`https://api.avax.network/ext/bc/C/rpc`, Chain ID `43114`) and fund the operator wallet with AVAX for gas.

> ⚠️ Keep `EVM_OPERATOR_PRIVATE_KEY` secret. Use environment secrets (Fly.io secrets, Vercel env vars) — never commit it.

## Deployment

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set EVM_OPERATOR_ADDRESS=0xXXX...
fly secrets set EVM_OPERATOR_PRIVATE_KEY=0xXXX...
fly secrets set JPYC_TOKEN_ADDRESS=0xXXX...
fly secrets set EVM_CONTRACT_ADDRESS=0xXXX...
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
