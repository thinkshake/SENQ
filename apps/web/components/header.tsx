"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/WalletContext";
import { formatEth } from "@/lib/api";

export function Header() {
  const wallet = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl">SENQ</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/markets"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              マーケット
            </Link>
            <Link
              href="/portfolio"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              マイページ
            </Link>
            <Link
              href="/activity"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              アクティビティ
            </Link>
            <Link
              href="/learn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              使い方
            </Link>
          </nav>

          {/* Wallet Button */}
          {wallet.connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{formatAddress(wallet.address || "")}</span>
                  {wallet.balance && (
                    <span className="text-xs text-muted-foreground">
                      {formatEth(wallet.balance)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  MetaMask • Chain {wallet.network}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portfolio">マイページ</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={wallet.disconnect}
                  className="text-destructive"
                >
                  切断
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={wallet.connect}
              disabled={wallet.loading}
            >
              {wallet.loading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  接続中...
                </>
              ) : !wallet.metaMaskInstalled ? (
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  MetaMaskをインストール
                </a>
              ) : (
                "ウォレット接続"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {wallet.error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive">
          {wallet.error}
        </div>
      )}

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              href="/markets"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              マーケット
            </Link>
            <Link
              href="/portfolio"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              マイページ
            </Link>
            <Link
              href="/activity"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              履歴
            </Link>
            <Link
              href="/learn"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              使い方
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
