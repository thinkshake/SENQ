/**
 * Bets API routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  placeBet,
  confirmBet,
  getBet,
  getBetsForMarket,
  getBetsForUser,
  calculatePotentialPayout,
  calculateActualPayout,
} from "../services/bets";
import { getMarket } from "../services/markets";
import { getOutcomeById } from "../db/models/outcomes";

const bets = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const placeBetSchema = z.object({
  outcomeId: z.string().min(1),
  amountWei: z.string().regex(/^\d+$/, "Amount must be positive integer string"),
  bettorAddress: z.string().min(1),
});

const confirmBetSchema = z.object({
  txHash: z.string().min(1),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * POST /markets/:marketId/bets - Create bet intent
 * Returns EVM payment tx for the user to sign and submit
 */
bets.post("/markets/:marketId/bets", zValidator("json", placeBetSchema), async (c) => {
  const marketId = c.req.param("marketId");
  const body = c.req.valid("json");

  // Validate market exists
  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  try {
    const result = await placeBet({
      marketId,
      outcomeId: body.outcomeId,
      amountWei: body.amountWei,
      userAddress: body.bettorAddress,
    });

    return c.json({
      bet: {
        id: result.bet.id,
        marketId: result.bet.market_id,
        outcomeId: result.bet.outcome_id,
        amountWei: result.bet.amount_wei,
        status: result.bet.status,
      },
      weightScore: result.weightScore,
      effectiveAmountWei: result.effectiveAmountWei,
      approveTx: result.approveTx,
      betTx: result.betTx,
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bet";
    if (message.includes("not accepting bets")) {
      return c.json({ error: { code: "BETTING_CLOSED", message } }, 400);
    }
    if (message.includes("Outcome not found")) {
      return c.json({ error: { code: "OUTCOME_NOT_FOUND", message } }, 400);
    }
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:marketId/bets/:betId/confirm - Confirm bet after EVM transaction
 */
bets.post("/markets/:marketId/bets/:betId/confirm", zValidator("json", confirmBetSchema), async (c) => {
  console.log("[confirmBet route] Request received");
  const marketId = c.req.param("marketId");
  const betId = c.req.param("betId");
  const body = c.req.valid("json");
  console.log("[confirmBet route] marketId:", marketId, "betId:", betId, "txHash:", body.txHash?.slice(0, 16) + "...");

  const bet = getBet(betId);
  if (!bet) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet not found" } }, 404);
  }
  if (bet.market_id !== marketId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet does not belong to this market" } }, 400);
  }

  try {
    const confirmedBet = await confirmBet({
      betId,
      paymentTxHash: body.txHash,
    });

    return c.json({
      data: {
        betId: confirmedBet.id,
        status: confirmedBet.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm bet";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * GET /markets/:marketId/bets - List bets for a market
 */
bets.get("/markets/:marketId/bets", async (c) => {
  const marketId = c.req.param("marketId");
  const status = c.req.query("status");
  const limit = parseInt(c.req.query("limit") ?? "20", 10);

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const betList = getBetsForMarket(marketId, status);

  return c.json({
    bets: betList.slice(0, limit).map((bet) => {
      const outcome = bet.outcome_id ? getOutcomeById(bet.outcome_id) : null;
      return {
        id: bet.id,
        marketId: bet.market_id,
        outcomeId: bet.outcome_id,
        outcomeLabel: outcome?.label ?? bet.outcome,
        bettorAddress: bet.user_id,
        amountWei: bet.amount_wei,
        weightScore: bet.weight_score,
        effectiveAmountWei: bet.effective_amount_wei,
        txHash: bet.payment_tx,
        status: bet.status,
        createdAt: bet.placed_at,
      };
    }),
  });
});

/**
 * GET /bets/:id - Get a single bet
 */
bets.get("/bets/:id", async (c) => {
  const id = c.req.param("id");
  const bet = getBet(id);

  if (!bet) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet not found" } }, 404);
  }

  const market = getMarket(bet.market_id);
  const outcome = bet.outcome_id ? getOutcomeById(bet.outcome_id) : null;
  let payout: string | null = null;

  if (market?.status === "Resolved") {
    payout = calculateActualPayout(bet);
  }

  return c.json({
    data: {
      id: bet.id,
      marketId: bet.market_id,
      outcomeId: bet.outcome_id,
      outcomeLabel: outcome?.label ?? bet.outcome,
      amountWei: bet.amount_wei,
      weightScore: bet.weight_score,
      effectiveAmountWei: bet.effective_amount_wei,
      status: bet.status,
      createdAt: bet.placed_at,
      paymentTx: bet.payment_tx,
      payout,
    },
  });
});

/**
 * GET /users/:address/bets - List bets for a user
 */
bets.get("/users/:address/bets", async (c) => {
  const address = c.req.param("address");
  const betList = getBetsForUser(address);

  const betsData = betList.map((bet) => {
    const market = getMarket(bet.market_id);
    const outcome = bet.outcome_id ? getOutcomeById(bet.outcome_id) : null;
    let payout: string | null = null;

    if (market?.status === "Resolved") {
      payout = calculateActualPayout(bet);
    }

    return {
      id: bet.id,
      marketId: bet.market_id,
      marketTitle: market?.title,
      outcomeId: bet.outcome_id,
      outcomeLabel: outcome?.label ?? bet.outcome,
      amountWei: bet.amount_wei,
      weightScore: bet.weight_score,
      effectiveAmountWei: bet.effective_amount_wei,
      status: bet.status,
      createdAt: bet.placed_at,
      payout,
    };
  });

  const totalBets = betsData.length;
  const totalAmountWei = betList.reduce(
    (sum, b) => sum + BigInt(b.amount_wei),
    0n
  ).toString();

  return c.json({
    bets: betsData,
    totalBets,
    totalAmountWei,
  });
});

/**
 * GET /markets/:marketId/preview - Preview bet (calculate potential payout)
 */
bets.get("/markets/:marketId/preview", async (c) => {
  const marketId = c.req.param("marketId");
  const outcomeId = c.req.query("outcomeId");
  const amountWei = c.req.query("amountWei");
  const bettorAddress = c.req.query("bettorAddress");

  if (!outcomeId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "outcomeId is required" } }, 400);
  }
  if (!amountWei || !/^\d+$/.test(amountWei)) {
    return c.json({ error: { code: "INVALID_AMOUNT", message: "amountWei must be positive integer" } }, 400);
  }

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const result = calculatePotentialPayout(marketId, outcomeId, amountWei, bettorAddress);

  // Calculate implied odds
  const impliedOdds = Number(amountWei) > 0
    ? (Number(result.potentialPayout) / Number(amountWei)).toFixed(4)
    : "0";

  return c.json({
    potentialPayout: result.potentialPayout,
    impliedOdds,
    weightScore: result.weightScore,
    effectiveAmount: result.effectiveAmount,
  });
});

export default bets;
