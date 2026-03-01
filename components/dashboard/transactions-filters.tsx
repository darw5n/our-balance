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
  const hasReset = !!(q || from || to || category)

  return (
    <form
      className="flex flex-col gap-2 text-xs md:flex-row md:flex-wrap md:items-center"
      action="/transactions"
      method="get"
    >
      {/* Search + toggle (mobile) + submit */}
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cerca..."
          className="h-8 flex-1 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none placeholder:text-zinc-500 md:w-40 md:flex-none"
        />

        {/* Toggle filtri — mobile only */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 transition-colors md:hidden ${
            filtersOpen || activeCount > 0
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-white/15 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
          aria-label="Filtri avanzati"
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

        {/* Desktop reset */}
        {hasReset && (
          <a
            href="/transactions"
            className="hidden h-8 items-center rounded-md border border-white/15 px-3 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 md:flex"
          >
            Reset
          </a>
        )}
      </div>

      {/* Filtri avanzati
          Mobile: flex-col collassabile, ogni input occupa tutta la width
          Desktop: flex-row sempre visibile (md:contents elimina il wrapper dalla flow) */}
      <div
        className={`flex-col gap-2 md:contents ${filtersOpen ? "flex" : "hidden"} md:flex`}
      >
        {/* Date range: su mobile side-by-side (from → to), su desktop due item separati */}
        <div className="flex items-center gap-1 md:contents">
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="h-8 flex-1 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none md:flex-none"
          />
          <span className="shrink-0 text-zinc-600 md:hidden">→</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="h-8 flex-1 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none md:flex-none"
          />
        </div>

        {/* Categoria — full width su mobile */}
        <select
          name="category"
          defaultValue={category}
          className="h-8 w-full rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none md:w-auto"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Reset — solo mobile, dentro il pannello filtri */}
        {hasReset && (
          <a
            href="/transactions"
            className="flex h-8 w-full items-center justify-center rounded-md border border-white/15 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 md:hidden"
          >
            Reset
          </a>
        )}
      </div>
    </form>
  )
}
