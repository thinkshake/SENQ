"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  balance: string | null; // ETH balance in wei
  loading: boolean;
  error: string | null;
  metaMaskInstalled: boolean;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (tx: unknown) => Promise<{ hash: string } | null>;
  refreshBalance: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

// ── EIP-1193 window.ethereum type ─────────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// ── Provider ───────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    network: null,
    balance: null,
    loading: false,
    error: null,
    metaMaskInstalled: false,
  });

  const refreshBalance = useCallback(async () => {
    const address = state.address;
    if (!address) return;

    try {
      const response = await fetch(`${API_URL}/balance/${address}`);
      const data = await response.json() as { balance?: string; error?: string };
      if (data.balance) {
        setState((s) => ({ ...s, balance: data.balance! }));
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [state.address]);

  // Check if MetaMask is installed on mount
  useEffect(() => {
    const isInstalled = typeof window !== "undefined" && !!window.ethereum;
    setState((s) => ({ ...s, metaMaskInstalled: isInstalled }));

    if (isInstalled) {
      // Try to restore session
      const saved = localStorage.getItem("senq_wallet");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.address) {
            setState((s) => ({
              ...s,
              connected: true,
              address: parsed.address,
              network: parsed.network || null,
            }));
          }
        } catch {
          localStorage.removeItem("senq_wallet");
        }
      }
    }
  }, []);

  // Fetch balance when address changes
  useEffect(() => {
    if (state.address) {
      refreshBalance();
    }
  }, [state.address, refreshBalance]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it from metamask.io");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }

      const address = accounts[0];
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      const network = parseInt(chainIdHex, 16).toString();

      localStorage.setItem("senq_wallet", JSON.stringify({ address, network }));

      setState({
        connected: true,
        address,
        network,
        balance: null,
        loading: false,
        error: null,
        metaMaskInstalled: true,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("senq_wallet");
    setState((s) => ({
      ...s,
      connected: false,
      address: null,
      network: null,
      balance: null,
      error: null,
    }));
  }, []);

  const signAndSubmitTransaction = useCallback(
    async (tx: unknown): Promise<{ hash: string } | null> => {
      if (!state.connected) {
        throw new Error("Wallet not connected");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask is not available");
      }

      try {
        const hash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [tx],
        }) as string;

        if (!hash) {
          throw new Error("Transaction rejected");
        }

        // Refresh balance after transaction
        setTimeout(() => refreshBalance(), 3000);
        return { hash };
      } catch (err) {
        console.error("Transaction error:", err);
        throw err;
      }
    },
    [state.connected, refreshBalance]
  );

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    signAndSubmitTransaction,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
