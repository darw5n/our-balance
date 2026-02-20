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
    <div className="space-y-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-50">
      <p className="font-medium">Si è verificato un errore nel caricamento della dashboard.</p>
      <p className="text-xs text-rose-200">
        Riprova tra qualche secondo. Se il problema persiste, controlla la connessione o le impostazioni di Supabase.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 inline-flex h-8 items-center rounded-md border border-rose-300/70 bg-transparent px-3 text-xs font-medium text-rose-50 hover:bg-rose-900/60"
      >
        Riprova
      </button>
    </div>
  )
}

