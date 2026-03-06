"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useWallet } from "@/contexts/WalletContext"
import { useUser } from "@/contexts/UserContext"
import {
  type Outcome,
  placeBet,
  confirmBet,
  formatEth,
  ethToWei,
  weiToEth,
} from "@/lib/api"

type BetPanelProps = {
  marketId: string
  selectedOutcome: Outcome | null
  onBetPlaced: () => void
}

// Quick-select amounts in ETH
const quickAmounts = [0.001, 0.01, 0.1, 1]

export function BetPanel({
  marketId,
  selectedOutcome,
  onBetPlaced,
}: BetPanelProps) {
  const wallet = useWallet()
  const user = useUser()

  const [amount, setAmount] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [betConfirmed, setBetConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = wallet.balance ? weiToEth(wallet.balance) : null
  const weightScore = user.weightScore

  const effectiveAmount = useMemo(
    () => Math.round(amount * weightScore * 1e6) / 1e6,
    [amount, weightScore]
  )

  // Only check balance if we have it loaded
  const insufficientBalance = balance !== null && amount > balance
  const isDisabled = !selectedOutcome || amount <= 0 || !wallet.connected
  const isNotConnected = !wallet.connected

  const handleAmountChange = (value: string) => {
    setInputValue(value)
    const parsed = parseFloat(value)
    setAmount(isNaN(parsed) ? 0 : parsed)
  }

  const handleQuickSelect = (value: number) => {
    setAmount(value)
    setInputValue(value.toString())
  }

  const handleSubmit = useCallback(async () => {
    if (isNotConnected) {
      wallet.connect()
      return
    }

    if (!selectedOutcome) {
      setError("選択肢を選んでください")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (amount <= 0) {
      setError("金額を入力してください")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (insufficientBalance) {
      setError("残高が不足しています")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!wallet.address) return

    setLoading(true)
    setError(null)

    try {
      const amountWei = ethToWei(amount)
      const result = await placeBet(
        marketId,
        selectedOutcome.id,
        amountWei,
        wallet.address,
      )

      // Submit EVM payment transaction via MetaMask
      const txResult = await wallet.signAndSubmitTransaction(result.unsignedTx)
      if (!txResult?.hash) {
        throw new Error("トランザクションが拒否されました")
      }

      // Confirm bet on server
      await confirmBet(marketId, result.bet.id, txResult.hash)

      setBetConfirmed(true)
      setAmount(0)
      setInputValue("")
      onBetPlaced()
      setTimeout(() => setBetConfirmed(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ベットに失敗しました")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }, [isNotConnected, selectedOutcome, amount, wallet, marketId, onBetPlaced, insufficientBalance])

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {/* Outcome Selection Display */}
      <div className="mb-5">
        <span className="text-xs text-muted-foreground">選択中</span>
        {selectedOutcome ? (
          <p className="mt-1 text-sm font-medium text-foreground">
            {selectedOutcome.label}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            選択肢をクリックしてください
          </p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        {/* Amount Input */}
        <label
          htmlFor="bet-amount"
          className="block text-xs font-medium text-foreground"
        >
          ベット金額 (ETH)
        </label>
        <input
          id="bet-amount"
          type="number"
          min={0}
          step={0.001}
          value={inputValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
        />

        {/* Quick select buttons */}
        <div className="mt-3 flex gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickSelect(q)}
              disabled={balance !== null && q > balance}
              className={cn(
                "flex-1 rounded border px-2 py-1.5 font-mono text-xs transition-colors",
                amount === q
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              {q} ETH
            </button>
          ))}
        </div>

        {wallet.connected && (
          <p className="mt-2 text-xs text-muted-foreground">
            利用可能:{" "}
            <span className="font-mono">
              {wallet.balance ? formatEth(wallet.balance) : "読み込み中..."}
            </span>
            {insufficientBalance && (
              <span className="ml-2 text-destructive">（残高不足）</span>
            )}
          </p>
        )}
      </div>

      {/* Weight Display */}
      <div className="mt-5 border-t border-border pt-5">
        <span className="text-xs font-medium text-foreground">
          あなたの重みスコア
        </span>
        <p className="mt-2 font-mono text-3xl font-bold text-foreground">
          {"×"}{weightScore.toFixed(1)}
        </p>

        {user.attributes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {user.attributes.map((attr) => (
              <span
                key={attr.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-secondary px-2.5 py-1 text-xs text-foreground"
              >
                {attr.label}
                <span className="font-mono text-muted-foreground">
                  {"×"}{attr.weight}
                </span>
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          属性がマーケットに関連する場合、予測の重みが増加します
        </p>
      </div>

      {/* Calculation Summary */}
      {amount > 0 && selectedOutcome && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ベット金額</span>
            <span className="font-mono text-foreground">
              {amount} ETH
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">重みスコア</span>
            <span className="font-mono text-foreground">
              {"×"}{weightScore.toFixed(1)}
            </span>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              実効ベット額
            </span>
            <span className="font-mono text-base font-bold text-foreground">
              {effectiveAmount} ETH
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={(isDisabled && !isNotConnected) || loading}
        className={cn(
          "mt-5 h-11 w-full rounded-md font-medium text-sm transition-all",
          loading
            ? "cursor-wait bg-muted text-muted-foreground"
            : betConfirmed
            ? "bg-emerald-600 text-white"
            : isNotConnected
            ? "bg-foreground text-background hover:opacity-90"
            : isDisabled
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
        )}
      >
        {loading
          ? "処理中..."
          : betConfirmed
          ? "予測が完了しました \u2713"
          : isNotConnected
          ? "ウォレット接続"
          : "予測する"}
      </button>
    </div>
  )
}
