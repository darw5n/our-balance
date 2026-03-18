"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, User, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  type CreateRecurringInput,
  type RecurringFrequency,
} from "@/app/actions/recurring"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"
import type { Category } from "@/lib/supabase/queries/categories"
import { CategoryCombobox } from "@/components/dashboard/category-combobox"
import { validateAmount } from "@/lib/utils"
import { useFormState } from "@/lib/hooks/use-form-state"

type RecurringFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recurring?: RecurringTransaction | null
  categories: Category[]
  onSuccess?: () => void
}

const DELAY_OPTIONS: { value: number; label: string; hint: string }[] = [
  { value: 0, label: "Immediato", hint: "Si conferma nel mese di competenza" },
  { value: 1, label: "+1 ciclo", hint: "Es. bolletta gen → conferma feb" },
  { value: 2, label: "+2 cicli", hint: "Es. bolletta gen → conferma mar" },
]

export function RecurringFormDialog({
  open,
  onOpenChange,
  recurring,
  categories,
  onSuccess,
}: RecurringFormDialogProps) {
  const [type, setType] = useState<"income" | "expense">("expense")
  const [scope, setScope] = useState<"personal" | "family">("personal")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly")
  const [startDate, setStartDate] = useState("")
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)
  const [confirmationDelay, setConfirmationDelay] = useState(0)
  const { submitting, error, setError, wrap } = useFormState()

  const isEdit = !!recurring?.id

  useEffect(() => {
    if (open) {
      setType(recurring?.type ?? "expense")
      setScope(recurring?.scope ?? "personal")
      setAmount(recurring ? Number(recurring.amount).toFixed(2).replace(".", ",") : "")
      setDescription(recurring?.description ?? "")
      setCategoryId(recurring?.category_id ?? "")
      setFrequency(recurring?.frequency ?? "monthly")
      setStartDate(recurring?.start_date ?? "")
      setRequiresConfirmation(recurring?.requires_confirmation ?? false)
      setConfirmationDelay(recurring?.confirmation_delay ?? 0)
      setError(null)
    }
  }, [open, recurring])

  // Auto-set defaults based on type (only for new records)
  function handleTypeChange(newType: "income" | "expense") {
    setType(newType)
    setCategoryId("")
    if (!recurring) {
      const isIncome = newType === "income"
      setRequiresConfirmation(isIncome)
      setConfirmationDelay(isIncome ? 1 : 0)
    }
  }

  // When toggling confirmation off, reset delay; when turning ON for a new record default to +1 cycle
  function handleConfirmationToggle(checked: boolean) {
    setRequiresConfirmation(checked)
    if (!checked) {
      setConfirmationDelay(0)
    } else if (!isEdit) {
      setConfirmationDelay(1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amountResult = validateAmount(amount)
    if (!amountResult.ok) {
      setError(amountResult.error)
      return
    }
    if (!categoryId) {
      setError("La categoria è obbligatoria.")
      return
    }
    if (!startDate) {
      setError("La data di inizio è obbligatoria.")
      return
    }

    await wrap(async () => {
      const input: CreateRecurringInput = {
        type,
        scope,
        amount: amountResult.value,
        description: description.trim() || null,
        category_id: categoryId || null,
        frequency,
        start_date: startDate,
        requires_confirmation: requiresConfirmation,
        confirmation_delay: requiresConfirmation ? confirmationDelay : 0,
      }

      const result = isEdit
        ? await updateRecurringTransaction(recurring.id, input)
        : await createRecurringTransaction(input)

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
          <DialogTitle>{isEdit ? "Modifica ricorrenza" : "Nuova ricorrenza"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">
              Tipo <span className="text-expense-fg">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
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
                onClick={() => handleTypeChange("expense")}
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

          {/* Scope */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">Visibilità</label>
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

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="rec-amount">
              Importo <span className="text-expense-fg">*</span>
            </label>
            <Input
              id="rec-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="border-border-subtle bg-surface-0 text-text-1"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="rec-desc">
              Descrizione
            </label>
            <Input
              id="rec-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Es. Affitto, Stipendio..."
              className="border-border-subtle bg-surface-0 text-text-1"
            />
          </div>

          {/* Category */}
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

          {/* Frequency */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2">
              Frequenza <span className="text-expense-fg">*</span>
            </label>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                    frequency === f
                      ? "border-pending bg-pending-subtle text-pending-fg"
                      : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                  }`}
                >
                  {f === "weekly" ? "Settimanale" : f === "monthly" ? "Mensile" : "Annuale"}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-2" htmlFor="rec-start">
              Data inizio <span className="text-expense-fg">*</span>
            </label>
            <DateInput
              id="rec-start"
              value={startDate}
              onChange={setStartDate}
              className="border-border-subtle bg-surface-0 text-text-1"
            />
          </div>

          {/* Requires confirmation */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                id="rec-confirm"
                type="checkbox"
                checked={requiresConfirmation}
                onChange={(e) => handleConfirmationToggle(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong bg-surface-1 accent-emerald-500"
              />
              <label htmlFor="rec-confirm" className="text-xs text-text-2 cursor-pointer">
                Richiedi conferma importo prima di registrare
              </label>
            </div>

            {/* Confirmation delay — visible only when requires_confirmation is on */}
            {requiresConfirmation && (
              <div className="ml-7 space-y-1.5">
                <p className="text-xs text-text-2">Quando chiedere conferma?</p>
                <div className="flex gap-2">
                  {DELAY_OPTIONS.map(({ value, label, hint }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfirmationDelay(value)}
                      title={hint}
                      className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                        confirmationDelay === value
                          ? "border-info bg-info-subtle text-info"
                          : "border-border-subtle bg-transparent text-text-2 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-3">
                  {DELAY_OPTIONS.find((o) => o.value === confirmationDelay)?.hint}
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-expense-fg">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
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
              {submitting ? "Salvataggio..." : isEdit ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
