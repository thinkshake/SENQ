"use client"

import { formatJpyc } from "@/lib/api"
import { useT } from "@/contexts/LanguageContext"

type Position = {
  outcomeLabel: string
  amountWei: string
  weightScore: number
  effectiveAmountWei: string
}

type PositionBoxProps = {
  positions: Position[]
}

export function PositionBox({ positions }: PositionBoxProps) {
  const t = useT()

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground">
        {t.positionBox.title}
      </h3>

      <div className="mt-4 flex flex-col gap-4">
        {positions.map((pos, i) => (
          <div
            key={i}
            className="border-t border-border pt-3 first:border-t-0 first:pt-0"
          >
            <p className="text-sm font-medium text-foreground">
              {pos.outcomeLabel}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.positionBox.betAmount}</span>
                <span className="font-mono text-foreground">
                  {formatJpyc(pos.amountWei)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.positionBox.weightScore}</span>
                <span className="font-mono text-foreground">
                  {"\u00d7"}{pos.weightScore.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.positionBox.effectiveBet}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatJpyc(pos.effectiveAmountWei)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
