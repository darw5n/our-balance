"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { confirmTransaction } from "@/app/actions/transactions"
import { validateAmount } from "@/lib/utils"
import { useFormState } from "@/lib/hooks/use-form-state"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onSuccess?: () => void
}

function todayISO() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`
}

export function ConfirmTransactionDialog({ open, onOpenChange, ...formProps }: Props) {
  // DialogContent si smonta alla chiusura: il form riparte dai valori della transazione a ogni apertura.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ConfirmTransactionForm onClose={() => onOpenChange(false)} {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

type ConfirmTransactionFormProps = Omit<Props, "open" | "onOpenChange"> & {
  onClose: () => void
}

function ConfirmTransactionForm({ transaction: transactionProp, onSuccess, onClose }: ConfirmTransactionFormProps) {
  // Copia della transazione all'apertura: alla chiusura il genitore la azzera, e il form
  // non deve sparire durante l'animazione di uscita.
  const [transaction] = useState(transactionProp)
  const [amount, setAmount] = useState(
    transaction?.amount != null ? String(Math.abs(transaction.amount)).replace(".", ",") : ""
  )
  const [date, setDate] = useState(() => (transaction?.date ?? todayISO()).slice(0, 10))
  const [amountError, setAmountError] = useState("")
  const { submitting, error: formError, setError: setFormError, wrap } = useFormState()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transaction) return
    setFormError(null)

    const validation = validateAmount(amount)
    if (!validation.ok) {
      setAmountError(validation.error)
      return
    }

    await wrap(async () => {
      const result = await confirmTransaction(transaction.id, validation.value, date)
      if (!result.success) {
        setFormError(result.error ?? "Errore durante la conferma.")
        return
      }
      onClose()
      onSuccess?.()
    })
  }

  if (!transaction) return null

  const isIncome = transaction.type === "income"
  const label = isIncome ? "Entrata" : "Uscita"

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-4 w-4 text-income-fg" />
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
              type="text"
              inputMode="decimal"
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

        {formError && <p className="text-xs text-expense-fg">{formError}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" size="sm" disabled={submitting} className="bg-income text-white hover:bg-income-fg">
            {submitting ? "Salvataggio…" : "Conferma"}
          </Button>
        </div>
      </form>
    </>
  )
}
