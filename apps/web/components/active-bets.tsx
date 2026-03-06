"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatEth, type UserBet } from "@/lib/api"

export function ActiveBets({ bets }: { bets: UserBet[] }) {
  if (bets.length === 0) {
    return (
      <section aria-label="アクティブな予測" className="mt-10">
        <h2 className="text-lg font-bold text-foreground">アクティブな予測</h2>
        <div className="mt-6 rounded-lg border border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            まだ予測を行っていません
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            マーケットを見る
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="アクティブな予測" className="mt-10">
      <h2 className="text-lg font-bold text-foreground">アクティブな予測</h2>

      <div className="mt-6 flex flex-col gap-4">
        {bets.map((bet) => (
          <Link
            key={bet.id}
            href={`/market/${bet.marketId}`}
            className="block rounded-lg border border-border p-5 transition-colors hover:border-foreground/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-pretty font-bold text-foreground">
                  {bet.marketTitle || bet.marketId}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  予測: {bet.outcomeLabel}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-xs",
                  bet.status === "open"
                    ? "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                    : "border-border text-muted-foreground"
                )}
              >
                {bet.status === "open" ? "オープン" : "クローズ"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">ベット額: </span>
                <span className="font-mono text-foreground">
                  {formatEth(bet.amountWei)}
                </span>
              </div>
              {bet.weightScore > 1 && (
                <div>
                  <span className="text-muted-foreground">重み: </span>
                  <span className="font-mono text-foreground">
                    {"\u00D7"}{bet.weightScore.toFixed(1)}
                  </span>
                </div>
              )}
              {bet.effectiveAmountWei && bet.effectiveAmountWei !== bet.amountWei && (
                <div>
                  <span className="text-muted-foreground">実効額: </span>
                  <span className="font-mono text-foreground">
                    {formatEth(bet.effectiveAmountWei)}
                  </span>
                </div>
              )}
            </div>

            {bet.currentProbability > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">現在の確率</span>
                  <span className="font-mono font-medium text-foreground">
                    {bet.currentProbability}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
                    style={{ width: `${bet.currentProbability}%` }}
                  />
                </div>
              </div>
            )}

            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {new Date(bet.createdAt).toLocaleDateString("ja-JP")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
