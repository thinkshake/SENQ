import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { MarketsGrid } from "@/components/markets-grid"

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
        <HeroSection />
        <MarketsGrid />
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <span className="font-mono tracking-wide">SENQ</span>
        {" — "}
        予測マーケットプラットフォーム
      </footer>
    </div>
  )
}
