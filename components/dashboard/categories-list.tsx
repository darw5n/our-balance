"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog"
import { deleteCategory, createDefaultCategories } from "@/app/actions/categories"
import type { Category } from "@/lib/supabase/queries/categories"
import type { BudgetWithProgress } from "@/lib/supabase/queries/budgets"
import { useToast } from "@/components/ui/toast-provider"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { formatAmount } from "@/lib/utils"

type CategoriesListProps = {
  categories: Category[]
  budgets?: BudgetWithProgress[]
}

export function CategoriesList({ categories: initialCategories, budgets = [] }: CategoriesListProps) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [categories, setCategories] = useState(initialCategories)
  const budgetMap = new Map(budgets.map((b) => [b.category_id, b]))

  // Sync when server re-fetches after mutation
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  function handleSuccess() {
    router.refresh()
    setFormOpen(false)
    setEditingCategory(null)
  }

  function openCreate() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    setFormOpen(true)
  }

  async function handleImportDefaults() {
    setImporting(true)
    setImportMsg(null)
    try {
      const result = await createDefaultCategories()
      if (result.success) {
        setImportMsg(
          result.created === 0
            ? "Tutte le categorie predefinite sono già presenti."
            : `${result.created} categorie aggiunte.`
        )
        if (result.created > 0) router.refresh()
      } else {
        setImportMsg(result.error ?? "Errore durante l'importazione.")
      }
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Errore imprevisto.")
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(cat: Category) {
    const ok = await confirm({
      title: "Elimina categoria",
      message: `Eliminare "${cat.name}"? Le transazioni collegate non verranno eliminate.`,
      destructive: true,
      confirmLabel: "Elimina",
    })
    if (!ok) return
    const result = await deleteCategory(cat.id)
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
      toast(`Categoria "${cat.name}" eliminata.`, "success")
      router.refresh()
    } else {
      toast(result.error ?? "Errore durante l'eliminazione.", "error")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">
            {categories.length} {categories.length === 1 ? "categoria" : "categorie"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportDefaults}
              disabled={importing}
              className="border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-400" />
              {importing ? "Importazione..." : "Importa predefinite"}
            </Button>
            <Button
              onClick={openCreate}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </div>
        </div>
        {importMsg && (
          <p className={`text-xs ${importMsg.includes("aggiunte") || importMsg.includes("presenti") ? "text-zinc-400" : "text-rose-400"}`}>
            {importMsg}
          </p>
        )}

        {categories.length === 0 ? (
          <Card className="border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur">
            <p className="text-sm text-zinc-400">Nessuna categoria. Creane una per organizzare le transazioni.</p>
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi categoria
            </Button>
          </Card>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Card className="border-white/10 bg-zinc-900/50 p-3 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-8 shrink-0 rounded-full border border-white/10"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate text-sm font-medium text-zinc-100">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
                        onClick={() => openEdit(cat)}
                        aria-label="Modifica"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-rose-400"
                        onClick={() => handleDelete(cat)}
                        aria-label="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {budgetMap.has(cat.id) && (() => {
                    const b = budgetMap.get(cat.id)!
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>Budget mensile</span>
                          <span className={b.is_exceeded ? "text-rose-400 font-medium" : ""}>
                            {formatAmount(b.spent, 0)} € / {formatAmount(b.amount_limit, 0)} €
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              b.is_exceeded ? "bg-rose-500" : b.percentage >= 80 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(b.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCategory(null)
        }}
        category={editingCategory}
        onSuccess={handleSuccess}
      />
    </>
  )
}
