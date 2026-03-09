# SENQ Demo Script

**Duration:** 3 minutes  
**Audience:** JFIIP Hackathon judges  

---

## Opening (0:00 - 0:20)

"SENQ is a prediction market powered by XRPL. It uses 6 native XRPL features to create a trustless, verifiable betting platform."

**Show:** Homepage with market listings

---

## Problem & Solution (0:20 - 0:40)

"Traditional prediction markets use complex AMM pricing that doesn't fit XRPL's architecture. SENQ uses parimutuel betting instead — simple pool-based payouts that work perfectly with XRPL's primitives."

**Show:** Architecture diagram highlighting XRPL features

---

## Live Demo: Betting Flow (0:40 - 1:40)

### 1. Connect Wallet (0:40 - 0:50)
"Let's place a bet. First, I connect my GemWallet."

**Action:** Click Connect → GemWallet popup → Approve connection

### 2. Select Market (0:50 - 1:00)
"I'll bet on 'Will Bitcoin reach $100K by end of 2025?' — currently 65% YES."

**Action:** Navigate to market detail page

### 3. Place Bet (1:00 - 1:20)
"I'll bet 50 XRP on YES. The system builds two XRPL transactions: TrustSet for the outcome token, and Payment to the escrow pool."

**Action:** Enter amount → Click Bet → Sign transaction in GemWallet

### 4. Verify On-Chain (1:20 - 1:40)
"My bet is now recorded on XRPL. Let's verify on the explorer."

**Action:** Click tx link → Show XRPL explorer with memo data

---

## XRPL Features Deep Dive (1:40 - 2:20)

### Escrow (1:40 - 1:50)
"All XRP bets are locked in an Escrow with CancelAfter set to the betting deadline."

### Issued Currency (1:50 - 2:00)
"Each market has two tokens — YES and NO — minted by our issuer account."

### Multi-Sign Resolution (2:00 - 2:20)
"When the market closes, a 2-of-3 multi-sign committee resolves the outcome. This prevents any single party from manipulating results."

**Show:** Multi-sign signer list on XRPL explorer

---

## Payout Demo (2:20 - 2:40)

"When the market resolves YES, winning bettors share the entire pool proportionally. Payouts are executed as XRPL Payment transactions."

**Show:** Payout calculation: `Your Bet / Total YES Bets × Total Pool`

---

## Closing (2:40 - 3:00)

"SENQ demonstrates how XRPL's unique features — Escrow, Issued Currency, Trust Lines, DEX, Multi-Sign, and Memos — can power a fully on-chain prediction market."

"All data is verifiable on the ledger. All transactions carry SENQ memos for transparency."

**Show:** GitHub repo + live deployment URL

---

## Key Points to Emphasize

1. **6 XRPL Features Used** — Escrow, Issued Currency, Trust Line, DEX, Multi-Sign, Memo
2. **Parimutuel Over AMM** — Fits XRPL's architecture without on-chain compute
3. **Verifiable On-Chain** — Every bet, trade, and payout has XRPL transaction hash
4. **Multi-Sign Governance** — No single point of manipulation
5. **Not Portable** — This design only works on XRPL (Track Depth scoring)

---

## Backup Talking Points

If demo fails:
- Walk through code showing transaction builders
- Show pre-recorded happy path video
- Highlight memo encoding and escrow time-lock logic

If time remaining:
- Show secondary trading on DEX
- Explain token burn on payout (optional feature)
- Discuss future features (bet weighting, yield on locked funds)
