"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

type Props = {
  q: string
  from: string
  to: string
  category: string
  categories: CategoryOption[]
}

export function TransactionsFilters({ q, from, to, category, categories }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeCount = [from, to, category].filter(Boolean).length
  const hasReset = q || from || to || category

  return (
    <form className="flex flex-col gap-2 text-xs" action="/transactions" method="get">
      {/* Riga sempre visibile: cerca + toggle (mobile) + submit + reset */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cerca descrizione..."
          className="h-8 flex-1 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none placeholder:text-zinc-500 md:w-36 md:flex-none"
        />

        {/* Toggle filtri — mobile only */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`relative flex h-8 items-center gap-1.5 rounded-md border px-3 transition-colors md:hidden ${
            filtersOpen || activeCount > 0
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
          aria-label="Mostra filtri avanzati"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {activeCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="submit"
          className="h-8 rounded-md border border-emerald-500 bg-emerald-500 px-3 font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Filtra
        </button>

        {hasReset && (
          <a
            href="/transactions"
            className="flex h-8 items-center rounded-md border border-white/15 px-3 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            Reset
          </a>
        )}
      </div>

      {/* Filtri avanzati: collassabili su mobile, sempre visibili su desktop */}
      <div className={`flex flex-wrap gap-2 ${filtersOpen ? "" : "hidden"} md:flex`}>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
        />
        <select
          name="category"
          defaultValue={category}
          className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </form>
  )
}
