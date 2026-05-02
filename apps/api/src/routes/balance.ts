import { Hono } from "hono";
import { xrplRpcRequest } from "../xrpl/client";

const balance = new Hono();

/**
 * GET /balance/:address - Get XRP balance in drops for an XRPL address.
 * Used by the frontend to display available balance before betting.
 */
balance.get("/:address", async (c) => {
  const address = c.req.param("address");

  try {
    const result = await xrplRpcRequest<{
      account_data: { Balance: string };
    }>("account_info", {
      account: address,
      ledger_index: "current",
    });

    return c.json({ balance: result.account_data.Balance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch balance";
    // Return 0 for unfunded accounts (actNotFound) so the UI doesn't hang
    if (message.includes("actNotFound") || message.includes("Account not found")) {
      return c.json({ balance: "0" });
    }
    return c.json({ error: message }, 502);
  }
});

export default balance;
