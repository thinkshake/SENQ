/**
 * EVM client utilities for SENQ prediction markets.
 *
 * Uses viem for type-safe transaction signing and submission.
 */
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config";

// ── Chain definition ───────────────────────────────────────────────

function getChain() {
  return defineChain({
    id: config.evmChainId,
    name: "EVM",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [config.evmRpcUrl] },
    },
  });
}

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

// ── Balance ────────────────────────────────────────────────────────

/**
 * Get ETH balance for an address (in wei).
 */
export async function getEvmBalance(address: `0x${string}`): Promise<bigint> {
  const client = createPublicClient({
    chain: getChain(),
    transport: http(config.evmRpcUrl),
  });
  return client.getBalance({ address });
}

// ── Transaction submission ─────────────────────────────────────────

/**
 * Sign and submit an ETH transfer using the operator wallet.
 * Used for server-side payouts.
 */
export async function signAndSubmitWithOperator(
  to: `0x${string}`,
  valueWei: bigint
): Promise<{ hash: string }> {
  if (!config.operatorPrivateKey) {
    throw new Error("EVM_OPERATOR_PRIVATE_KEY not configured");
  }

  const account = privateKeyToAccount(config.operatorPrivateKey as `0x${string}`);
  const chain = getChain();

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.evmRpcUrl),
  });

  const hash = await walletClient.sendTransaction({
    to,
    value: valueWei,
  });

  return { hash };
}
