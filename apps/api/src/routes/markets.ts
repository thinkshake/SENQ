/**
 * Markets API routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createNewMarket,
  getMarket,
  getMarketFull,
  getMarkets,
  getOpenMarketsForBetting,
  updateMarketMetadata,
  calculateOdds,
  calculatePrice,
} from "../services/markets";
import { config } from "../config";
import { getOutcomesWithProbability } from "../db/models/outcomes";
import { CONTRACT_ADDRESS, ERC20_ABI, SENQ_MARKET_ABI, resolveMarketOnChain } from "../evm/client";
import { encodeFunctionData } from "viem";

const markets = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const createMarketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
  categoryLabel: z.string().max(50).optional(),
  bettingDeadline: z.string().datetime(),
  resolutionTime: z.string().datetime().optional(),
  outcomes: z
    .array(z.object({ label: z.string().min(1).max(200) }))
    .min(2)
    .max(5)
    .optional(),
});

const updateMarketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(50).optional(),
  categoryLabel: z.string().max(50).optional(),
});

// ── Helpers ────────────────────────────────────────────────────────

function formatMarketResponse(m: {
  id: string;
  title: string;
  description: string;
  category: string | null;
  category_label: string | null;
  status: string;
  betting_deadline: string;
  pool_total_wei: string;
  created_at: string;
  outcomes?: { id: string; label: string; probability: number; total_amount_wei: string }[];
}) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    categoryLabel: m.category_label,
    status: m.status,
    bettingDeadline: m.betting_deadline,
    totalPoolWei: m.pool_total_wei,
    outcomes: (m.outcomes ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      probability: o.probability,
      totalAmountWei: o.total_amount_wei,
    })),
    createdAt: m.created_at,
  };
}

// ── Routes ─────────────────────────────────────────────────────────

markets.get("/", async (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  const marketList = getMarkets(status, category);

  return c.json({ markets: marketList.map(formatMarketResponse) });
});

markets.get("/open", async (c) => {
  const marketList = getOpenMarketsForBetting();

  return c.json({
    markets: marketList.map((m) => {
      const outcomes = getOutcomesWithProbability(m.id);
      return formatMarketResponse({ ...m, outcomes });
    }),
  });
});

markets.get("/:id", async (c) => {
  const id = c.req.param("id");
  const market = getMarketFull(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  return c.json({
    ...formatMarketResponse(market),
    resolutionTime: market.resolution_time,
    resolvedOutcomeId: market.resolved_outcome_id,
    operatorAddress: market.operator_address,
  });
});

/**
 * POST /markets - Create a new market (admin only).
 * Market opens immediately on EVM.
 */
markets.post("/", zValidator("json", createMarketSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const body = c.req.valid("json");

  try {
    const result = await createNewMarket(body, config.operatorAddress);

    return c.json(formatMarketResponse(result.market), 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * PATCH /markets/:id - Update market metadata (admin only)
 */
markets.patch("/:id", zValidator("json", updateMarketSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const body = c.req.valid("json");

  try {
    const market = updateMarketMetadata(id, body);
    if (!market) {
      return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
    }

    return c.json({
      data: {
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        categoryLabel: market.category_label,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:id/resolve - Resolve a market (admin only)
 * Creates payout records and auto-executes payouts if operator key is set
 */
markets.post("/:id/resolve", async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json<{ outcomeId: string; txHash?: string }>();

  if (!body.outcomeId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "outcomeId is required" } }, 400);
  }

  const { updateMarket, getMarketById } = await import("../db/models/markets");
  const { listConfirmedBetsByOutcomeId, getTotalEffectiveAmount } = await import("../db/models/bets");
  const { createPayout, updatePayout } = await import("../db/models/payouts");
  const { getUserById } = await import("../db/models/users");

  const market = getMarket(id);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  if (market.status !== "Closed" && market.status !== "Open") {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Cannot resolve market in ${market.status} status` } }, 400);
  }

  const updated = updateMarket(id, {
    status: "Resolved",
    resolvedOutcomeId: body.outcomeId,
  });

  console.log("[resolve] Market resolved:", id, "winning outcome:", body.outcomeId);

  // Resolve on-chain for binary markets
  const chainMarketId = market.chain_market_id;
  if (chainMarketId != null) {
    try {
      const outcomes = getOutcomesWithProbability(id);
      const winningIndex = outcomes.findIndex((o) => o.id === body.outcomeId);
      const onChainOutcome = winningIndex === 0; // index 0 = YES (true), index 1 = NO (false)

      const resolveTxHash = await resolveMarketOnChain(
        BigInt(chainMarketId),
        onChainOutcome
      );
      console.log("[resolve] On-chain resolve tx:", resolveTxHash);
    } catch (err) {
      console.error("[resolve] On-chain resolve failed:", err);
      updateMarket(id, { status: "Stalled" });
      return c.json({
        error: { code: "ON_CHAIN_ERROR", message: "On-chain resolve failed. Market set to Stalled." },
      }, 500);
    }
  }

  const winningBets = listConfirmedBetsByOutcomeId(id, body.outcomeId);
  const totalPool = BigInt(market.pool_total_wei);
  const winningTotal = BigInt(getTotalEffectiveAmount(id, body.outcomeId));

  const payoutResults: { betId: string; userId: string; amount: string; payoutTx?: unknown }[] = [];

  if (winningTotal > 0n && winningBets.length > 0) {
    for (const bet of winningBets) {
      const betEffective = BigInt(bet.effective_amount_wei ?? bet.amount_wei);
      const payoutAmount = (totalPool * betEffective) / winningTotal;

      if (payoutAmount <= 0n) continue;

      const user = getUserById(bet.user_id);
      if (!user) {
        console.error("[resolve] User not found for bet:", bet.id);
        continue;
      }

      const payout = createPayout({
        marketId: id,
        userId: bet.user_id,
        amountWei: payoutAmount.toString(),
      });

      // Generate payout tx
      let payoutTx: unknown;
      if (chainMarketId != null) {
        // On-chain market: user calls claimPayout on contract
        payoutTx = {
          from: user.wallet_address,
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: SENQ_MARKET_ABI,
            functionName: "claimPayout",
            args: [BigInt(chainMarketId)],
          }),
        };
      } else {
        // Off-chain market: operator JPYC transfer
        const jpycAddress = config.jpycTokenAddress as `0x${string}`;
        payoutTx = {
          from: config.operatorAddress,
          to: jpycAddress,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [user.wallet_address as `0x${string}`, payoutAmount],
          }),
        };
      }

      payoutResults.push({
        betId: bet.id,
        userId: user.wallet_address,
        amount: payoutAmount.toString(),
        payoutTx,
      });
    }
  }

  return c.json({
    data: {
      id: updated?.id,
      status: updated?.status,
      resolvedOutcomeId: updated?.resolved_outcome_id,
      payoutsCreated: payoutResults.length,
      payoutResults,
    },
  });
});

/**
 * POST /markets/:id/close - Close market (admin only)
 */
markets.post("/:id/close", async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const market = getMarket(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  if (market.status !== "Open") {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Cannot close market in ${market.status} status` } }, 400);
  }

  const { updateMarket } = await import("../db/models/markets");
  const updated = updateMarket(id, { status: "Closed" });

  return c.json({ data: { id: updated?.id, status: updated?.status } });
});

export default markets;
