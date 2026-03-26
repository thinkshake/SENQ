"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Attribute } from "@/lib/api"
import { useT, useLanguage } from "@/contexts/LanguageContext"
import { getDateLocale } from "@/lib/format"

const typeKeys = ["region", "expertise", "experience"] as const

const defaultWeights: Record<string, number> = {
  region: 1.3,
  expertise: 1.0,
  experience: 0.8,
}

type AttributeManagementProps = {
  attributes: Attribute[]
  onDelete: (id: string) => void
  onAdd: (attr: { type: string; label: string; weight: number }) => void
}

export function AttributeManagement({
  attributes,
  onDelete,
  onAdd,
}: AttributeManagementProps) {
  const t = useT()
  const { locale } = useLanguage()
  const dateLocale = getDateLocale(locale)

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<string>("region")
  const [formLabel, setFormLabel] = useState("")

  const typeLabels: Record<string, string> = {
    region: t.attributeManagement.typeRegion,
    expertise: t.attributeManagement.typeExpertise,
    experience: t.attributeManagement.typeExperience,
  }

  const previewWeight = defaultWeights[formType] ?? 1.0

  function handleSubmit() {
    if (!formLabel.trim()) return
    onAdd({
      type: formType,
      label: formLabel.trim(),
      weight: previewWeight,
    })
    setFormLabel("")
    setFormType("region")
    setShowForm(false)
  }

  return (
    <section aria-label={t.attributeManagement.title} className="mt-10">
      <h2 className="text-lg font-bold text-foreground">{t.attributeManagement.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.attributeManagement.description}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className="flex items-center justify-between rounded-lg border border-border px-5 py-4"
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="inline-flex w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {attr.typeLabel}
              </span>
              <span className="text-sm font-medium text-foreground">
                {attr.label}
              </span>
              <span className="font-mono text-sm text-foreground">
                {"\u00D7"}{attr.weight.toFixed(1)}
              </span>
              {attr.verifiedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(attr.verifiedAt).toLocaleDateString(dateLocale)} {t.attributeManagement.verified}
                </span>
              )}
            </div>
            <button
              onClick={() => onDelete(attr.id)}
              className="shrink-0 text-xs text-destructive transition-opacity hover:opacity-70"
            >
              {t.attributeManagement.delete}
            </button>
          </div>
        ))}

        {attributes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t.attributeManagement.noAttributes}
          </p>
        )}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 rounded border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {t.attributeManagement.addAttribute}
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attr-type" className="text-xs text-muted-foreground">
                {t.attributeManagement.typeLabel}
              </label>
              <select
                id="attr-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
              >
                {typeKeys.map((key) => (
                  <option key={key} value={key}>
                    {typeLabels[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="attr-label" className="text-xs text-muted-foreground">
                {t.attributeManagement.labelLabel}
              </label>
              <input
                id="attr-label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={t.attributeManagement.labelPlaceholder}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">{t.attributeManagement.weightLabel}</span>
              <span className="rounded border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground">
                {"\u00D7"}{previewWeight.toFixed(1)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!formLabel.trim()}
                className={cn(
                  "rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity",
                  !formLabel.trim() ? "cursor-not-allowed opacity-40" : "hover:opacity-80"
                )}
              >
                {t.attributeManagement.add}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormLabel("")
                }}
                className="rounded border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.attributeManagement.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-muted/50 px-5 py-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.attributeManagement.weightExplanation}
        </p>
      </div>
    </section>
  )
}
