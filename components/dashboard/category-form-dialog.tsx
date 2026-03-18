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

const MACRO_OPTIONS: { value: MacroCategory | null; label: string; className: string }[] = [
  { value: null, label: "Nessuna", className: "border-zinc-600 text-zinc-400 data-[active=true]:bg-zinc-700 data-[active=true]:text-zinc-100 data-[active=true]:border-zinc-500" },
  { value: "necessita", label: "Necessità", className: "border-amber-700/50 text-amber-400 data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-300 data-[active=true]:border-amber-500" },
  { value: "svago", label: "Svago", className: "border-violet-700/50 text-violet-400 data-[active=true]:bg-violet-500/20 data-[active=true]:text-violet-300 data-[active=true]:border-violet-500" },
  { value: "investimenti", label: "Investimenti", className: "border-blue-700/50 text-blue-400 data-[active=true]:bg-blue-500/20 data-[active=true]:text-blue-300 data-[active=true]:border-blue-500" },
]

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: { id: string; name: string; color: string; type?: string; macro_category?: MacroCategory | null; group_name?: string | null } | null
  onSuccess?: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#22c55e")
  const [type, setType] = useState<"expense" | "income">("expense")
  const [macroCategory, setMacroCategory] = useState<MacroCategory | null>(null)
  const [groupName, setGroupName] = useState("")
  const { submitting, error, setError, wrap } = useFormState()

  const isEdit = !!category?.id

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
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
      const input: CreateCategoryInput = { name: trimmed, color, type, macro_category: macroCategory, group_name: groupName.trim() || null }
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="cat-name">
              Nome
            </label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Alimentari"
              className="border-border-subtle bg-surface-0 text-text-1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="cat-group">
              Gruppo <span className="text-text-3">(opzionale)</span>
            </label>
            <Input
              id="cat-group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Es. Abitazione, Cibo, Trasporti…"
              className="border-border-subtle bg-surface-0 text-text-1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">Tipo</label>
            <div className="flex rounded-md border border-border-subtle overflow-hidden">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "expense"
                    ? "bg-expense-subtle text-expense-fg font-medium"
                    : "bg-transparent text-text-2 hover:bg-white/5"
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
                    : "bg-transparent text-text-2 hover:bg-white/5"
                }`}
              >
                Entrata
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-2">Colore</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-white ring-2 ring-white/30" : "border-white/20"
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
              className="mt-1 border-border-subtle bg-surface-0 font-mono text-text-1"
              placeholder="#22c55e"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-2">Macro-categoria <span className="text-text-3">(opzionale)</span></label>
            <div className="flex flex-wrap gap-2">
              {MACRO_OPTIONS.map((opt) => (
                <button
                  key={opt.value ?? "none"}
                  type="button"
                  data-active={macroCategory === opt.value}
                  onClick={() => setMacroCategory(opt.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${opt.className}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-expense-fg">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border-subtle bg-transparent text-text-1 hover:bg-white/5"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="bg-income text-zinc-950 hover:bg-income-fg"
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : isEdit ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
