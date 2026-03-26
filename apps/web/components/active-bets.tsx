"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatJpyc, type UserBet } from "@/lib/api"
import { useT, useLanguage } from "@/contexts/LanguageContext"
import { getDateLocale } from "@/lib/format"

export function ActiveBets({ bets }: { bets: UserBet[] }) {
  const t = useT()
  const { locale } = useLanguage()
  const dateLocale = getDateLocale(locale)

  if (bets.length === 0) {
    return (
      <section aria-label={t.activeBets.title} className="mt-10">
        <h2 className="text-lg font-bold text-foreground">{t.activeBets.title}</h2>
        <div className="mt-6 rounded-lg border border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t.activeBets.noBets}
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {t.activeBets.viewMarkets}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section aria-label={t.activeBets.title} className="mt-10">
      <h2 className="text-lg font-bold text-foreground">{t.activeBets.title}</h2>

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
                  {t.activeBets.prediction} {bet.outcomeLabel}
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
                {bet.status === "open" ? t.activeBets.statusOpen : t.activeBets.statusClosed}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t.activeBets.betAmount} </span>
                <span className="font-mono text-foreground">
                  {formatJpyc(bet.amountWei)}
                </span>
              </div>
              {bet.weightScore > 1 && (
                <div>
                  <span className="text-muted-foreground">{t.activeBets.weight} </span>
                  <span className="font-mono text-foreground">
                    {"\u00D7"}{bet.weightScore.toFixed(1)}
                  </span>
                </div>
              )}
              {bet.effectiveAmountWei && bet.effectiveAmountWei !== bet.amountWei && (
                <div>
                  <span className="text-muted-foreground">{t.activeBets.effectiveAmount} </span>
                  <span className="font-mono text-foreground">
                    {formatJpyc(bet.effectiveAmountWei)}
                  </span>
                </div>
              )}
            </div>

            {bet.currentProbability > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.activeBets.currentProbability}</span>
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
              {new Date(bet.createdAt).toLocaleDateString(dateLocale)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
