/**
 * Application configuration from environment variables.
 */
const env = (key: string): string | undefined => process.env[key];

export const config = {
  /** Server port */
  port: parseInt(env("PORT") || "3001", 10),

  /** Environment mode */
  nodeEnv: env("NODE_ENV") || "development",

  /** SQLite database path */
  databasePath: env("DATABASE_PATH") || "./data/senq.db",

  /** EVM JSON-RPC endpoint */
  evmRpcUrl: env("EVM_RPC_URL") || "http://localhost:8545",

  /** EVM Chain ID */
  evmChainId: parseInt(env("EVM_CHAIN_ID") || "1337", 10),

  /** Market operator EVM address (receives bet payments) */
  operatorAddress: env("EVM_OPERATOR_ADDRESS") || "",

  /** Market operator private key (for auto-payouts) */
  operatorPrivateKey: env("EVM_OPERATOR_PRIVATE_KEY") || "",

  /** SENQMarket contract address */
  evmContractAddress: env("EVM_CONTRACT_ADDRESS") || "",

  /** JPYC token contract address */
  jpycTokenAddress: env("JPYC_TOKEN_ADDRESS") || "",

  /** JPYC token decimals */
  jpycDecimals: parseInt(env("JPYC_DECIMALS") || "18", 10),

  /** Admin API key for privileged operations */
  adminApiKey: env("ADMIN_API_KEY") || "",
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
    if (!config.jpycTokenAddress) {
      errors.push("JPYC_TOKEN_ADDRESS is required in production");
    }
  }

  return errors;
}
