"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { MONTH_LABELS } from "@/components/dashboard/charts/chart-config"
import type { CategoryMonthRow } from "@/lib/supabase/queries/analytics"

const MACRO_LABELS: Record<string, string> = {
  necessita: "Necessità",
  svago: "Svago",
  risparmi: "Risparmi",
  investimenti: "Investimenti",
}

const MACRO_COLORS: Record<string, string> = {
  necessita: "text-pending-fg",
  svago: "text-shared",
  risparmi: "text-income-fg",
  investimenti: "text-info",
}

type Props = {
  data: CategoryMonthRow[]
  year: number
}

export function CategoryMonthTable({ data, year }: Props) {
  const [showAll, setShowAll] = useState(false)

  const hasData = data.length > 0

  const monthTotals = Array(12).fill(0) as number[]
  for (const row of data) {
    row.months.forEach((v, i) => { monthTotals[i] += v })
  }
  const grandTotal = monthTotals.reduce((s, v) => s + v, 0)

  const VISIBLE_ROWS = 8
  const displayData = showAll ? data : data.slice(0, VISIBLE_ROWS)
  const hasMore = data.length > VISIBLE_ROWS

  const maxCellValue = Math.max(...data.flatMap((row) => row.months).filter((v) => v > 0), 1)
  function heatmapBg(v: number) {
    if (v <= 0) return undefined
    const intensity = Math.min(v / maxCellValue, 1)
    return `color-mix(in srgb, var(--expense-fg) ${Math.round(intensity * 28)}%, transparent)`
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 font-sans text-xs text-text-3">
        <p>Nessuna spesa registrata per il {year}.</p>
        <Link href="/transactions" className="text-accent-brand underline underline-offset-2">
          Aggiungi transazioni →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] font-sans text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="sticky left-0 z-10 bg-surface-1 pb-2 pr-4 text-left font-medium text-text-3">
                Categoria
              </th>
              {MONTH_LABELS.map((m) => (
                <th key={m} className="min-w-[72px] whitespace-nowrap px-2 pb-2 text-right font-medium text-text-3">
                  {m}
                </th>
              ))}
              <th className="pb-2 pl-4 text-right font-medium text-text-3">Totale</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-subtle">
            {displayData.map((row) => (
              <tr key={row.id} className="group hover:bg-surface-hover">
                <td className="sticky left-0 z-10 bg-surface-1 py-2 pr-4 group-hover:bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="max-w-[120px] truncate text-text-1">{row.name}</span>
                    {row.macro_category && (
                      <span className={`hidden sm:inline text-[10px] ${MACRO_COLORS[row.macro_category] ?? "text-text-3"}`}>
                        {MACRO_LABELS[row.macro_category]}
                      </span>
                    )}
                  </div>
                </td>

                {row.months.map((v, i) => (
                  <td
                    key={i}
                    className="whitespace-nowrap rounded px-2 py-2 text-right tabular-nums"
                    style={{ backgroundColor: heatmapBg(v) }}
                  >
                    {v > 0 ? (
                      <span className="text-text-1">{formatCurrency(v)}</span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>
                ))}

                <td className="whitespace-nowrap py-2 pl-4 text-right font-medium tabular-nums text-text-1">
                  {formatCurrency(row.total)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-border-subtle font-semibold">
              <td className="sticky left-0 z-10 bg-surface-1 pr-4 pt-3 text-text-2">Totale</td>
              {monthTotals.map((v, i) => (
                <td key={i} className="whitespace-nowrap px-2 pt-3 text-right tabular-nums text-text-2">
                  {v > 0 ? formatCurrency(v) : <span className="font-normal text-text-3">—</span>}
                </td>
              ))}
              <td className="whitespace-nowrap pl-4 pt-3 text-right tabular-nums text-income-fg">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="font-sans text-xs text-text-3 underline underline-offset-2 hover:text-text-1"
          >
            {showAll ? "Mostra meno" : `Mostra tutte le ${data.length} categorie`}
          </button>
        </div>
      )}
    </>
  )
}
