import type { Locale } from "@/i18n/types"
import type { Translations } from "@/i18n/types"

export function formatDeadlineLocale(
  deadline: string,
  t: Translations["format"],
): string {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff <= 0) {
    return t.expired
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return t.daysHours(days, hours)
  }
  if (hours > 0) {
    return t.hours(hours)
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return t.minutes(minutes)
}

export function getDateLocale(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-US"
}
