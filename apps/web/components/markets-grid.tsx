"use client"

import { useState } from "react"
import { FilterBar } from "@/components/filter-bar"
import { MarketCard } from "@/components/market-card"
import { useMarkets } from "@/hooks/useMarkets"
import { useT } from "@/contexts/LanguageContext"

export function MarketsGrid() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")
  const t = useT()

  const { markets, loading, error } = useMarkets({
    category: activeCategory === "all" ? undefined : activeCategory,
    status: activeStatus === "all" ? undefined : activeStatus,
  })

  return (
    <section>
      <FilterBar
        activeCategory={activeCategory}
        activeStatus={activeStatus}
        onCategoryChange={setActiveCategory}
        onStatusChange={setActiveStatus}
      />

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t.marketsGrid.loadError}</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t.marketsGrid.noMarkets}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </section>
  )
}
