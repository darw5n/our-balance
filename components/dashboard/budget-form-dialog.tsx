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
import { upsertBudget } from "@/app/actions/budgets"
import { validateAmount } from "@/lib/utils"
import { useFormState } from "@/lib/hooks/use-form-state"
import type { BudgetWithProgress } from "@/lib/supabase/queries/budgets"
import type { Category } from "@/lib/supabase/queries/categories"

export type CategoryOption = Pick<Category, "id" | "name" | "color">

type BudgetFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: BudgetWithProgress | null
  categories: CategoryOption[]
  onSuccess?: () => void
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  categories,
  onSuccess,
}: BudgetFormDialogProps) {
  const [categoryId, setCategoryId] = useState("")
  const [amountLimit, setAmountLimit] = useState("")
  const { submitting, error, setError, wrap } = useFormState()

  const isEdit = !!budget?.id

  useEffect(() => {
    if (open) {
      setCategoryId(budget?.category_id ?? (categories[0]?.id ?? ""))
      setAmountLimit(budget?.amount_limit ? Number(budget.amount_limit).toFixed(2).replace(".", ",") : "")
      setError(null)
    }
  }, [open, budget, categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amountResult = validateAmount(amountLimit)
    if (!amountResult.ok) {
      setError(amountResult.error)
      return
    }
    if (!categoryId) {
      setError("Seleziona una categoria.")
      return
    }

    await wrap(async () => {
      const result = await upsertBudget({ category_id: categoryId, amount_limit: amountResult.value })
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
          <DialogTitle>{isEdit ? "Modifica budget" : "Nuovo budget"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="budget-category">
              Categoria
            </label>
            {isEdit ? (
              <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-0 px-3 py-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: budget?.category_color }}
                />
                <span className="text-sm text-text-1">{budget?.category_name}</span>
              </div>
            ) : (
              <select
                id="budget-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-border-subtle bg-surface-0 px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="budget-amount">
              Limite mensile (€)
            </label>
            <Input
              id="budget-amount"
              type="text"
              inputMode="decimal"
              value={amountLimit}
              onChange={(e) => setAmountLimit(e.target.value)}
              placeholder="Es. 300"
              className="border-border-subtle bg-surface-0 text-text-1"
            />
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
