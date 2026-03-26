"use client"

import { useT } from "@/contexts/LanguageContext"

export function HeroSection() {
  const t = useT()

  return (
    <section className="py-16 text-center lg:py-24">
      <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {t.hero.headline1}
      </h2>
      <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {t.hero.headline2}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground lg:text-lg">
        {t.hero.description}
      </p>
    </section>
  )
}
