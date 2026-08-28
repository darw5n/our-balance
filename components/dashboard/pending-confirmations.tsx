"use client"

import { useState, useTransition } from "react"
import { CheckCircle, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, validateAmount } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { confirmRecurringTransaction, skipRecurringConfirmation } from "@/app/actions/recurring"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Settimanale",
  monthly: "Mensile",
  yearly: "Annuale",
}

function getPendingDate(nextDueDate: string, frequency: string): string {
  const date = new Date(nextDueDate + "T00:00:00Z")
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() - 7)
  else if (frequency === "monthly") date.setUTCMonth(date.getUTCMonth() - 1)
  else date.setUTCFullYear(date.getUTCFullYear() - 1)

  if (frequency === "monthly") {
    return date.toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" })
  }
  if (frequency === "yearly") {
    return String(date.getUTCFullYear())
  }
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}

function PendingItem({ item }: { item: RecurringTransaction }) {
  const [amount, setAmount] = useState(() => String(item.amount).replace(".", ","))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    const result = validateAmount(amount)
    if (!result.ok) {
      setError(result.error)
      return
    }
    startTransition(async () => {
      const res = await confirmRecurringTransaction(item.id, result.value)
      if (!res.success) setError(res.error)
    })
  }

  function handleSkip() {
    setError(null)
    startTransition(async () => {
      const result = await skipRecurringConfirmation(item.id)
      if (!result.success) setError(result.error)
    })
  }

  const typeLabel = item.type === "income" ? "Entrata" : "Uscita"
  const periodLabel = getPendingDate(item.next_due_date, item.frequency)

  return (
    <Card className="border-pending/30 bg-pending-subtle">
      <div className="p-3">
        {/* Name + period */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="font-sans text-sm font-semibold text-text-1 leading-tight">
            {item.description || "Ricorrenza senza descrizione"}
          </p>
          <span className="font-sans text-[11px] text-pending-fg/70 flex-shrink-0 mt-0.5">
            {periodLabel}
          </span>
        </div>
        {/* Subtitle */}
        <p className="font-sans text-xs text-text-2 mb-3">
          {FREQUENCY_LABEL[item.frequency] ?? item.frequency} · {typeLabel} prevista {formatCurrency(Number(item.amount))}
        </p>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-20 flex-shrink-0 border-border-subtle bg-surface-0 text-sm text-text-1"
            disabled={isPending}
            aria-label="Importo"
          />
          <Button
            size="sm"
            className="min-w-0 flex-1 bg-income text-white hover:bg-income-fg"
            onClick={handleConfirm}
            disabled={isPending}
          >
            <CheckCircle className="mr-1.5 hidden h-3.5 w-3.5 flex-shrink-0 sm:inline-block" />
            Conferma
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-w-0 flex-1 border-border-subtle bg-transparent text-text-2 hover:text-text-1"
            onClick={handleSkip}
            disabled={isPending}
          >
            <SkipForward className="mr-1.5 hidden h-3.5 w-3.5 flex-shrink-0 sm:inline-block" />
            Salta
          </Button>
        </div>
      </div>
      {error && <p className="px-3 pb-3 font-sans text-xs text-expense-fg">{error}</p>}
    </Card>
  )
}

export function PendingConfirmations({ items }: { items: RecurringTransaction[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="font-sans text-sm font-medium text-pending-fg">
        {items.length === 1 ? "1 ricorrenza in attesa di conferma" : `${items.length} ricorrenze in attesa di conferma`}
      </p>
      {items.map((item) => (
        <PendingItem key={item.id} item={item} />
      ))}
    </div>
  )
}
