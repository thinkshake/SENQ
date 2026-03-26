"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useMarket } from "@/hooks/useMarkets"
import { useWallet } from "@/contexts/WalletContext"
import { useT } from "@/contexts/LanguageContext"
import { OutcomesList } from "@/components/outcomes-list"
import { BetPanel } from "@/components/bet-panel"
import { MarketInfoBox } from "@/components/market-info-box"
import { PositionBox } from "@/components/position-box"
import {
  getBetsForMarket,
  formatEth,
  type Bet,
} from "@/lib/api"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MarketDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { market, loading, error, refetch } = useMarket(id)
  const wallet = useWallet()
  const t = useT()

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)
  const [recentBets, setRecentBets] = useState<Bet[]>([])

  // Fetch recent bets
  const fetchBets = useCallback(() => {
    if (!id) return
    getBetsForMarket(id, 10)
      .then((data) => setRecentBets(data.bets))
      .catch(() => setRecentBets([]))
  }, [id])

  useEffect(() => {
    fetchBets()
  }, [fetchBets])

  const handleBetPlaced = useCallback(() => {
    refetch()
    fetchBets()
  }, [refetch, fetchBets])

  // Build user positions from recent bets
  const userPositions = recentBets
    .filter((bet) => bet.bettorAddress === wallet.address)
    .map((bet) => ({
      outcomeLabel: bet.outcomeLabel,
      amountWei: bet.amountWei,
      weightScore: bet.weightScore,
      effectiveAmountWei: bet.effectiveAmountWei,
    }))

  const selectedOutcome = market?.outcomes.find((o) => o.id === selectedOutcomeId) ?? null

  // Count unique bettors
  const uniqueBettors = new Set(recentBets.map((b) => b.bettorAddress)).size

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 lg:max-w-[60%]">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 lg:w-[38%]">
            <div className="h-64 animate-pulse rounded-lg border border-border bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:px-6">
        <h1 className="text-xl font-bold text-foreground">
          {error || t.marketDetail.notFound}
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t.marketDetail.backToList}
        </Link>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    Open: { label: t.marketDetail.statusOpen, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" },
    Closed: { label: t.marketDetail.statusClosed, className: "border-border bg-secondary text-muted-foreground" },
    Resolved: { label: t.marketDetail.statusResolved, className: "border-border bg-secondary text-muted-foreground" },
    Draft: { label: t.marketDetail.statusDraft, className: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400" },
  }

  const status = statusConfig[market.status] ?? { label: market.status, className: "border-border bg-secondary text-muted-foreground" }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 lg:px-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t.marketDetail.backToListShort}
      </Link>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Left Column */}
        <div className="min-w-0 flex-1 lg:max-w-[60%]">
          {/* Market Header */}
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              {market.categoryLabel || market.category}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}>
              {status.label}
            </span>
          </div>

          <h1 className="mt-4 text-balance text-2xl font-bold leading-relaxed text-foreground lg:text-3xl">
            {market.title}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {market.description}
          </p>

          {/* Outcomes Section */}
          <OutcomesList
            outcomes={market.outcomes}
            selectedOutcomeId={selectedOutcomeId}
            onSelect={setSelectedOutcomeId}
          />

          {/* Recent Bets */}
          {recentBets.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-medium text-foreground">{t.marketDetail.recentBets}</h3>
              <div className="mt-3 flex flex-col gap-2">
                {recentBets.slice(0, 5).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {bet.outcomeLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {bet.bettorAddress?.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="font-mono text-xs text-foreground">
                      {formatEth(bet.amountWei)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[38%]">
          {market.status === "Open" ? (
            <BetPanel
              marketId={id}
              selectedOutcome={selectedOutcome}
              onBetPlaced={handleBetPlaced}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {t.marketDetail.marketIs(status.label)}
              </p>
              {market.resolvedOutcomeId && (
                <p className="mt-2 text-base font-semibold text-foreground">
                  {t.marketDetail.result} {market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.label}
                </p>
              )}
            </div>
          )}

          <MarketInfoBox
            totalPoolWei={market.totalPoolWei}
            participants={uniqueBettors}
            createdAt={market.createdAt}
            endDate={market.bettingDeadline}
          />

          {userPositions.length > 0 && (
            <PositionBox positions={userPositions} />
          )}
        </div>
      </div>
    </div>
  )
}
