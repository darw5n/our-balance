"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, User, Users } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTransaction, type TransactionType } from "@/app/actions/transactions"
import { createRecurringTransaction, type RecurringFrequency } from "@/app/actions/recurring"
import { supabase } from "@/lib/supabase"
import { CategoryCombobox } from "@/components/dashboard/category-combobox"
import { parseItalianAmount } from "@/lib/utils"

export type CategoryOption = {
  id: string
  name: string
  color: string
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddTransactionDialog({
  categories = [],
  open: externalOpen,
  onOpenChange: externalSetOpen,
}: AddTransactionDialogProps) {
  const router = useRouter()
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen! : internalOpen
  const setOpen = isControlled ? externalSetOpen! : setInternalOpen
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Prevent hydration mismatch by only rendering DialogTrigger client-side
  useEffect(() => {
    setMounted(true)
  }, [])

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        function mostCommon(rows: { category_id: string | null }[]): string | null {
          const counts = new Map<string, number>()
          for (const row of rows) {
            if (row.category_id)
              counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
          }
          return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        }

        // 1. Try full description match
        const { data: exact } = await supabase
          .from("transactions")
          .select("category_id")
          .eq("user_id", user.id)
          .eq("type", type)
          .not("category_id", "is", null)
          .ilike("description", `%${trimmed}%`)
          .order("date", { ascending: false })
          .limit(20)

        let suggested = exact?.length ? mostCommon(exact as { category_id: string | null }[]) : null

        // 2. Fallback: individual words ≥ 3 chars
        if (!suggested) {
          const words = trimmed.split(/\s+/).filter((w) => w.length >= 3)
          if (words.length > 0) {
            const orFilter = words.map((w) => `description.ilike.%${w}%`).join(",")
            const { data: partial } = await supabase
              .from("transactions")
              .select("category_id")
              .eq("user_id", user.id)
              .eq("type", type)
              .not("category_id", "is", null)
              .or(orFilter)
              .order("date", { ascending: false })
              .limit(30)
            suggested = partial?.length ? mostCommon(partial as { category_id: string | null }[]) : null
          }
        }

        setSuggestedCategoryId(suggested ?? null)
      } catch {
        // category suggestion is best-effort — ignore network errors
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [description, type]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      if (!user) {
        console.warn("[AddTransactionDialog] User not authenticated")
      } else {
        console.log("[AddTransactionDialog] User authenticated:", user.id)
      }
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

    const parsedAmount = parseItalianAmount(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setError("Importo non valido.")
      return
    }

    // Format date to ISO string (YYYY-MM-DD)
    let formattedDate: string
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        setError("Formato data non valido.")
        return
      }
      formattedDate = dateObj.toISOString().split("T")[0]
    } catch {
      setError("Formato data non valido.")
      return
    }

    setSubmitting(true)

    // Verify authentication again before submitting
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Sessione scaduta. Ricarica la pagina e riprova.")
      setSubmitting(false)
      return
    }

    try {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore sconosciuto."
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {(mounted || isControlled) ? (
        <Dialog open={open} onOpenChange={setOpen}>
          {!isControlled && (
            <DialogTrigger asChild>
              <Button
                className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full bg-emerald-500 text-2xl font-semibold text-zinc-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 focus-visible:ring-emerald-300 md:bottom-6"
                size="icon"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
          )}

          <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi transazione</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="type">
                Tipo <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setType("income"); setRequiresConfirmation(true); setCategoryId("") }}
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
                  onClick={() => { setType("expense"); setRequiresConfirmation(false); setCategoryId("") }}
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
              <label className="text-xs font-medium text-zinc-300">
                Visibilità
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScope("personal")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    scope === "personal"
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
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
                      ? "border-violet-500 bg-violet-500/20 text-violet-400"
                      : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  In comune
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="date">
                {isRecurring ? "Data di inizio" : "Data"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <Input
                id="date"
                type="date"
                lang="it"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="amount">
                Importo <span className="text-rose-400">*</span>
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
              <label className="text-xs font-medium text-zinc-300" htmlFor="description">
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
              <label className="text-xs font-medium text-zinc-300">
                Categoria <span className="text-rose-400">*</span>
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
                    className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>Suggerito: <strong>{cat.name}</strong></span>
                    <span className="ml-1 opacity-60">— tocca per applicare</span>
                  </button>
                )
              })()}
            </div>

            {/* Recurring toggle */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <label htmlFor="is-recurring" className="text-xs font-medium text-zinc-300 cursor-pointer">
                  Rendila ricorrente
                </label>
                <button
                  id="is-recurring"
                  type="button"
                  role="switch"
                  aria-checked={isRecurring}
                  onClick={() => setIsRecurring((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                    isRecurring ? "bg-emerald-500" : "bg-zinc-700"
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
                    <label className="text-xs font-medium text-zinc-300">Periodicità</label>
                    <div className="flex gap-2">
                      {(["weekly", "monthly", "yearly"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                            frequency === f
                              ? "border-amber-500 bg-amber-500/20 text-amber-400"
                              : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
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
                      className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-emerald-500"
                    />
                    <label htmlFor="req-confirm" className="text-xs text-zinc-300 cursor-pointer">
                      Chiedi conferma importo ogni volta{" "}
                      <span className="text-zinc-500">(utile per stipendi variabili)</span>
                    </label>
                  </div>

                  {requiresConfirmation && (
                    <div className="ml-7 space-y-1.5">
                      <p className="text-xs text-zinc-400">Quando chiedere conferma?</p>
                      <div className="flex gap-2">
                        {([
                          { value: 0, label: "Immediato", hint: "Si conferma nel mese di competenza" },
                          { value: 1, label: "+1 ciclo", hint: "Es. stipendio feb → conferma mar" },
                          { value: 2, label: "+2 cicli", hint: "Es. stipendio gen → conferma mar" },
                        ] as const).map(({ value, label, hint }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setConfirmationDelay(value)}
                            title={hint}
                            className={`flex flex-1 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                              confirmationDelay === value
                                ? "border-sky-500 bg-sky-500/20 text-sky-400"
                                : "border-white/15 bg-transparent text-zinc-300 hover:bg-white/5"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {[
                          { value: 0, hint: "Si conferma nel mese di competenza" },
                          { value: 1, hint: "Es. stipendio feb → conferma mar" },
                          { value: 2, hint: "Es. stipendio gen → conferma mar" },
                        ].find((o) => o.value === confirmationDelay)?.hint}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            {/* Footer: sticky su mobile, normale su desktop */}
            <div className="sticky bottom-0 -mx-5 -mb-5 bg-zinc-950 px-5 pb-6 pt-3 sm:static sm:mx-0 sm:mb-0 sm:bg-transparent sm:pb-0 sm:pt-2">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-transparent text-zinc-50 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Annulla
                </Button>

                <Button
                  type="submit"
                  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  disabled={submitting}
                >
                  {submitting ? "Salvataggio..." : isRecurring ? "Crea ricorrenza" : "Salva"}
                </Button>
              </div>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      ) : (
        // Placeholder durante SSR — solo in modalità non controllata (FAB)
        !isControlled && <div className="fixed bottom-6 right-6 z-40 h-14 w-14" />
      )}
    </>
  )
}

