"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useWallet } from "@/contexts/WalletContext"
import { formatEth } from "@/lib/api"

const navItems = [
  { label: "マーケット", href: "/" },
  { label: "マイページ", href: "/mypage" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const wallet = useWallet()

  const activePage =
    pathname === "/mypage"
      ? "マイページ"
      : "マーケット"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
          MITATE
        </Link>

        <nav className="flex gap-6" aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm transition-colors",
                activePage === item.label
                  ? "text-foreground underline underline-offset-[18px] decoration-foreground decoration-2"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {wallet.connected ? (
            <>
              <span className="hidden font-mono text-sm text-foreground sm:inline-block">
                {wallet.balance ? formatEth(wallet.balance) : "..."}
              </span>
              <button
                onClick={wallet.disconnect}
                className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                title={wallet.address || ""}
              >
                {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "接続中"}
              </button>
            </>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.loading}
              className={cn(
                "rounded border px-3 py-1.5 text-xs transition-colors",
                wallet.loading
                  ? "border-border text-muted-foreground cursor-wait"
                  : !wallet.metaMaskInstalled
                  ? "border-border text-muted-foreground"
                  : "border-foreground bg-foreground text-background hover:opacity-90"
              )}
            >
              {wallet.loading
                ? "接続中..."
                : !wallet.metaMaskInstalled
                ? "MetaMaskをインストール"
                : "ウォレット接続"}
            </button>
          )}
        </div>
      </div>

      {wallet.error && (
        <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
          {wallet.error}
        </div>
      )}
    </header>
  )
}
