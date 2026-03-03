"use client"

import { useState, useTransition } from "react"
import { CheckCircle, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, parseItalianAmount } from "@/lib/utils"
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
  // weekly: show the specific date
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}

type PendingConfirmationsProps = {
  items: RecurringTransaction[]
}

function PendingItem({ item }: { item: RecurringTransaction }) {
  const [amount, setAmount] = useState(String(item.amount))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    const parsed = parseItalianAmount(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Importo non valido.")
      return
    }
    startTransition(async () => {
      const result = await confirmRecurringTransaction(item.id, parsed)
      if (!result.success) setError(result.error)
    })
  }

  function handleSkip() {
    setError(null)
    startTransition(async () => {
      const result = await skipRecurringConfirmation(item.id)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">
            {item.description || "Ricorrenza senza descrizione"}
          </p>
          <p className="text-xs text-zinc-400">
            {FREQUENCY_LABEL[item.frequency]} ·{" "}
            {item.type === "income" ? "Entrata prevista" : "Uscita prevista"}:{" "}
            {formatCurrency(Number(item.amount))}
          </p>
          <p className="text-xs text-amber-400/80">
            Competenza: {getPendingDate(item.next_due_date, item.frequency)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 border-white/15 bg-zinc-950 text-zinc-50 text-sm"
            disabled={isPending}
          />
          <Button
            size="sm"
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shrink-0"
            onClick={handleConfirm}
            disabled={isPending}
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Conferma
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 bg-transparent text-zinc-400 hover:text-zinc-50 shrink-0"
            onClick={handleSkip}
            disabled={isPending}
          >
            <SkipForward className="mr-1.5 h-3.5 w-3.5" />
            Salta
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </Card>
  )
}

export function PendingConfirmations({ items }: PendingConfirmationsProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-amber-400">
          {items.length === 1 ? "1 ricorrenza in attesa di conferma" : `${items.length} ricorrenze in attesa di conferma`}
        </h2>
      </div>
      {items.map((item) => (
        <PendingItem key={item.id} item={item} />
      ))}
    </div>
  )
}
