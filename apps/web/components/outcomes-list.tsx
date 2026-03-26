"use client"

import { cn } from "@/lib/utils"
import { type Outcome, formatEth } from "@/lib/api"
import { useT } from "@/contexts/LanguageContext"

type OutcomesListProps = {
  outcomes: Outcome[]
  selectedOutcomeId: string | null
  onSelect: (id: string) => void
}

export function OutcomesList({
  outcomes,
  selectedOutcomeId,
  onSelect,
}: OutcomesListProps) {
  const t = useT()

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-foreground">
        {t.outcomesList.title}
      </h2>

      <div className="mt-4 flex flex-col gap-2">
        {outcomes.map((outcome) => {
          const isSelected = outcome.id === selectedOutcomeId

          return (
            <button
              key={outcome.id}
              onClick={() => onSelect(outcome.id)}
              className={cn(
                "w-full rounded-lg border px-4 py-3.5 text-left transition-all",
                isSelected
                  ? "border-l-[3px] border-l-foreground border-t-border border-r-border border-b-border bg-secondary/50"
                  : "border-border hover:border-foreground/20 hover:bg-secondary/30"
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {outcome.label}
                </span>
                <span className="ml-3 shrink-0 font-mono text-sm font-semibold text-foreground">
                  {outcome.probability}%
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-700 ease-out"
                  style={{ width: `${outcome.probability}%` }}
                />
              </div>

              <div className="mt-1.5 text-right">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatEth(outcome.totalAmountWei)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
