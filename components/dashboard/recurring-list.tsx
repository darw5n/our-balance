"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, RefreshCw, Pause, Play } from "lucide-react"
import { getCategoryIcon } from "@/lib/category-icons"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RecurringFormDialog } from "@/components/dashboard/recurring-form-dialog"
import {
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
} from "@/app/actions/recurring"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"
import type { Category } from "@/lib/supabase/queries/categories"
import { useToast } from "@/components/ui/toast-provider"
import { useConfirm } from "@/components/ui/confirm-dialog"

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Settimanale",
  monthly: "Mensile",
  yearly: "Annuale",
}

const STATUS_ORDER: Record<string, number> = { active: 0, paused: 1, ended: 2 }

type RecurringListProps = {
  recurring: RecurringTransaction[]
  categories: Category[]
}

export function RecurringList({ recurring: initialRecurring, categories }: RecurringListProps) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [recurring, setRecurring] = useState(initialRecurring)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  useEffect(() => {
    setRecurring(initialRecurring)
  }, [initialRecurring])

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)),
    [recurring]
  )
  const activeCount = recurring.filter((r) => r.status === "active").length
  const pausedCount = recurring.filter((r) => r.status === "paused").length
  const endedCount = recurring.filter((r) => r.status === "ended").length

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
    const ok = await confirm({
      title: "Elimina ricorrenza",
      message: `Eliminare "${label}"? Le transazioni già create non verranno rimosse.`,
      destructive: true,
      confirmLabel: "Elimina",
    })
    if (!ok) return

    const result = await deleteRecurringTransaction(rec.id)
    if (result.success) {
      setRecurring((prev) => prev.filter((r) => r.id !== rec.id))
      toast(`"${label}" eliminata.`, "success")
      router.refresh()
    } else {
      toast(result.error ?? "Errore durante l'eliminazione.", "error")
    }
  }

  async function handlePause(rec: RecurringTransaction) {
    const result = await pauseRecurringTransaction(rec.id)
    if (result.success) {
      setRecurring((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: "paused" } : r)))
      toast("Ricorrenza in pausa.", "success")
      router.refresh()
    } else {
      toast(result.error ?? "Errore.", "error")
    }
  }

  async function handleResume(rec: RecurringTransaction) {
    const result = await resumeRecurringTransaction(rec.id)
    if (result.success) {
      setRecurring((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: "active" } : r)))
      toast("Ricorrenza riattivata.", "success")
      router.refresh()
    } else {
      toast(result.error ?? "Errore.", "error")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-2">
            {activeCount} {activeCount === 1 ? "ricorrenza attiva" : "ricorrenze attive"}
            {pausedCount > 0 && ` · ${pausedCount} in pausa`}
            {endedCount > 0 && ` · ${endedCount} conclus${endedCount === 1 ? "a" : "e"}`}
          </p>
          <Button
            onClick={openCreate}
            className="bg-income text-white hover:bg-income-fg"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi ricorrenza
          </Button>
        </div>

        {recurring.length === 0 ? (
          <Card className="border-border-subtle bg-surface-1/50 p-8 text-center backdrop-blur">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 text-text-3" />
            <p className="text-sm text-text-2">
              Nessuna ricorrenza. Aggiungine una per automatizzare entrate e uscite periodiche.
            </p>
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-4 border-income/50 text-income-fg hover:bg-income-subtle"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi ricorrenza
            </Button>
          </Card>
        ) : (
          <ul className="space-y-2">
            {sorted.map((rec) => {
              const isPaused = rec.status === "paused"
              const isEnded = rec.status === "ended"
              const dimmed = isPaused || isEnded
              return (
              <li key={rec.id}>
                <Card className={`flex items-center justify-between gap-2 border-border-subtle bg-surface-1/50 p-4 backdrop-blur ${dimmed ? "opacity-60" : ""}`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {(() => {
                      const cat = rec.category_id ? catMap.get(rec.category_id) : undefined
                      const hasEmoji = !!cat?.emoji
                      const CatIcon = getCategoryIcon(cat?.name ?? "", cat?.group_name)
                      return (
                        <div className="w-11 h-11 rounded-[14px] bg-surface-2 flex items-center justify-center text-[19px] flex-shrink-0">
                          {hasEmoji ? cat!.emoji : <CatIcon className="h-5 w-5 text-text-3" />}
                        </div>
                      )
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm font-medium text-text-1 truncate">
                        {rec.description || "Senza descrizione"}
                        {isPaused && <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-3">In pausa</span>}
                        {isEnded && <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-3">Conclusa</span>}
                      </p>
                      <p className="font-sans text-[11px] text-text-3 truncate">
                        <span className={`font-semibold ${rec.type === "income" ? "text-income-fg" : "text-accent-brand"}`}>
                          {rec.type === "income" ? "+" : "-"}{formatCurrency(Number(rec.amount))}
                        </span>
                        {" · "}
                        {FREQUENCY_LABEL[rec.frequency]}
                        {isEnded
                          ? rec.end_date ? ` · conclusa il ${formatDate(rec.end_date)}` : ""
                          : rec.next_due_date ? ` · ${formatDate(rec.next_due_date)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {isPaused ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-2 hover:text-income-fg"
                        onClick={() => handleResume(rec)}
                        aria-label="Riprendi"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : !isEnded ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-2 hover:text-text-1"
                        onClick={() => handlePause(rec)}
                        aria-label="Metti in pausa"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-2 hover:text-text-1"
                      onClick={() => openEdit(rec)}
                      aria-label="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-2 hover:text-expense-fg"
                      onClick={() => handleDelete(rec)}
                      aria-label="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </li>
              )
            })}
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
