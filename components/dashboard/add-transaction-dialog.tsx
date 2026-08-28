"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, User, Users } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { createTransaction, type TransactionType } from "@/app/actions/transactions"
import { createRecurringTransaction, type RecurringFrequency } from "@/app/actions/recurring"
import { suggestCategory } from "@/app/actions/suggest-category"
import { supabase } from "@/lib/supabase"
import { CategoryCombobox } from "@/components/dashboard/category-combobox"
import { validateAmount } from "@/lib/utils"
import { useFormState } from "@/lib/hooks/use-form-state"

const CONFIRMATION_DELAY_OPTIONS = [
  { value: 0, label: "Immediato", hint: "Si conferma nel mese di competenza" },
  { value: 1, label: "+1 ciclo", hint: "Es. stipendio feb → conferma mar" },
  { value: 2, label: "+2 cicli", hint: "Es. stipendio gen → conferma mar" },
] as const

export type CategoryOption = {
  id: string
  name: string
  color: string
  emoji?: string | null
  type?: string | null
  group_name?: string | null
}

export function buildGroupedOptions(categories: CategoryOption[], txType: string) {
  const visible = categories.filter((c) => !c.type || c.type === txType)
  const grouped = new Map<string, CategoryOption[]>()

  for (const cat of visible) {
    const key = cat.group_name?.trim() || ""
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(cat)
  }

  // Sort items within each group alphabetically
  for (const items of grouped.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name, "it"))
  }

  // Sort group headers alphabetically; "Altro" and ungrouped ("") always last
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "" || a === "Altro") return 1
    if (b === "" || b === "Altro") return -1
    return a.localeCompare(b, "it")
  })

  return sortedKeys.map((k) => ({
    key: k || "__ungrouped__",
    label: k || "Altro",
    items: grouped.get(k)!,
  }))
}

type AddTransactionDialogProps = {
  categories?: CategoryOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransactionDialog({
  categories = [],
  open,
  onOpenChange: setOpen,
}: AddTransactionDialogProps) {
  const router = useRouter()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<TransactionType>("expense")
  const [scope, setScope] = useState<"personal" | "family">("personal")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly")
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)
  const [confirmationDelay, setConfirmationDelay] = useState(0)
  const { submitting, error, setError, wrap } = useFormState()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keyboard shortcut: press 'N' to open the dialog (unless focus is in an input/textarea)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if ((e.target as HTMLElement)?.isContentEditable) return
      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-suggest category from description (debounced 400ms, client-side query)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = description.trim()
    if (trimmed.length < 3) {
      setSuggestedCategoryId(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const suggested = await suggestCategory(trimmed, type)
        setSuggestedCategoryId(suggested)
      } catch (err) {
        console.warn("[CategorySuggestion] errore:", err)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [description, type])

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Check authentication first
    if (isAuthenticated === false) {
      setError("Devi essere autenticato per aggiungere una transazione. Ricarica la pagina.")
      return
    }

    // Validation
    if (!date || !amount) {
      setError("Data e importo sono obbligatori.")
      return
    }

    if (!categoryId) {
      setError("La categoria è obbligatoria.")
      return
    }

    if (!type || (type !== "income" && type !== "expense")) {
      setError("Seleziona un tipo di transazione (Entrata o Uscita).")
      return
    }

    const amountResult = validateAmount(amount)
    if (!amountResult.ok) {
      setError(amountResult.error)
      return
    }
    const parsedAmount = amountResult.value

    // date is already YYYY-MM-DD from DateInput
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Formato data non valido.")
      return
    }
    const formattedDate = date

    await wrap(async () => {
      // Verify authentication again before submitting
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Sessione scaduta. Ricarica la pagina e riprova.")
        return
      }

      let result: { success: boolean; error?: string }

      if (isRecurring) {
        result = await createRecurringTransaction({
          type,
          scope,
          amount: parsedAmount,
          description: description || null,
          category_id: categoryId || null,
          frequency,
          start_date: formattedDate,
          requires_confirmation: requiresConfirmation,
          confirmation_delay: requiresConfirmation ? confirmationDelay : 0,
        })
      } else {
        result = await createTransaction({
          amount: parsedAmount,
          type,
          date: formattedDate,
          description: description || null,
          category_id: categoryId || null,
          status: "confirmed",
          scope,
        })
      }

      if (!result.success) {
        setError(result.error ?? "Errore durante il salvataggio.")
        return
      }

      // Reset form
      setOpen(false)
      setSuggestedCategoryId(null)
      setDate(new Date().toISOString().slice(0, 10))
      setAmount("")
      setType("expense")
      setScope("personal")
      setCategoryId("")
      setDescription("")
      setIsRecurring(false)
      setFrequency("monthly")
      setRequiresConfirmation(false)
      setConfirmationDelay(0)
      setError(null)

      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi transazione</DialogTitle>
          </DialogHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pb-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="type">
                Tipo <span className="text-expense-fg">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setType("income"); setRequiresConfirmation(true); setCategoryId("") }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    type === "income"
                      ? "border-income bg-income-subtle text-income-fg"
                      : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Entrata
                </button>
                <button
                  type="button"
                  onClick={() => { setType("expense"); setRequiresConfirmation(false); setCategoryId("") }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    type === "expense"
                      ? "border-expense bg-expense-subtle text-expense-fg"
                      : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
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
                      ? "border-info bg-info-subtle text-info"
                      : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
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
                      : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  In comune
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="date">
                {isRecurring ? "Data di inizio" : "Data"}{" "}
                <span className="text-expense-fg">*</span>
              </label>
              <DateInput
                id="date"
                value={date}
                onChange={setDate}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="amount">
                Importo <span className="text-expense-fg">*</span>
              </label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="description">
                Descrizione
              </label>
              <Input
                id="description"
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
                onChange={(id) => { setCategoryId(id); setSuggestedCategoryId(null) }}
              />
              {suggestedCategoryId && suggestedCategoryId !== categoryId && (() => {
                const cat = categories.find((c) => c.id === suggestedCategoryId)
                if (!cat) return null
                return (
                  <button
                    type="button"
                    onClick={() => { setCategoryId(suggestedCategoryId); setSuggestedCategoryId(null) }}
                    className="flex items-center gap-2 rounded-md border border-pending/30 bg-pending-subtle px-2.5 py-1.5 text-xs text-pending-fg transition-colors hover:bg-pending-subtle"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>Suggerito: <strong>{cat.name}</strong></span>
                    <span className="ml-1 opacity-60">— tocca per applicare</span>
                  </button>
                )
              })()}
            </div>

            {/* Recurring toggle */}
            <div className="border-t border-border-subtle pt-3">
              <div className="flex items-center justify-between">
                <label htmlFor="is-recurring" className="text-xs font-medium text-text-2 cursor-pointer">
                  Rendila ricorrente
                </label>
                <button
                  id="is-recurring"
                  type="button"
                  role="switch"
                  aria-checked={isRecurring}
                  onClick={() => setIsRecurring((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isRecurring ? "bg-income" : "bg-surface-3"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      isRecurring ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {isRecurring && (
                <div className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-2">Periodicità</label>
                    <div className="flex gap-2">
                      {(["weekly", "monthly", "yearly"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                            frequency === f
                              ? "border-pending bg-pending-subtle text-pending-fg"
                              : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
                          }`}
                        >
                          {f === "weekly" ? "Settimanale" : f === "monthly" ? "Mensile" : "Annuale"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="req-confirm"
                      type="checkbox"
                      checked={requiresConfirmation}
                      onChange={(e) => {
                        setRequiresConfirmation(e.target.checked)
                        if (!e.target.checked) setConfirmationDelay(0)
                      }}
                      className="h-4 w-4 rounded border-border-strong bg-surface-1 accent-emerald-500"
                    />
                    <label htmlFor="req-confirm" className="text-xs text-text-2 cursor-pointer">
                      Chiedi conferma importo ogni volta{" "}
                      <span className="text-text-3">(utile per stipendi variabili)</span>
                    </label>
                  </div>

                  {requiresConfirmation && (
                    <div className="ml-7 space-y-1.5">
                      <p className="text-xs text-text-2">Quando chiedere conferma?</p>
                      <div className="flex gap-2">
                        {CONFIRMATION_DELAY_OPTIONS.map(({ value, label, hint }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setConfirmationDelay(value)}
                            title={hint}
                            className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                              confirmationDelay === value
                                ? "border-info bg-info-subtle text-info"
                                : "border-border-subtle bg-transparent text-text-2 hover:bg-surface-2"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-text-3">
                        {CONFIRMATION_DELAY_OPTIONS.find((o) => o.value === confirmationDelay)?.hint}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

            {error && <p className="flex-shrink-0 pt-1 text-xs text-expense-fg">{error}</p>}

            {/* Footer: sempre visibile, non scorre */}
            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border-subtle -mx-5 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="border-border-subtle bg-transparent text-text-1 hover:bg-surface-3 hover:text-text-1"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Annulla
              </Button>

              <Button
                type="submit"
                className="bg-income text-white hover:bg-income-fg"
                disabled={submitting}
              >
                {submitting ? "Salvataggio..." : isRecurring ? "Crea ricorrenza" : "Salva"}
              </Button>
            </div>
          </form>
          </DialogContent>
    </Dialog>
  )
}

