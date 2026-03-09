import Link from "next/link"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "マーケット", href: "/" },
  { label: "マイページ", href: "/mypage" },
]

export function SiteHeader({ activePage = "マーケット" }: { activePage?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
          SENQ
        </Link>

        <nav className="flex gap-6" aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm transition-colors",
                activePage === item.label
                  ? "text-foreground underline underline-offset-[18px] decoration-foreground decoration-2"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-sm text-foreground sm:inline-block">
            ¥12,500 JPYC
          </span>
          <span className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">
            接続中
          </span>
        </div>
      </div>
    </header>
  )
}
