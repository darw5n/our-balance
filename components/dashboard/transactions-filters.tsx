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
        className="h-8 min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-0 px-2 text-xs text-text-1 outline-none placeholder:text-text-3 md:w-44 md:flex-none"
      />

      {/* Toggle filtri avanzati — solo mobile */}
      <button
        type="button"
        onClick={() => setFiltersOpen((v) => !v)}
        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 transition-colors md:hidden ${
          filtersOpen || activeCount > 0
            ? "border-income/50 bg-income-subtle text-income-fg"
            : "border-border-subtle text-text-2 hover:bg-white/5 hover:text-text-1"
        }`}
        aria-label="Filtri avanzati"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {activeCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-income px-1 text-[9px] font-bold text-zinc-950">
            {activeCount}
          </span>
        )}
      </button>

      {/* Data da — mobile: solo se aperto; desktop: sempre visibile */}
      <div className={`md:block ${filtersOpen ? "block w-full" : "hidden"}`}>
        <DateInput name="from" value={fromDate} onChange={setFromDate} className="h-8 w-full text-xs" />
      </div>

      {/* Data a */}
      <div className={`md:block ${filtersOpen ? "block w-full" : "hidden"}`}>
        <DateInput name="to" value={toDate} onChange={setToDate} className="h-8 w-full text-xs" />
      </div>

      {/* Categoria */}
      <select
        name="category"
        defaultValue={category}
        className={`h-8 rounded-md border border-border-subtle bg-surface-0 px-2 text-xs text-text-1 outline-none md:block md:w-auto ${
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
        className="h-8 rounded-md border border-income bg-income px-3 font-medium text-zinc-950 hover:bg-income-fg"
      >
        Filtra
      </button>

      {/* Reset */}
      {hasReset && (
        <a
          href="/transactions"
          className="flex h-8 items-center rounded-md border border-border-subtle px-3 text-text-2 hover:bg-white/5 hover:text-text-1"
        >
          Reset
        </a>
      )}
    </form>
  )
}
