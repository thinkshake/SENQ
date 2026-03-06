import { formatEth } from "@/lib/api"

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
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground">
        あなたのポジション
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
                <span className="text-muted-foreground">ベット額</span>
                <span className="font-mono text-foreground">
                  {formatEth(pos.amountWei)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">重みスコア</span>
                <span className="font-mono text-foreground">
                  {"×"}{pos.weightScore.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">実効ベット額</span>
                <span className="font-mono font-medium text-foreground">
                  {formatEth(pos.effectiveAmountWei)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
