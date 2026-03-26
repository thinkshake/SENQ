/**
 * EVM client utilities for SENQ prediction markets.
 *
 * Uses viem for type-safe transaction signing and submission.
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config";

// ── Chain definition ───────────────────────────────────────────────

function getChain() {
  return defineChain({
    id: config.evmChainId,
    name: "EVM",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    rpcUrls: {
      default: { http: [config.evmRpcUrl] },
    },
  });
}

// ── ERC20 ABI ─────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi;

// ── Health ─────────────────────────────────────────────────────────

export interface EvmHealth {
  connected: boolean;
  chainId?: number;
  blockNumber?: string;
  error?: string;
}

/**
 * Get health status of the EVM RPC connection.
 */
export async function getEvmHealth(): Promise<EvmHealth> {
  try {
    const client = createPublicClient({
      chain: getChain(),
      transport: http(config.evmRpcUrl),
    });

    const [chainId, blockNumber] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
    ]);

    return {
      connected: true,
      chainId,
      blockNumber: blockNumber.toString(),
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── JPYC Balance & Allowance ──────────────────────────────────────

/**
 * Get JPYC token balance for an address.
 */
export async function getJpycBalance(address: `0x${string}`): Promise<bigint> {
  const client = createPublicClient({
    chain: getChain(),
    transport: http(config.evmRpcUrl),
  });
  return client.readContract({
    address: config.jpycTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });
}

/**
 * Get JPYC token allowance for owner -> spender.
 */
export async function getJpycAllowance(owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
  const client = createPublicClient({
    chain: getChain(),
    transport: http(config.evmRpcUrl),
  });
  return client.readContract({
    address: config.jpycTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
}

// ── SENQMarket contract ────────────────────────────────────────────

export const CONTRACT_ADDRESS = config.evmContractAddress as `0x${string}`;

export const SENQ_MARKET_ABI = [
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "bettingDeadline", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "outcome", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "betYes",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "betNo",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimPayout",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "markets",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "bettingDeadline", type: "uint256", internalType: "uint256" },
      { name: "totalYes", type: "uint256", internalType: "uint256" },
      { name: "totalNo", type: "uint256", internalType: "uint256" },
      { name: "resolved", type: "bool", internalType: "bool" },
      { name: "outcome", type: "bool", internalType: "bool" },
      { name: "cancelled", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "question", type: "string", indexed: false, internalType: "string" },
      { name: "bettingDeadline", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const satisfies Abi;

/**
 * Create a market on-chain via the SENQMarket contract.
 */
export async function createMarketOnChain(
  question: string,
  bettingDeadline: number
): Promise<{ txHash: string; marketId: bigint }> {
  if (!config.operatorPrivateKey) {
    throw new Error("EVM_OPERATOR_PRIVATE_KEY not configured");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("EVM_CONTRACT_ADDRESS not configured");
  }

  const account = privateKeyToAccount(config.operatorPrivateKey as `0x${string}`);
  const chain = getChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(config.evmRpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.evmRpcUrl),
  });

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: SENQ_MARKET_ABI,
    functionName: "createMarket",
    args: [question, BigInt(bettingDeadline)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse MarketCreated event to get marketId
  const marketCreatedLog = receipt.logs.find(
    (log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
  );
  const marketId = marketCreatedLog?.topics[1]
    ? BigInt(marketCreatedLog.topics[1])
    : 0n;

  return { txHash: hash, marketId };
}

/**
 * Read a Market struct from the SENQMarket contract.
 */
export async function getMarketOnChain(marketId: bigint) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("EVM_CONTRACT_ADDRESS not configured");
  }

  const publicClient = createPublicClient({
    chain: getChain(),
    transport: http(config.evmRpcUrl),
  });

  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: SENQ_MARKET_ABI,
    functionName: "markets",
    args: [marketId],
  });

  const [question, bettingDeadline, totalYes, totalNo, resolved, outcome, cancelled] =
    result as [string, bigint, bigint, bigint, boolean, boolean, boolean];

  return { question, bettingDeadline, totalYes, totalNo, resolved, outcome, cancelled };
}

/**
 * Resolve a market on-chain (owner only).
 */
export async function resolveMarketOnChain(
  marketId: bigint,
  outcome: boolean
): Promise<string> {
  if (!config.operatorPrivateKey) {
    throw new Error("EVM_OPERATOR_PRIVATE_KEY not configured");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("EVM_CONTRACT_ADDRESS not configured");
  }

  const account = privateKeyToAccount(config.operatorPrivateKey as `0x${string}`);
  const chain = getChain();

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.evmRpcUrl),
  });

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: SENQ_MARKET_ABI,
    functionName: "resolve",
    args: [marketId, outcome],
  });

  return hash;
}
