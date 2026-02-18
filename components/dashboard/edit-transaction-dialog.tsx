"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateTransaction, type TransactionType } from "@/app/actions/transactions"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

export type Transaction = {
  id: string
  date?: string | null
  created_at?: string | null
  amount?: number | null
  description?: string | null
  type?: string | null
  status?: string | null
  category_id?: string | null
}

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  categories: CategoryOption[]
  onSuccess?: () => void
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  onSuccess,
}: EditTransactionDialogProps) {
  const [type, setType] = useState<TransactionType>("expense")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && transaction) {
      setType((transaction.type as TransactionType) ?? "expense")
      const dateValue = transaction.date ?? transaction.created_at ?? ""
      setDate(dateValue ? dateValue.split("T")[0] : "")
      setAmount(transaction.amount != null ? String(Math.abs(transaction.amount)) : "")
      setCategoryId(transaction.category_id ?? "")
      setDescription(transaction.description ?? "")
      setError(null)
    }
  }, [open, transaction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!date || !amount) {
      setError("Data e importo sono obbligatori.")
      return
    }

    const parsedAmount = parseFloat(amount.replace(",", "."))
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setError("Importo non valido.")
      return
    }

    if (!transaction?.id) return

    setSubmitting(true)
    try {
      const result = await updateTransaction(transaction.id, {
        type,
        date,
        amount: parsedAmount,
        category_id: categoryId || null,
        description: description || null,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica transazione</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">
              Tipo <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  type === "income"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Entrata
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  type === "expense"
                    ? "border-rose-500 bg-rose-500/20 text-rose-400"
                    : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Uscita
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="edit-date">
              Data <span className="text-rose-400">*</span>
            </label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="edit-amount">
              Importo <span className="text-rose-400">*</span>
            </label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="edit-category">
              Categoria
            </label>
            <select
              id="edit-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <option value="">Nessuna categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="edit-description">
              Descrizione
            </label>
            <Input
              id="edit-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Es. Spesa supermercato"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-zinc-50 hover:bg-white/5"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
