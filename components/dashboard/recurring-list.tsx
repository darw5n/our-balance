"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RecurringFormDialog } from "@/components/dashboard/recurring-form-dialog"
import { deleteRecurringTransaction } from "@/app/actions/recurring"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"
import type { Category } from "@/lib/supabase/queries/categories"

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Settimanale",
  monthly: "Mensile",
  yearly: "Annuale",
}

type RecurringListProps = {
  recurring: RecurringTransaction[]
  categories: Category[]
}

export function RecurringList({ recurring: initialRecurring, categories }: RecurringListProps) {
  const router = useRouter()
  const [recurring, setRecurring] = useState(initialRecurring)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)

  useEffect(() => {
    setRecurring(initialRecurring)
  }, [initialRecurring])

  function handleSuccess() {
    router.refresh()
    setFormOpen(false)
    setEditingRecurring(null)
  }

  function openCreate() {
    setEditingRecurring(null)
    setFormOpen(true)
  }

  function openEdit(rec: RecurringTransaction) {
    setEditingRecurring(rec)
    setFormOpen(true)
  }

  async function handleDelete(rec: RecurringTransaction) {
    const label = rec.description || "questa ricorrenza"
    if (!confirm(`Eliminare "${label}"? Le transazioni già create non verranno rimosse.`)) return

    const result = await deleteRecurringTransaction(rec.id)
    if (result.success) {
      setRecurring((prev) => prev.filter((r) => r.id !== rec.id))
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
            {recurring.length} {recurring.length === 1 ? "ricorrenza attiva" : "ricorrenze attive"}
          </p>
          <Button
            onClick={openCreate}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi ricorrenza
          </Button>
        </div>

        {recurring.length === 0 ? (
          <Card className="border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Nessuna ricorrenza. Aggiungine una per automatizzare entrate e uscite periodiche.
            </p>
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi ricorrenza
            </Button>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recurring.map((rec) => (
              <li key={rec.id}>
                <Card className="flex items-center justify-between border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        rec.type === "income"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {rec.type === "income" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {rec.description || "Senza descrizione"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span
                          className={`text-sm font-semibold ${
                            rec.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {rec.type === "income" ? "+" : "-"}€{" "}
                          {Number(rec.amount).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                          {FREQUENCY_LABEL[rec.frequency]}
                        </span>
                        {rec.category && (
                          <span className="text-xs text-zinc-400">{rec.category.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Prossima scadenza:{" "}
                        {new Date(rec.next_due_date).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
                      onClick={() => openEdit(rec)}
                      aria-label="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-rose-400"
                      onClick={() => handleDelete(rec)}
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

      <RecurringFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingRecurring(null)
        }}
        recurring={editingRecurring}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </>
  )
}
