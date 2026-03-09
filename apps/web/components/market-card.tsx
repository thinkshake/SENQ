import Link from "next/link"
import { cn } from "@/lib/utils"
import { type Market, formatEth, formatDeadline } from "@/lib/api"

function ProbabilityBar({ label, probability }: { label: string; probability: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="truncate text-sm text-foreground">{label}</span>
        <span className="ml-2 shrink-0 font-mono text-sm font-medium text-foreground">
          {probability}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${probability}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    open: { label: "オープン", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" },
    closed: { label: "クローズ", className: "border-border bg-secondary text-muted-foreground" },
    resolved: { label: "解決済み", className: "border-border bg-secondary text-muted-foreground" },
  }

  const { label, className } = config[status] ?? { label: status, className: "border-border bg-secondary text-muted-foreground" }

  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", className)}>
      {label}
    </span>
  )
}

export function MarketCard({ market }: { market: Market }) {
  const topOutcomes = [...market.outcomes]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 2)

  return (
    <Link href={`/market/${market.id}`}>
      <article
        className="group cursor-pointer rounded-lg border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-sm"
        aria-label={`マーケット: ${market.title}`}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {market.categoryLabel || market.category}
          </span>
          <StatusBadge status={market.status} />
        </div>

        <h3 className="mt-3 text-balance text-base font-bold leading-relaxed text-foreground">
          {market.title}
        </h3>

        <div className="mt-4 flex flex-col gap-3">
          {topOutcomes.map((outcome) => (
            <ProbabilityBar
              key={outcome.id}
              label={outcome.label}
              probability={outcome.probability}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            総取引量: <span className="font-mono">{formatEth(market.totalPoolWei)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDeadline(market.bettingDeadline)}
          </span>
        </div>
      </article>
    </Link>
  )
}
