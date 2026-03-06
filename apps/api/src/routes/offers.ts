/**
 * DEX Offers API routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createOffer,
  getTradesForMarket,
  getTradeStats,
  getTrade,
} from "../services/trades";
import { getMarket } from "../services/markets";

const offers = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const createOfferSchema = z.object({
  outcome: z.enum(["YES", "NO"]),
  side: z.enum(["buy", "sell"]),
  tokenAmount: z.string().regex(/^\d+(\.\d+)?$/, "Token amount must be numeric"),
  ethAmountWei: z.string().regex(/^\d+$/, "ETH amount must be positive integer"),
  userAddress: z.string().min(1),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * POST /markets/:marketId/offers - Create offer intent
 * Returns EVM tx payload for signing
 */
offers.post("/markets/:marketId/offers", zValidator("json", createOfferSchema), async (c) => {
  const marketId = c.req.param("marketId");
  const body = c.req.valid("json");

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  try {
    const result = createOffer({
      marketId,
      userAddress: body.userAddress,
      outcome: body.outcome,
      side: body.side,
      tokenAmount: body.tokenAmount,
      ethAmountWei: body.ethAmountWei,
    });

    return c.json({
      data: {
        offer: result.offerTx,
      },
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create offer";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * GET /markets/:marketId/trades - List trades for a market
 */
offers.get("/markets/:marketId/trades", async (c) => {
  const marketId = c.req.param("marketId");

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const trades = getTradesForMarket(marketId);
  const stats = getTradeStats(marketId);

  return c.json({
    data: {
      trades: trades.map((t) => ({
        id: t.id,
        offerTx: t.offer_tx,
        takerGets: t.taker_gets,
        takerPays: t.taker_pays,
        executedAt: t.executed_at,
        blockNumber: t.block_number,
      })),
      stats: {
        tradeCount: stats.count,
        volumeWei: stats.volumeWei,
      },
    },
  });
});

/**
 * GET /trades/:id - Get a single trade
 */
offers.get("/trades/:id", async (c) => {
  const id = c.req.param("id");
  const trade = getTrade(id);

  if (!trade) {
    return c.json({ error: { code: "NOT_FOUND", message: "Trade not found" } }, 404);
  }

  return c.json({
    data: {
      id: trade.id,
      marketId: trade.market_id,
      offerTx: trade.offer_tx,
      takerGets: trade.taker_gets,
      takerPays: trade.taker_pays,
      executedAt: trade.executed_at,
      blockNumber: trade.block_number,
    },
  });
});

export default offers;
