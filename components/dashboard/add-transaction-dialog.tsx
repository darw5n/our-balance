"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTransaction, type TransactionType } from "@/app/actions/transactions"
import { supabase } from "@/lib/supabase"

export type CategoryOption = { id: string; name: string; color: string }

type AddTransactionDialogProps = {
  categories?: CategoryOption[]
}

export function AddTransactionDialog({ categories = [] }: AddTransactionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<TransactionType>("expense")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering DialogTrigger client-side
  useEffect(() => {
    setMounted(true)
  }, [])

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

    if (!type || (type !== "income" && type !== "expense")) {
      setError("Seleziona un tipo di transazione (Entrata o Uscita).")
      return
    }

    const parsedAmount = parseFloat(amount.replace(",", "."))
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

    // Debug logging
    console.log("[AddTransactionDialog] Submitting transaction:")
    console.log("  - User ID:", user.id)
    console.log("  - Date:", formattedDate)
    console.log("  - Amount:", parsedAmount)
    console.log("  - Type:", type)
    console.log("  - Description:", description || "(vuoto)")

    try {
      const result = await createTransaction({
        amount: parsedAmount,
        type,
        date: formattedDate,
        description: description || null,
        category_id: categoryId || null,
        status: "confirmed",
        scope: "personal",
      })

      if (!result.success) {
        setError(result.error)
        console.error("[AddTransactionDialog] Error:", result.error)
        return
      }

      console.log("[AddTransactionDialog] Transaction created successfully:", result.id)

      // Reset form
      setOpen(false)
      setDate("")
      setAmount("")
      setType("expense")
      setCategoryId("")
      setDescription("")
      setError(null)

      // Refresh page to show new transaction
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore sconosciuto."
      setError(errorMessage)
      console.error("[AddTransactionDialog] Unexpected error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {mounted ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-500 text-2xl font-semibold text-zinc-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 focus-visible:ring-emerald-300"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>

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
              <label className="text-xs font-medium text-zinc-300" htmlFor="date">
                Data <span className="text-rose-400">*</span>
              </label>
              <Input
                id="date"
                type="date"
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
              <label className="text-xs font-medium text-zinc-300" htmlFor="category">
                Categoria
              </label>
              <select
                id="category"
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

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
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
                {submitting ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      ) : (
        // Placeholder durante SSR per evitare layout shift
        <div className="fixed bottom-6 right-6 z-40 h-14 w-14" />
      )}
    </>
  )
}

