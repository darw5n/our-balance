"use client"

import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="space-y-3 rounded-xl border border-expense/40 bg-expense-subtle p-4 text-sm text-text-1">
      <p className="font-medium">Si è verificato un errore nel caricamento della dashboard.</p>
      <p className="text-xs text-text-2">
        Riprova tra qualche secondo. Se il problema persiste, controlla la connessione o le impostazioni di Supabase.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 inline-flex h-8 items-center rounded-md border border-expense/40 bg-transparent px-3 text-xs font-medium text-expense-fg transition-colors hover:bg-expense-subtle"
      >
        Riprova
      </button>
    </div>
  )
}

