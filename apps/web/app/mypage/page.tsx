"use client"

import { useWallet } from "@/contexts/WalletContext"
import { useUser } from "@/contexts/UserContext"
import { ProfileSection } from "@/components/profile-section"
import { AttributeManagement } from "@/components/attribute-management"
import { ActiveBets } from "@/components/active-bets"

export default function MyPage() {
  const wallet = useWallet()
  const user = useUser()

  if (!wallet.connected) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:px-6">
        <h1 className="text-xl font-bold text-foreground">マイページ</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ウォレットを接続してポートフォリオを確認しましょう
        </p>
        <button
          onClick={wallet.connect}
          disabled={wallet.loading}
          className="mt-6 rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {wallet.loading ? "接続中..." : "ウォレット接続"}
        </button>
      </div>
    )
  }

  const bets = user.bets
  const totalBetWei = bets
    .reduce((sum, b) => sum + BigInt(b.amountWei), BigInt(0))
    .toString()
  const totalEffectiveWei = bets
    .reduce(
      (sum, b) => sum + BigInt(b.effectiveAmountWei || b.amountWei),
      BigInt(0),
    )
    .toString()

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 lg:px-6">
      {user.loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <ProfileSection
            walletAddress={wallet.address!}
            balance={wallet.balance}
            weightScore={user.weightScore}
            betCount={bets.length}
            totalBetWei={totalBetWei}
            totalEffectiveWei={totalEffectiveWei}
            onDisconnect={wallet.disconnect}
          />

          <AttributeManagement
            attributes={user.attributes}
            onDelete={user.deleteAttribute}
            onAdd={user.addAttribute}
          />

          <ActiveBets bets={bets} />

          {user.error && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
              {user.error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
