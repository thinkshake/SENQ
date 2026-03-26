"use client"

import { formatJpyc } from "@/lib/api"
import { useT, useLanguage } from "@/contexts/LanguageContext"
import { getDateLocale } from "@/lib/format"

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
  const t = useT()
  const { locale } = useLanguage()
  const dateLocale = getDateLocale(locale)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(dateLocale)
    } catch {
      return dateStr
    }
  }

  const rows = [
    { label: t.marketInfoBox.totalVolume, value: formatJpyc(totalPoolWei) },
    { label: t.marketInfoBox.participantsLabel, value: t.marketInfoBox.participants(participants) },
    { label: t.marketInfoBox.createdDate, value: formatDate(createdAt) },
    { label: t.marketInfoBox.endDate, value: formatDate(endDate) },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground">{t.marketInfoBox.title}</h3>

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
