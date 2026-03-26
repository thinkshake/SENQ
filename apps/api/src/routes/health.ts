import { Hono } from "hono";
import { getDb } from "../db";
import { getEvmHealth } from "../evm/client";

const app = new Hono();

/**
 * Health check endpoint.
 */
app.get("/health", async (c) => {
  const evmHealth = await getEvmHealth();

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    evm: evmHealth,
  });
});

/**
 * Readiness check endpoint.
 */
app.get("/ready", async (c) => {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {};

  try {
    const db = getDb();
    const result = db.query("SELECT 1 as test").get() as { test: number } | null;
    if (result?.test === 1) {
      checks.database = { status: "ok" };
    } else {
      checks.database = { status: "error", message: "Query failed" };
    }
  } catch (err) {
    checks.database = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const evmHealth = await getEvmHealth();
  if (evmHealth.connected) {
    checks.evm = { status: "ok" };
  } else {
    checks.evm = {
      status: "error",
      message: evmHealth.error || "Not connected",
    };
  }

  const allReady = Object.values(checks).every((check) => check.status === "ok");

  return c.json(
    {
      status: allReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks,
    },
    allReady ? 200 : 503
  );
});

/**
 * Get JPYC token balance for an EVM address.
 * Proxies to EVM RPC to avoid CORS issues.
 */
app.get("/balance/:address", async (c) => {
  const address = c.req.param("address");

  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return c.json({ error: "Invalid EVM address" }, 400);
  }

  try {
    const { getJpycBalance } = await import("../evm/client");
    const balanceWei = await getJpycBalance(address as `0x${string}`);
    return c.json({ balance: balanceWei.toString() });
  } catch (err) {
    return c.json({ error: "Failed to fetch balance" }, 500);
  }
});

/**
 * Get JPYC token allowance for an EVM address to SENQMarket contract.
 */
app.get("/allowance/:address", async (c) => {
  const address = c.req.param("address");
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return c.json({ error: "Invalid EVM address" }, 400);
  }
  try {
    const { getJpycAllowance, CONTRACT_ADDRESS } = await import("../evm/client");
    const allowance = await getJpycAllowance(
      address as `0x${string}`,
      CONTRACT_ADDRESS
    );
    return c.json({ allowance: allowance.toString() });
  } catch (err) {
    return c.json({ error: "Failed to fetch allowance" }, 500);
  }
});

export default app;
