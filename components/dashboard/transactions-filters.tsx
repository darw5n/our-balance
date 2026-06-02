"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react"
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
  const activeFilterCount = [from, to, category].filter(Boolean).length
  const hasReset = !!(q || from || to || category)

  return (
    <form action="/transactions" method="get" className="space-y-2">
      {/* Search bar + Filtra pill */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2.5">
          <Search className="h-4 w-4 flex-shrink-0 text-text-3" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cerca movimenti..."
            className="flex-1 bg-transparent font-sans text-sm text-text-1 outline-none placeholder:text-text-3"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 font-sans text-sm font-medium transition-all duration-200 ${
            filtersOpen || activeFilterCount > 0
              ? "border-accent-brand bg-accent-brand-bg text-accent-brand"
              : "border-border-subtle bg-surface-1 text-text-2 hover:text-text-1"
          }`}
          aria-label="Filtri avanzati"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtra
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-brand text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters — expandable panel */}
      {filtersOpen && (
        <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-border-subtle bg-surface-1 p-3">
          <DateInput name="from" value={fromDate} onChange={setFromDate} className="h-8 w-full text-xs" />
          <DateInput name="to" value={toDate} onChange={setToDate} className="h-8 w-full text-xs" />

          <div className="relative col-span-2">
            <select
              name="category"
              defaultValue={category}
              className="h-8 w-full appearance-none rounded-md border border-border-subtle bg-surface-2 py-0 pl-2 pr-7 font-sans text-xs text-text-1 outline-none"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
          </div>

          <button
            type="submit"
            className="col-span-2 h-8 rounded-full bg-accent-brand px-4 font-sans text-xs font-medium text-white transition-colors hover:opacity-90"
          >
            Applica
          </button>

          {hasReset && (
            <a
              href="/transactions"
              className="col-span-2 flex h-8 items-center justify-center gap-1 rounded-full border border-border-subtle px-3 font-sans text-xs text-text-2 transition-colors hover:text-text-1"
            >
              <X className="h-3 w-3" />
              Reset
            </a>
          )}
        </div>
      )}
    </form>
  )
}
