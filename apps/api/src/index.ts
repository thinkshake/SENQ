import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config, validateConfig } from "./config";
import { initDatabase, closeDatabase } from "./db";
import { createXrplClient, closeXrplClient, getXrplHealth } from "./xrpl/client";
import healthRoutes from "./routes/health";
import marketsRoutes from "./routes/markets";
import betsRoutes from "./routes/bets";
import offersRoutes from "./routes/offers";
import resolveRoutes from "./routes/resolve";
import usersRoutes from "./routes/users";
import categoriesRoutes from "./routes/categories";
import balanceRoutes from "./routes/balance";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  })
);

// Routes
app.route("/", healthRoutes);
app.route("/api/markets", marketsRoutes);
app.route("/api", betsRoutes);
app.route("/api", offersRoutes);
app.route("/api", resolveRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/categories", categoriesRoutes);
app.route("/api/balance", balanceRoutes);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "MITATE API",
    version: "0.1.0",
    description: "XRPL Parimutuel Prediction Market API",
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500
  );
});

// Startup
async function start() {
  console.log("Starting MITATE API...");

  // Validate configuration
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error("Configuration errors:");
    configErrors.forEach((e) => console.error(`  - ${e}`));
    if (config.nodeEnv === "production") {
      process.exit(1);
    }
  }

  // Initialize database
  try {
    await initDatabase();
    console.log("Database initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  // Initialize XRPL client
  try {
    await createXrplClient();
    console.log("XRPL client initialized");
  } catch (err) {
    console.error("Failed to initialize XRPL client:", err);
    // Don't exit - allow startup without XRPL for development
  }

  console.log(`MITATE API listening on port ${config.port}`);
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await closeXrplClient();
  closeDatabase();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
start();

export default {
  port: config.port,
  fetch: app.fetch,
};
