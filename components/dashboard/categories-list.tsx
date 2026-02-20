"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog"
import { deleteCategory, createDefaultCategories } from "@/app/actions/categories"
import type { Category } from "@/lib/supabase/queries/categories"

type CategoriesListProps = {
  categories: Category[]
}

export function CategoriesList({ categories: initialCategories }: CategoriesListProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)

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
    setImporting(false)
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Eliminare la categoria "${cat.name}"? Le transazioni collegate non verranno eliminate.`)) {
      return
    }
    const result = await deleteCategory(cat.id)
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
      router.refresh()
    } else {
      alert(result.error)
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
          <p className="text-xs text-zinc-400">{importMsg}</p>
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
                <Card className="flex items-center justify-between border-white/10 bg-zinc-900/50 p-3 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 shrink-0 rounded-full border border-white/10"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-zinc-100">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
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
