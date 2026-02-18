"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BudgetFormDialog, type CategoryOption } from "@/components/dashboard/budget-form-dialog"
import { deleteBudget } from "@/app/actions/budgets"
import type { BudgetWithProgress } from "@/lib/supabase/queries/budgets"

type BudgetsListProps = {
  budgets: BudgetWithProgress[]
  categoriesWithoutBudget: CategoryOption[]
}

function progressBarColor(percentage: number, is_exceeded: boolean): string {
  if (is_exceeded || percentage >= 100) return "bg-rose-500"
  if (percentage >= 80) return "bg-amber-400"
  return "bg-emerald-500"
}

export function BudgetsList({
  budgets: initialBudgets,
  categoriesWithoutBudget: initialCategoriesWithoutBudget,
}: BudgetsListProps) {
  const router = useRouter()
  const [budgets, setBudgets] = useState(initialBudgets)
  const [categoriesWithoutBudget, setCategoriesWithoutBudget] = useState(initialCategoriesWithoutBudget)

  useEffect(() => {
    setBudgets(initialBudgets)
    setCategoriesWithoutBudget(initialCategoriesWithoutBudget)
  }, [initialBudgets, initialCategoriesWithoutBudget])

  const [formOpen, setFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null)

  function handleSuccess() {
    router.refresh()
    setFormOpen(false)
    setEditingBudget(null)
  }

  function openCreate() {
    setEditingBudget(null)
    setFormOpen(true)
  }

  function openEdit(budget: BudgetWithProgress) {
    setEditingBudget(budget)
    setFormOpen(true)
  }

  async function handleDelete(budget: BudgetWithProgress) {
    if (!confirm(`Eliminare il budget per "${budget.category_name}"?`)) return
    const result = await deleteBudget(budget.id)
    if (result.success) {
      setBudgets((prev) => prev.filter((b) => b.id !== budget.id))
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const canAddMore = categoriesWithoutBudget.length > 0

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">
            {budgets.length} {budgets.length === 1 ? "budget" : "budget"} impostati
          </p>
          {canAddMore && (
            <Button
              onClick={openCreate}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi budget
            </Button>
          )}
        </div>

        {budgets.length === 0 ? (
          <Card className="border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur">
            <p className="text-sm text-zinc-400">
              Nessun budget impostato. Aggiungi un limite mensile per le tue categorie.
            </p>
            {canAddMore && (
              <Button
                onClick={openCreate}
                variant="outline"
                className="mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi budget
              </Button>
            )}
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {budgets.map((budget) => (
              <li key={budget.id}>
                <Card className="border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: budget.category_color }}
                      />
                      <span className="truncate text-sm font-medium text-zinc-100">
                        {budget.category_name}
                      </span>
                      {budget.is_exceeded && (
                        <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-400">
                          Superato!
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-50"
                        onClick={() => openEdit(budget)}
                        aria-label="Modifica"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                        onClick={() => handleDelete(budget)}
                        aria-label="Elimina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${progressBarColor(budget.percentage, budget.is_exceeded)}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        € {budget.spent.toFixed(2)} spesi
                      </span>
                      <span className="text-xs text-zinc-500">
                        limite € {budget.amount_limit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingBudget(null)
        }}
        budget={editingBudget}
        categories={editingBudget ? [] : categoriesWithoutBudget}
        onSuccess={handleSuccess}
      />
    </>
  )
}
