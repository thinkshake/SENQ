# SENQ Demo Script

**Duration:** 3 minutes
**Audience:** Avalanche Build Games judges

---

## Opening (0:00 - 0:20)

"SENQ is a prediction market built on Avalanche C-Chain. It uses a smart contract with JPYC — a JPY-pegged ERC20 stablecoin — to create a trustless, verifiable betting platform."

**Show:** Homepage with market listings

---

## Problem & Solution (0:20 - 0:40)

"Traditional prediction markets use complex AMM pricing. SENQ uses parimutuel betting instead — simple pool-based payouts where winners share proportionally. This fits naturally with EVM's architecture and makes JPY-denominated prediction markets accessible."

**Show:** Architecture diagram

---

## Live Demo: Betting Flow (0:40 - 1:40)

### 1. Connect Wallet (0:40 - 0:50)
"Let's place a bet. First, I connect my MetaMask wallet."

**Action:** Click Connect → MetaMask popup → Approve connection

### 2. Select Market (0:50 - 1:00)
"I'll bet on the Miyagi governor election prediction market."

**Action:** Navigate to market detail page

### 3. Place Bet (1:00 - 1:20)
"I'll bet 1,000 JPYC on 村井嘉浩. The system calls the SENQMarket contract: first approve JPYC spending, then place the bet."

**Action:** Enter amount → Click 予測する → Sign two transactions in MetaMask (approve + bet)

### 4. Verify On-Chain (1:20 - 1:40)
"My bet is now recorded on Avalanche C-Chain. Let's verify on the explorer."

**Action:** Click tx link → Show Snowtrace with contract interaction

---

## EVM Features Deep Dive (1:40 - 2:20)

### ERC20 (JPYC) (1:40 - 1:50)
"Bets use JPYC — a JPY-pegged stablecoin. Users approve the SENQMarket contract, which pulls JPYC into the pool via ERC20 transferFrom."

### Smart Contract (1:50 - 2:00)
"SENQMarket holds all JPYC in escrow. It enforces deadlines, tracks bets per outcome, and executes payouts — all on-chain with no operator custody."

### Multi-Sign Resolution (2:00 - 2:20)
"When the market closes, a 2-of-3 committee resolves the outcome. This prevents any single party from manipulating results."

**Show:** Resolution transaction on explorer

---

## Payout Demo (2:20 - 2:40)

"When the market resolves, winners claim their proportional share of the pool directly from the contract. A 2% protocol fee supports the platform."

**Show:** Payout formula: `Your Bet / Total Winning Bets × Total Pool`

---

## Closing (2:40 - 3:00)

"SENQ demonstrates how Avalanche's EVM — ERC20 tokens, smart contracts, and multi-sign governance — can power a complete JPY-denominated prediction market. All data is verifiable on-chain."

**Show:** GitHub repo + live deployment URL

---

## Key Points to Emphasize

1. **Avalanche C-Chain** — Fast, low-fee EVM execution
2. **JPYC Integration** — JPY-pegged stablecoin, removes crypto volatility for users
3. **SENQMarket Contract** — Fully on-chain bet management, payouts, and cancellations
4. **Multi-Sign Governance** — No single point of manipulation
5. **Parimutuel Over AMM** — Simple, fair, no impermanent loss

---

## Backup Talking Points

If demo fails:
- Walk through contract code (`contracts/src/SENQMarket.sol`)
- Show pre-recorded happy path video
- Highlight ERC20 approve/transferFrom pattern and on-chain payout logic

If time remaining:
- Show weighted betting system (user attributes multiply bet effectiveness)
- Explain 2% protocol fee and cancel/refund mechanism
- Discuss future features (yield on locked JPYC, secondary trading)
