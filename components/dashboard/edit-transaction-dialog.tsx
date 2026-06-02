"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, User, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateTransaction, type TransactionType } from "@/app/actions/transactions"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import { CategoryCombobox } from "@/components/dashboard/category-combobox"
import { validateAmount } from "@/lib/utils"
import { useFormState } from "@/lib/hooks/use-form-state"
import { DateInput } from "@/components/ui/date-input"

export type Transaction = {
  id: string
  date?: string | null
  created_at?: string | null
  amount?: number | null
  description?: string | null
  type?: string | null
  status?: string | null
  category_id?: string | null
  scope?: string | null
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
  const [scope, setScope] = useState<"personal" | "family">("personal")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const { submitting, error, setError, wrap } = useFormState()

  useEffect(() => {
    if (open && transaction) {
      setType((transaction.type as TransactionType) ?? "expense")
      setScope(transaction.scope === "family" ? "family" : "personal")
      const dateValue = transaction.date ?? transaction.created_at ?? ""
      setDate(dateValue ? dateValue.split("T")[0] : "")
      setAmount(transaction.amount != null ? Math.abs(transaction.amount).toFixed(2).replace(".", ",") : "")
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

    if (!categoryId) {
      setError("La categoria è obbligatoria.")
      return
    }

    const amountResult = validateAmount(amount)
    if (!amountResult.ok) {
      setError(amountResult.error)
      return
    }
    const parsedAmount = amountResult.value

    if (!transaction?.id) return

    await wrap(async () => {
      const result = await updateTransaction(transaction.id, {
        type,
        scope,
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
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica transazione</DialogTitle>
        </DialogHeader>

        <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">
              Tipo <span className="text-expense-fg">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setType("income"); setCategoryId("") }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  type === "income"
                    ? "border-income bg-income-subtle text-income-fg"
                    : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Entrata
              </button>
              <button
                type="button"
                onClick={() => { setType("expense"); setCategoryId("") }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  type === "expense"
                    ? "border-expense bg-expense-subtle text-expense-fg"
                    : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Uscita
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">
              Visibilità
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope("personal")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  scope === "personal"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                }`}
              >
                <User className="h-4 w-4" />
                Personale
              </button>
              <button
                type="button"
                onClick={() => setScope("family")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  scope === "family"
                    ? "border-shared bg-shared-subtle text-shared"
                    : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                }`}
              >
                <Users className="h-4 w-4" />
                In comune
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="edit-date">
              Data <span className="text-expense-fg">*</span>
            </label>
            <DateInput
              id="edit-date"
              value={date}
              onChange={setDate}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="edit-amount">
              Importo <span className="text-expense-fg">*</span>
            </label>
            <Input
              id="edit-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="edit-description">
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

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">
              Categoria <span className="text-expense-fg">*</span>
            </label>
            <CategoryCombobox
              categories={categories}
              txType={type}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          {error && <p className="text-xs text-expense-fg">{error}</p>}

          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border-subtle bg-transparent text-text-1 hover:bg-white/5"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="bg-income text-zinc-950 hover:bg-income-fg"
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
