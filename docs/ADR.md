# ADR: EVM Parimutuel Prediction Market

## Status
Accepted — 2025-02-11

## Context
Architecture decisions for a prediction market DApp submitted to the Avalanche Build Games hackathon.

### Scoring Criteria
| Criteria | Weight |
|---|---|
| EVM Functions Used (depth, creativity, sophistication of integration) | 25% |
| Commercial Viability (market need, business model, scalability) | 30% |
| Project Completeness (working prototype, documentation quality) | 25% |
| Track Depth (domain expertise, track relevance) | 20% |

### Constraints
- Must work on EVM Testnet
- Demo video: max 3 minutes
- Public GitHub repository required
- Effective use of EVM-native features is critical

---

## Decision 1: Pricing Mechanism — Parimutuel

### Options Considered
1. LMSR (Logarithmic Market Scoring Rule) AMM
2. **Parimutuel** ← selected

### Rationale
- **EVM compatibility**: Parimutuel requires no real-time pricing function on-chain. LMSR requires `b * ln(Σe^(q_i/b))` computations, which are expensive to execute on-chain.
- **Bet weighting compatibility**: Parimutuel integrates weight coefficients naturally by multiplying in the payout formula. LMSR creates contradictions — different users would have different price impacts for the same purchase quantity, breaking fair price discovery and creating arbitrage opportunities.
- **Implementation complexity**: Parimutuel is simple ratio arithmetic. Achievable within the hackathon timeline with high confidence.
- **Scoring alignment**: Higher proportion of logic lives on-chain, maximizing the "EVM Functions Used" score.

### Why LMSR Was Rejected
- Core logic (pricing) would live off-chain, weakening the "EVM Functions Used" score
- Bet weighting integration is architecturally problematic (per-user price impact asymmetry)
- Higher implementation risk for hackathon timeline

---

## Decision 2: Execution Layer — EVM + Off-chain Server

### Options Considered
1. **EVM native features + off-chain server** ← selected
2. Pure on-chain smart contract (Solidity)

### Rationale
- **EVM Functions Used (25%)**: ETH transfers, calldata, and Multi-Sign provide clear on-chain verifiability without requiring complex Solidity contracts.
- **Project Completeness (25%)**: viem alone is sufficient for interacting with EVM. No additional Solidity toolchain required for the off-chain-server model.
- **Track Depth (20%)**: Demonstrates deep understanding of EVM primitives and transaction mechanics.

### Why Pure On-chain Was Rejected
- Smart contract development adds significant complexity within hackathon timeline
- Off-chain server model with EVM verification is simpler and equally auditable
- Risk of Solidity bugs or gas issues during live demo

---

## Decision 3: Settlement Currency — ETH

### Options Considered
1. **ETH** ← selected
2. Stablecoin (ERC-20)

### Rationale
- **Simplicity**: ETH is the native token of EVM chains and requires no token contract deployment.
- **Scoring**: Native ETH transfers demonstrate direct EVM usage.
- **Testnet simplicity**: ETH is freely available from testnet faucets. Stablecoins would require self-deployment of ERC-20 contracts.

### Trade-off
- Stablecoin support is desirable for production. This is acknowledged as a future extension and will be mentioned in documentation and demo narrative.

---

## Decision 4: On-chain / Off-chain Responsibility Split

### On-chain (EVM)
| Function | EVM Feature | Purpose |
|---|---|---|
| Fund pool management | **ETH Transfer** | ETH deposit to operator for bets |
| Bet recording | **calldata** | On-chain bet metadata |
| Betting deadline enforcement | **block_number** | Deadline enforced off-chain against block timestamps |
| Resolution governance | **Multi-Sign** | Multi-party market resolution approval |
| Metadata recording | **calldata** | On-block bet/market state recording |

### Off-chain (Server)
| Function | Description |
|---|---|
| Payout calculation | `totalPool × (betAmount × weight) / Σ(betAmount_i × weight_i)` |
| Payout transaction submission | Individual ETH transfer to each winner |
| Bet aggregation | Query via EVM RPC (`eth_getLogs`, `eth_getTransactionByHash`) |
| Market management UI | Frontend / Backend |
| User attributes & weight management | Off-chain database |

### Trust Guarantees
- All payout calculation inputs (total pool, individual bet amounts) are publicly visible on-chain via calldata, enabling independent post-hoc verification by anyone.
- Market state hashes recorded in calldata enable off-chain computation integrity checks.

---

## Decision 5: Differentiation Features

### In Scope (Hackathon)
1. **Parimutuel prediction market core** — Full bet → resolve → payout flow using EVM native features.

### Concept Only (Future Roadmap)
1. **Bet weighting**: Attribute-based weight coefficients in payout calculation. Naturally integrates with Parimutuel: `payout = totalPool × (bet × w) / Σ(bet_i × w_i)`.
2. **Yield integration on deposits**: Redirect locked funds to EVM DeFi protocols (e.g., Aave, Compound) to eliminate opportunity cost. Requires architectural change to operator-managed pooling with yield-bearing positions.

---

## Decision 6: Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), deployed on Vercel |
| Backend | Node.js / TypeScript (Express or Hono), deployed on Fly.io |
| Database | SQLite (file-based, persisted on Fly.io Volume) |
| Blockchain | EVM Testnet |
| EVM SDK | viem |

### Why Fly.io + SQLite
- Full Node.js runtime with no execution time limits — WebSocket connections to EVM nodes and long-running operations (e.g., batch ETH transfers) work without constraints
- Persistent Volumes allow SQLite file storage with zero external DB dependencies
- Free tier ($5/month credit) is sufficient for hackathon scale
- Deploy via CLI (`fly launch` / `fly deploy`) with automatic Dockerfile generation — minimal ops overhead
- No V8 isolate restrictions — viem and crypto libraries work out of the box with Node.js `crypto` module

---

## Consequences

### Positive
- EVM-native ETH transfers and calldata utilized, maximizing on-chain verifiability
- Parimutuel simplicity ensures completion within hackathon timeline
- Clear extension path to bet weighting and yield integration
- Off-chain payout computation is fully verifiable against on-chain calldata
- Full Node.js runtime on Fly.io eliminates platform compatibility concerns with viem and crypto libraries

### Negative
- Parimutuel lacks real-time price movement (partially compensated by off-chain trading UI)
- ETH-only settlement (stablecoin support requires deploying an ERC-20 contract)
- Payout distribution requires trust in the off-chain server (not fully trustless)
