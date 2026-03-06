# MITATE 見立て

> EVM Parimutuel Prediction Market

**Demo Day: February 24, 2026** | [JFIIP Hackathon](https://jfiip.xrpl.org)

## Overview

MITATE is a prediction market DApp built on EVM using parimutuel betting mechanics. Users bet on binary outcomes (YES/NO) with ETH, and winners share the entire pool proportionally.

### What Makes MITATE Special?

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
| Blockchain | EVM Testnet, viem |
| Deployment | Vercel (frontend), Fly.io (backend) |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Node.js 20+ (for Next.js)
- EVM Testnet accounts (operator)

### Option 1: Docker Compose (Recommended)

```bash
# Clone
git clone https://github.com/thinkshake/mitate.git
cd mitate

# Configure environment
cp .env.example .env
# Edit .env with EVM addresses

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Option 2: Local Development

```bash
# Clone
git clone https://github.com/thinkshake/mitate.git
cd mitate

# Install dependencies
bun install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with EVM addresses and API key

# Run database migrations
cd apps/api && bun run migrate

# Start development servers
bun run dev  # Starts both frontend and backend
```

### Getting EVM Testnet Accounts

You need an EVM Testnet account: **Operator** (holds ETH, receives bets, sends payouts).

1. **Get an account from an EVM Testnet Faucet:**
   ```bash
   # Use a faucet for your target EVM testnet, e.g. Sepolia:
   # https://sepoliafaucet.com
   # Or generate a wallet using viem/cast and fund from a faucet
   ```

2. **Save the addresses:**
   - `EVM_OPERATOR_ADDRESS` = operator wallet address (starts with `0x`)
   - Keep the private key safe — needed for signing transactions

3. **Generate Admin API Key:**
   ```bash
   # Generate a random 32-character key
   openssl rand -hex 16
   # Or use any secure random string generator
   ```

### Environment Variables

**Backend (apps/api/.env)**
```
PORT=3001
DATABASE_PATH=./data/mitate.db
EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
EVM_OPERATOR_ADDRESS=0xYourOperatorAddress...
ADMIN_API_KEY=your-secret-key    # From step 3
```

**Frontend (apps/web/.env.local)**
```
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

## Deployment

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set EVM_OPERATOR_ADDRESS=0xXXX...
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
