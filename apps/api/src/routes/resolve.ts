/**
 * Payout API routes.
 * Market resolution is handled by routes/markets.ts POST /:id/resolve.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  executePayouts,
  confirmPayout,
  getPayoutsForMarket,
  getPayoutsForUser,
  getMarketPayoutStats,
  finalizeMarketIfComplete,
} from "../services/payouts";
import { getMarket } from "../services/markets";
import { config } from "../config";

const resolve = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const executePayoutsSchema = z.object({
  batchSize: z.number().int().min(1).max(100).optional(),
});

const confirmPayoutSchema = z.object({
  payoutId: z.string().min(1),
  txHash: z.string().min(1),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * POST /markets/:id/payouts - Execute payouts (admin only)
 * Returns EVM payment tx objects for batch processing
 */
resolve.post("/markets/:id/payouts", zValidator("json", executePayoutsSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const marketId = c.req.param("id");
  const body = c.req.valid("json");

  try {
    const result = executePayouts({
      marketId,
      batchSize: body.batchSize,
    });

    return c.json({
      data: {
        payouts: result.payouts,
        count: result.payouts.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to execute payouts";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:id/payouts/confirm - Confirm a payout tx
 */
resolve.post("/markets/:id/payouts/confirm", zValidator("json", confirmPayoutSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const body = c.req.valid("json");

  try {
    const payout = confirmPayout(body.payoutId, body.txHash);
    if (!payout) {
      return c.json({ error: { code: "NOT_FOUND", message: "Payout not found" } }, 404);
    }

    // Check if all payouts complete and finalize market
    const marketId = c.req.param("id");
    finalizeMarketIfComplete(marketId);

    return c.json({
      data: {
        payoutId: payout.id,
        status: payout.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm payout";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * GET /markets/:id/payouts - List payouts for a market
 */
resolve.get("/markets/:id/payouts", async (c) => {
  const marketId = c.req.param("id");
  const status = c.req.query("status");

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const payouts = getPayoutsForMarket(marketId, status);
  const stats = getMarketPayoutStats(marketId);

  return c.json({
    data: {
      payouts: payouts.map((p) => ({
        id: p.id,
        userId: p.user_id,
        amountWei: p.amount_wei,
        status: p.status,
        payoutTx: p.payout_tx,
        createdAt: p.created_at,
      })),
      stats: {
        total: stats.total,
        pending: stats.pending,
        sent: stats.sent,
        failed: stats.failed,
        totalWei: stats.totalWei,
        sentWei: stats.sentWei,
      },
    },
  });
});

/**
 * GET /users/:address/payouts - List payouts for a user
 */
resolve.get("/users/:address/payouts", async (c) => {
  const address = c.req.param("address");
  const payouts = getPayoutsForUser(address);

  return c.json({
    data: payouts.map((p) => {
      const market = getMarket(p.market_id);
      return {
        id: p.id,
        marketId: p.market_id,
        marketTitle: market?.title,
        amountWei: p.amount_wei,
        status: p.status,
        payoutTx: p.payout_tx,
        createdAt: p.created_at,
      };
    }),
  });
});

export default resolve;
