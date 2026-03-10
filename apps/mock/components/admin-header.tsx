"use client"

export function AdminHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
            SENQ
          </span>
          <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
            管理画面
          </span>
        </div>

        <button
          onClick={onLogout}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}
