"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  isInstalled,
  getAddress,
  getNetwork,
  submitTransaction,
} from "@gemwallet/api";

// ── Types ──────────────────────────────────────────────────────────

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  balance: string | null; // XRP balance in drops
  loading: boolean;
  error: string | null;
  gemWalletInstalled: boolean;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (tx: unknown) => Promise<{ hash: string } | null>;
  refreshBalance: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

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
    gemWalletInstalled: false,
  });

  const refreshBalance = useCallback(async () => {
    const address = state.address;
    if (!address) return;

    try {
      // Use API proxy to avoid CORS issues
      const response = await fetch(`${API_URL}/balance/${address}`);
      const data = await response.json() as { balance?: string; error?: string };
      if (data.balance) {
        const balance = data.balance;
        setState((s) => ({ ...s, balance }));
      } else {
        console.error("Balance fetch error:", data.error);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [state.address]);

  // Check if GemWallet is installed on mount
  useEffect(() => {
    const checkGemWallet = async () => {
      try {
        const response = await isInstalled();
        setState((s) => ({
          ...s,
          gemWalletInstalled: response.result.isInstalled,
        }));

        // Try to restore session
        const saved = localStorage.getItem("senq_wallet");
        if (saved && response.result.isInstalled) {
          const parsed = JSON.parse(saved);
          if (parsed.address) {
            // Verify the address is still valid with GemWallet
            const addrResponse = await getAddress();
            if (addrResponse.result?.address === parsed.address) {
              const netResponse = await getNetwork();
              setState((s) => ({
                ...s,
                connected: true,
                address: parsed.address,
                network: netResponse.result?.network || "Testnet",
              }));
            } else {
              localStorage.removeItem("senq_wallet");
            }
          }
        }
      } catch (err) {
        console.log("GemWallet not detected");
      }
    };

    checkGemWallet();
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
      // Check if installed
      const installedResponse = await isInstalled();
      if (!installedResponse.result.isInstalled) {
        throw new Error("GemWallet is not installed. Please install it from gemwallet.app");
      }

      // Get address
      const addressResponse = await getAddress();
      if (!addressResponse.result?.address) {
        throw new Error("Failed to get address from GemWallet");
      }

      const address = addressResponse.result.address;

      // Get network
      const networkResponse = await getNetwork();
      const network = networkResponse.result?.network || "Testnet";

      // Verify we're on testnet
      const networkStr = String(network).toLowerCase();
      if (!networkStr.includes("testnet") && !networkStr.includes("test")) {
        throw new Error(`Please switch GemWallet to Testnet. Current: ${network}`);
      }

      // Save to localStorage
      localStorage.setItem("senq_wallet", JSON.stringify({ address }));

      setState({
        connected: true,
        address,
        network,
        balance: null,
        loading: false,
        error: null,
        gemWalletInstalled: true,
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

      try {
        const response = await submitTransaction({
          transaction: tx as any,
        });

        if (response.result?.hash) {
          // Refresh balance after transaction
          setTimeout(() => refreshBalance(), 3000);
          return { hash: response.result.hash };
        }

        throw new Error("Transaction failed or was rejected");
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
