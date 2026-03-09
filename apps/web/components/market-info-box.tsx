import { formatEth } from "@/lib/api"

type MarketInfoBoxProps = {
  totalPoolWei: string
  participants: number
  createdAt: string
  endDate: string
}

export function MarketInfoBox({
  totalPoolWei,
  participants,
  createdAt,
  endDate,
}: MarketInfoBoxProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ja-JP")
    } catch {
      return dateStr
    }
  }

  const rows = [
    { label: "総取引量", value: formatEth(totalPoolWei) },
    { label: "参加者数", value: `${participants}人` },
    { label: "作成日", value: formatDate(createdAt) },
    { label: "終了日", value: formatDate(endDate) },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground">マーケット情報</h3>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
