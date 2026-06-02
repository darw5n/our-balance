"use client"

import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { confirmTransaction } from "@/app/actions/transactions"
import { validateAmount } from "@/lib/utils"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onSuccess: () => void
}

function todayISO() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`
}

export function ConfirmTransactionDialog({ open, onOpenChange, transaction, onSuccess }: Props) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [amountError, setAmountError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && transaction) {
      setAmount(transaction.amount != null ? String(Math.abs(transaction.amount)).replace(".", ",") : "")
      const txDate = transaction.date ?? todayISO()
      setDate(txDate.slice(0, 10))
      setAmountError("")
    }
  }, [open, transaction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transaction) return

    const validation = validateAmount(amount)
    if (!validation.ok) {
      setAmountError(validation.error)
      return
    }

    setLoading(true)
    try {
      const result = await confirmTransaction(transaction.id, validation.value, date)
      if (!result.success) {
        setAmountError(result.error ?? "Errore durante la conferma.")
        return
      }
      onOpenChange(false)
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  const isIncome = transaction.type === "income"
  const label = isIncome ? "Entrata" : "Uscita"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Conferma {label.toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-text-2">
          {transaction.description || label} — verifica importo e data prima di confermare.
        </p>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2">Importo</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError("") }}
                placeholder="0,00"
                className="pr-8"
                autoFocus
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-2">€</span>
            </div>
            {amountError && <p className="text-xs text-expense-fg">{amountError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2">Data effettiva</label>
            <DateInput value={date} onChange={setDate} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {loading ? "Salvataggio…" : "Conferma"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
