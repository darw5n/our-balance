"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCategory, updateCategory, type CreateCategoryInput } from "@/app/actions/categories"
import { useFormState } from "@/lib/hooks/use-form-state"
import type { MacroCategory } from "@/lib/supabase/queries/categories"

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#71717a", "#a3a3a3",
]

const MACRO_OPTIONS: { value: MacroCategory | null; label: string }[] = [
  { value: null, label: "Nessuna" },
  { value: "necessita", label: "Necessità" },
  { value: "svago", label: "Svago" },
  { value: "investimenti", label: "Investimenti" },
]

const MACRO_ACTIVE: Record<string, string> = {
  none:        "bg-surface-2 text-text-1 border-border-strong",
  necessita:   "bg-pending-subtle text-pending-fg border-pending/40",
  svago:       "bg-shared-subtle text-shared border-shared/40",
  investimenti:"bg-info-subtle text-info border-info/40",
}

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: {
    id: string
    name: string
    color: string
    emoji?: string | null
    type?: string
    macro_category?: MacroCategory | null
    group_name?: string | null
  } | null
  onSuccess?: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("")
  const [color, setColor] = useState("#22c55e")
  const [type, setType] = useState<"expense" | "income">("expense")
  const [macroCategory, setMacroCategory] = useState<MacroCategory | null>(null)
  const [groupName, setGroupName] = useState("")
  const { submitting, error, setError, wrap } = useFormState()

  const isEdit = !!category?.id

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setEmoji(category?.emoji ?? "")
      setColor(category?.color ?? "#22c55e")
      setType(category?.type === "income" ? "income" : "expense")
      setMacroCategory(category?.macro_category ?? null)
      setGroupName(category?.group_name ?? "")
      setError(null)
    }
  }, [open, category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Il nome è obbligatorio.")
      return
    }

    await wrap(async () => {
      const input: CreateCategoryInput = {
        name: trimmed,
        color,
        type,
        macro_category: macroCategory,
        group_name: groupName.trim() || null,
        emoji: emoji.trim() || null,
      }
      const result = isEdit
        ? await updateCategory(category.id, input)
        : await createCategory(input)

      if (!result.success) {
        setError(result.error)
        return
      }
      onOpenChange(false)
      onSuccess?.()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica categoria" : "Nuova categoria"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="cat-name">Nome</label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Alimentari"
            />
          </div>

          {/* Emoji */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="cat-emoji">
              Emoji <span className="text-text-3">(opzionale)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-xl">
                {emoji || "?"}
              </div>
              <Input
                id="cat-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.trim())}
                placeholder="🛒"
                maxLength={4}
              />
            </div>
            <p className="font-sans text-[10px] text-text-3">
              Incolla o digita un&apos;emoji — visibile nelle transazioni e nella dashboard
            </p>
          </div>

          {/* Gruppo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="cat-group">
              Gruppo <span className="text-text-3">(opzionale)</span>
            </label>
            <Input
              id="cat-group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Es. Abitazione, Cibo, Trasporti…"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">Tipo</label>
            <div className="flex overflow-hidden rounded-md border border-border-subtle">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "expense"
                    ? "bg-expense-subtle text-expense-fg font-medium"
                    : "bg-transparent text-text-2 hover:bg-surface-hover"
                }`}
              >
                Spesa
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "income"
                    ? "bg-income-subtle text-income-fg font-medium"
                    : "bg-transparent text-text-2 hover:bg-surface-hover"
                }`}
              >
                Entrata
              </button>
            </div>
          </div>

          {/* Colore */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-2">Colore</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-border-strong ring-2 ring-border-strong/30" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colore ${c}`}
                />
              ))}
            </div>
            <Input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="font-mono"
              placeholder="#22c55e"
            />
          </div>

          {/* Macro-categoria */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-2">
              Macro-categoria <span className="text-text-3">(opzionale)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MACRO_OPTIONS.map((opt) => {
                const isActive = macroCategory === opt.value
                const key = opt.value ?? "none"
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMacroCategory(opt.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? (MACRO_ACTIVE[key] ?? MACRO_ACTIVE.none)
                        : "border-border-subtle text-text-3 hover:bg-surface-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-xs text-expense-fg">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : isEdit ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
