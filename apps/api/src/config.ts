/**
 * Application configuration from environment variables.
 */
export const config = {
  /** Server port */
  port: parseInt(process.env.PORT || "3001", 10),

  /** Environment mode */
  nodeEnv: process.env.NODE_ENV || "development",

  /** SQLite database path */
  databasePath: process.env.DATABASE_PATH || "./data/senq.db",

  /** EVM JSON-RPC endpoint */
  evmRpcUrl: process.env.EVM_RPC_URL || "http://localhost:8545",

  /** EVM Chain ID */
  evmChainId: parseInt(process.env.EVM_CHAIN_ID || "1337", 10),

  /** Market operator EVM address (receives bet payments) */
  operatorAddress: process.env.EVM_OPERATOR_ADDRESS || "",

  /** Market operator private key (for auto-payouts) */
  operatorPrivateKey: process.env.EVM_OPERATOR_PRIVATE_KEY || "",

  /** Admin API key for privileged operations */
  adminApiKey: process.env.ADMIN_API_KEY || "",
} as const;

/**
 * Validate required configuration on startup.
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (config.nodeEnv === "production") {
    if (!config.operatorAddress) {
      errors.push("EVM_OPERATOR_ADDRESS is required in production");
    }
    if (!config.adminApiKey) {
      errors.push("ADMIN_API_KEY is required in production");
    }
  }

  return errors;
}
