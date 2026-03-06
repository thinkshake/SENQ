"use client"

import { cn } from "@/lib/utils"
import { formatEth } from "@/lib/api"

type ProfileSectionProps = {
  walletAddress: string
  balance: string | null
  weightScore: number
  betCount: number
  totalBetWei: string
  totalEffectiveWei: string
  onDisconnect: () => void
}

export function ProfileSection({
  walletAddress,
  balance,
  weightScore,
  betCount,
  totalBetWei,
  totalEffectiveWei,
  onDisconnect,
}: ProfileSectionProps) {
  return (
    <section aria-label="プロフィール">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">マイページ</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
          </p>
        </div>
        <button
          onClick={onDisconnect}
          className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          切断
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">残高</p>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {balance ? formatEth(balance) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">総合重みスコア</p>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {"\u00D7"}{weightScore.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">ベット数</p>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {betCount}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">総賭け金</p>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {formatEth(totalBetWei)}
          </p>
        </div>
      </div>

      {totalEffectiveWei !== totalBetWei && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          実効総額: {formatEth(totalEffectiveWei)}
        </p>
      )}
    </section>
  )
}
