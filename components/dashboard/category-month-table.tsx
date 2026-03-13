"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CategoryMonthRow } from "@/lib/supabase/queries/analytics"

const MONTH_LABELS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]

const MACRO_LABELS: Record<string, string> = {
  necessita: "Necessità",
  svago: "Svago",
  risparmi: "Risparmi",
  investimenti: "Investimenti",
}

const MACRO_COLORS: Record<string, string> = {
  necessita: "text-amber-400",
  svago: "text-violet-400",
  risparmi: "text-emerald-400",
  investimenti: "text-blue-400",
}

type Props = {
  data: CategoryMonthRow[]
  year: number
}

export function CategoryMonthTable({ data, year }: Props) {
  const [showAll, setShowAll] = useState(false)

  const hasData = data.length > 0

  // Totali mensili (riga di fondo)
  const monthTotals = Array(12).fill(0) as number[]
  for (const row of data) {
    row.months.forEach((v, i) => { monthTotals[i] += v })
  }
  const grandTotal = monthTotals.reduce((s, v) => s + v, 0)

  const VISIBLE_ROWS = 8
  const displayData = showAll ? data : data.slice(0, VISIBLE_ROWS)
  const hasMore = data.length > VISIBLE_ROWS

  // Valore massimo per heatmap
  const maxCellValue = Math.max(...data.flatMap((row) => row.months).filter((v) => v > 0), 1)
  function heatmapBg(v: number) {
    if (v <= 0) return undefined
    const intensity = Math.min(v / maxCellValue, 1)
    return `rgba(251,113,133,${(intensity * 0.35).toFixed(2)})`
  }

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Spese per categoria — {year}</h2>
        <p className="text-xs text-zinc-400">Dettaglio mensile di ogni categoria di uscita.</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-zinc-500">
          <p>Nessuna spesa registrata per il {year}.</p>
          <Link href="/transactions" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Aggiungi transazioni →
          </Link>
        </div>
      ) : (
        <>
          {/* Scroll orizzontale su mobile, prima colonna sticky */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {/* Prima colonna: categoria — sticky su mobile */}
                  <th className="sticky left-0 z-10 bg-zinc-900/95 pb-2 pr-4 text-left font-medium text-zinc-500 backdrop-blur">
                    Categoria
                  </th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="pb-2 text-right font-medium text-zinc-500 px-2 min-w-[72px] whitespace-nowrap">
                      {m}
                    </th>
                  ))}
                  <th className="pb-2 pl-4 text-right font-medium text-zinc-400">
                    Totale
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {displayData.map((row) => (
                  <tr key={row.id} className="group hover:bg-white/[0.02]">
                    {/* Categoria — sticky */}
                    <td className="sticky left-0 z-10 bg-zinc-900/95 py-2 pr-4 backdrop-blur group-hover:bg-zinc-900/98">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="truncate max-w-[120px] text-zinc-100">{row.name}</span>
                        {row.macro_category && (
                          <span className={`hidden sm:inline text-[10px] ${MACRO_COLORS[row.macro_category] ?? "text-zinc-500"}`}>
                            {MACRO_LABELS[row.macro_category]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 12 mesi */}
                    {row.months.map((v, i) => (
                      <td
                        key={i}
                        className="py-2 text-right px-2 tabular-nums whitespace-nowrap rounded"
                        style={{ backgroundColor: heatmapBg(v) }}
                      >
                        {v > 0 ? (
                          <span className="text-zinc-200">{formatCurrency(v)}</span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                    ))}

                    {/* Totale */}
                    <td className="py-2 pl-4 text-right font-medium text-zinc-100 tabular-nums whitespace-nowrap">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Riga totali */}
              <tfoot>
                <tr className="border-t border-white/15 font-semibold">
                  <td className="sticky left-0 z-10 bg-zinc-900/95 pt-3 pr-4 text-zinc-300 backdrop-blur">
                    Totale
                  </td>
                  {monthTotals.map((v, i) => (
                    <td key={i} className="pt-3 text-right px-2 tabular-nums text-zinc-300 whitespace-nowrap">
                      {v > 0 ? formatCurrency(v) : <span className="font-normal text-zinc-700">—</span>}
                    </td>
                  ))}
                  <td className="pt-3 pl-4 text-right text-emerald-400 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mostra tutto / comprimi */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
              >
                {showAll
                  ? "Mostra meno"
                  : `Mostra tutte le ${data.length} categorie`}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
