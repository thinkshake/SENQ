"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/contexts/LanguageContext"

const categoryKeys = ["all", "politics", "economy", "local", "culture", "tech"] as const
const statusKeys = ["all", "open", "closed", "resolved"] as const

type FilterBarProps = {
  activeCategory: string
  activeStatus: string
  onCategoryChange: (category: string) => void
  onStatusChange: (status: string) => void
}

export function FilterBar({
  activeCategory,
  activeStatus,
  onCategoryChange,
  onStatusChange,
}: FilterBarProps) {
  const t = useT()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.filter.categoryFilter}>
        {categoryKeys.map((key) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              activeCategory === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground"
            )}
          >
            {t.filter.categories[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t.filter.statusFilter}>
        {statusKeys.map((key) => (
          <button
            key={key}
            onClick={() => onStatusChange(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              activeStatus === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {t.filter.statuses[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
