# SENQ Project Overview

## Purpose
SENQ is a Japan-native prediction market app with attribute-weighted betting. Users bet on market outcomes using JPYC (ERC20 stablecoin) on Avalanche C-Chain.

## Tech Stack
- **Monorepo**: Bun workspaces (`apps/*`)
- **Frontend**: Next.js (apps/web), React, TypeScript, Tailwind CSS
- **Backend**: Hono (apps/api), Bun runtime, SQLite (better-sqlite3)
- **Smart Contracts**: Solidity ^0.8.24, Foundry (forge)
- **Package Manager**: Bun

## Structure
```
senq/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Hono API server
│   └── mock/         # Mock data
├── contracts/
│   ├── src/          # Solidity contracts (SENQMarket.sol)
│   ├── test/         # Foundry tests
│   └── script/       # Deploy scripts
└── docs/
```

## Key Commands
- `bun run dev` - Start all services
- `bun run dev:web` - Start frontend only
- `bun run dev:api` - Start API only
- `cd contracts && forge test` - Run contract tests
- `cd contracts && forge build` - Build contracts

## Currency
Uses JPYC (ERC20, 18 decimals) on Avalanche C-Chain. Previously used ETH.

## i18n
Supports English and Japanese (`apps/web/i18n/en.ts`, `ja.ts`)
