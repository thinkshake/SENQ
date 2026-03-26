"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import type { Locale } from "@/i18n/types"

const options: { value: Locale; label: string }[] = [
  { value: "ja", label: "JA" },
  { value: "en", label: "EN" },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex items-center gap-0.5 rounded border border-border text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={
            locale === opt.value
              ? "rounded px-2 py-1 bg-foreground text-background font-medium"
              : "rounded px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
