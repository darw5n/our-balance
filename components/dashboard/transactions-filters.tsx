"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import { DateInput } from "@/components/ui/date-input"

type Props = {
  q: string
  from: string
  to: string
  category: string
  categories: CategoryOption[]
}

export function TransactionsFilters({ q, from, to, category, categories }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [fromDate, setFromDate] = useState(from)
  const [toDate, setToDate] = useState(to)
  const activeCount = [from, to, category].filter(Boolean).length
  const hasReset = !!(q || from || to || category)

  return (
    <form
      className="flex flex-wrap items-center gap-2 text-xs"
      action="/transactions"
      method="get"
    >
      {/* Ricerca */}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Cerca..."
        className="h-8 min-w-0 flex-1 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none placeholder:text-zinc-500 md:w-44 md:flex-none"
      />

      {/* Toggle filtri avanzati — solo mobile */}
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

      {/* Data da — mobile: solo se aperto; desktop: sempre visibile */}
      <DateInput
        name="from"
        value={fromDate}
        onChange={setFromDate}
        className={`h-8 text-xs md:block ${filtersOpen ? "block w-full" : "hidden"}`}
      />

      {/* Data a */}
      <DateInput
        name="to"
        value={toDate}
        onChange={setToDate}
        className={`h-8 text-xs md:block ${filtersOpen ? "block w-full" : "hidden"}`}
      />

      {/* Categoria */}
      <select
        name="category"
        defaultValue={category}
        className={`h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none md:block md:w-auto ${
          filtersOpen ? "block w-full" : "hidden"
        }`}
      >
        <option value="">Tutte le categorie</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Filtra */}
      <button
        type="submit"
        className="h-8 rounded-md border border-emerald-500 bg-emerald-500 px-3 font-medium text-zinc-950 hover:bg-emerald-400"
      >
        Filtra
      </button>

      {/* Reset */}
      {hasReset && (
        <a
          href="/transactions"
          className="flex h-8 items-center rounded-md border border-white/15 px-3 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          Reset
        </a>
      )}
    </form>
  )
}
