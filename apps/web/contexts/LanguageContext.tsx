"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Locale, Translations } from "@/i18n/types"
import { ja } from "@/i18n/ja"
import { en } from "@/i18n/en"

const STORAGE_KEY = "senq-locale"
const DEFAULT_LOCALE: Locale = "ja"

const translations: Record<Locale, Translations> = { ja, en }

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | null>(null)

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "ja" || stored === "en") return stored
  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLocaleState(getInitialLocale())
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  // Sync <html lang> and document.title
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = translations[locale].siteTitle
  }, [locale])

  const value: LanguageContextType = {
    locale,
    setLocale,
    t: translations[locale],
  }

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export function useT(): Translations {
  return useLanguage().t
}
