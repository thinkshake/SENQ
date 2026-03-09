"use client"

import { useState, type FormEvent } from "react"

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      setError("パスワードを入力してください")
      return
    }
    setError("")
    onLogin()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-[0.2em] text-foreground">
            SENQ
          </span>
          <span className="text-sm text-muted-foreground">管理画面</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
          <h2 className="text-center text-base font-medium text-foreground">管理者ログイン</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-sm text-foreground">
              パスワード
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
              className={`h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground ${
                error ? "border-[#DC2626]" : "border-input"
              }`}
              placeholder="パスワードを入力"
              autoFocus
            />
            {error && (
              <p className="text-xs text-[#DC2626]">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="h-10 rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}
