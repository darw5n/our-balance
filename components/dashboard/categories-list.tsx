"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, Tag } from "lucide-react"
import { getCategoryIcon, GROUP_ICONS } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog"
import { deleteCategory } from "@/app/actions/categories"
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

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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

  // Group by group_name
  const grouped = new Map<string, Category[]>()
  for (const cat of categories) {
    const key = cat.group_name?.trim() || "Altro"
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(cat)
  }
  const sortedGroups = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "Altro") return 1
    if (b === "Altro") return -1
    return a.localeCompare(b, "it")
  })

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-2">
            {categories.length} {categories.length === 1 ? "categoria" : "categorie"}
          </p>
          <Button
            onClick={openCreate}
            className="bg-income text-zinc-950 hover:bg-income-fg"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi categoria
          </Button>
        </div>

        {categories.length === 0 ? (
          <Card className="border-border-subtle bg-surface-1/50 p-8 text-center backdrop-blur">
            <p className="text-sm text-text-2">Nessuna categoria. Creane una per organizzare le transazioni.</p>
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-4 border-income/50 text-income-fg hover:bg-income-subtle"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi categoria
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map((groupName) => {
              const items = grouped.get(groupName)!
              const GroupIcon = GROUP_ICONS[groupName] ?? Tag
              return (
                <div key={groupName}>
                  <div className="mb-2 flex items-center gap-2">
                    <GroupIcon className="h-3.5 w-3.5 text-text-3" />
                    <span className="text-xs font-medium uppercase tracking-wider text-text-3">
                      {groupName}
                    </span>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {items.map((cat) => {
                      const Icon = getCategoryIcon(cat.name, cat.group_name)
                      const b = budgetMap.get(cat.id)
                      return (
                        <li key={cat.id}>
                          <Card
                            className="border-border-subtle p-3 backdrop-blur"
                            style={{ backgroundColor: `${cat.color}0d` }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                  style={{ backgroundColor: `${cat.color}28` }}
                                >
                                  <Icon className="h-4 w-4" style={{ color: cat.color }} />
                                </div>
                                <span className="truncate text-sm font-medium text-text-1">
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-text-2 hover:text-text-1"
                                  onClick={() => openEdit(cat)}
                                  aria-label="Modifica"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-text-2 hover:text-expense-fg"
                                  onClick={() => handleDelete(cat)}
                                  aria-label="Elimina"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {b && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-text-3">
                                  <span>Budget mensile</span>
                                  <span className={b.is_exceeded ? "text-expense-fg font-medium" : ""}>
                                    {formatAmount(b.spent, 0)} € / {formatAmount(b.amount_limit, 0)} €
                                  </span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      b.is_exceeded ? "bg-expense" : b.percentage >= 80 ? "bg-pending-fg" : "bg-income"
                                    }`}
                                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </Card>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
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
