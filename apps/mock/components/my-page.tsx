"use client"

import { useState, useCallback } from "react"
import { SiteHeader } from "@/components/site-header"
import { ProfileSection } from "@/components/profile-section"
import { AttributeManagement } from "@/components/attribute-management"
import { ActiveBets } from "@/components/active-bets"
import {
  type Attribute,
  initialUserData,
  calculateWeightScore,
  defaultWeights,
} from "@/lib/user-data"

export function MyPage() {
  const [balance, setBalance] = useState(initialUserData.balance)
  const [attributes, setAttributes] = useState<Attribute[]>(
    initialUserData.attributes
  )
  const [chargeFlash, setChargeFlash] = useState(false)

  const weightScore = calculateWeightScore(attributes)

  const handleCharge = useCallback(() => {
    setBalance((prev) => prev + 5000)
    setChargeFlash(true)
    setTimeout(() => setChargeFlash(false), 800)
  }, [])

  const handleDeleteAttribute = useCallback((id: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleAddAttribute = useCallback(
    (attr: Omit<Attribute, "id" | "verifiedAt">) => {
      const newAttr: Attribute = {
        ...attr,
        id: `attr-${Date.now()}`,
        verifiedAt: new Date().toISOString().split("T")[0],
        weight: defaultWeights[attr.type] ?? 1.0,
      }
      setAttributes((prev) => [...prev, newAttr])
    },
    []
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePage="マイページ" />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 lg:px-6">
        <ProfileSection
          displayName={initialUserData.displayName}
          walletAddress={initialUserData.walletAddress}
          balance={balance}
          weightScore={weightScore}
          onCharge={handleCharge}
          chargeFlash={chargeFlash}
        />

        <AttributeManagement
          attributes={attributes}
          onDelete={handleDeleteAttribute}
          onAdd={handleAddAttribute}
        />

        <ActiveBets bets={initialUserData.bets} />
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <span className="font-mono tracking-wide">SENQ</span>
        {" — "}
        予測マーケットプラットフォーム
      </footer>
    </div>
  )
}
