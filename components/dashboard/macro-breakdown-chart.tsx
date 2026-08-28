"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import type { MacroBreakdown } from "@/lib/supabase/queries/analytics"

type Props = {
  data: MacroBreakdown
  monthsElapsed: number
}

const BAR_SEGMENTS = [
  { key: "necessita"    as const, label: "Necessità",    color: "#f59e0b" },
  { key: "svago"        as const, label: "Svago",         color: "#8b5cf6" },
  { key: "investimenti" as const, label: "Investimenti",  color: "#10b981" },
  { key: "risparmi"     as const, label: "Risparmiato",   color: "#38bdf8" },
]

export function MacroBreakdownChart({ data, monthsElapsed }: Props) {
  const { totale_entrate, necessita, svago, investimenti, risparmi } = data
  const hasData = totale_entrate > 0 || (necessita + svago + investimenti) > 0
  const barBase = Math.max(totale_entrate, necessita + svago + investimenti)

  const pct = (value: number) =>
    totale_entrate > 0 ? ((value / totale_entrate) * 100).toFixed(1) : "—"

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 font-sans text-xs text-text-3">
        <p>Nessuna categoria ha una macro-categoria assegnata.</p>
        <Link href="/categories" className="text-accent-brand underline underline-offset-2">
          Vai a Categorie →
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Stacked horizontal bar */}
      <div className="mb-4 flex h-7 w-full overflow-hidden rounded-lg bg-surface-2">
        {BAR_SEGMENTS.map((s) => {
          const value = data[s.key]
          const width = barBase > 0 ? (value / barBase) * 100 : 0
          if (width <= 0) return null
          return (
            <div
              key={s.key}
              className="h-full transition-all"
              style={{ width: `${width}%`, backgroundColor: s.color }}
              title={`${s.label}: ${formatCurrency(value)}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="mb-5 flex flex-wrap gap-3">
        {BAR_SEGMENTS.filter((s) => data[s.key] > 0).map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 font-sans text-xs text-text-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full font-sans text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-3">
              <th className="pb-2 text-left font-medium">Macro-categoria</th>
              <th className="pb-2 text-right font-medium">Media/mese</th>
              <th className="pb-2 text-right font-medium">Totale anno</th>
              <th className="pb-2 text-right font-medium">% entrate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            <tr>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-pending" />
                  <span className="text-text-1">Necessità</span>
                </div>
              </td>
              <td className="py-2 text-right text-text-1">{formatCurrency(necessita / monthsElapsed)}</td>
              <td className="py-2 text-right text-text-1">{formatCurrency(necessita)}</td>
              <td className="py-2 text-right text-text-3">{pct(necessita)}%</td>
            </tr>
            <tr>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-shared" />
                  <span className="text-text-1">Svago</span>
                </div>
              </td>
              <td className="py-2 text-right text-text-1">{formatCurrency(svago / monthsElapsed)}</td>
              <td className="py-2 text-right text-text-1">{formatCurrency(svago)}</td>
              <td className="py-2 text-right text-text-3">{pct(svago)}%</td>
            </tr>
            {investimenti > 0 && (
              <tr>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-income" />
                    <span className="text-text-1">Investimenti</span>
                  </div>
                </td>
                <td className="py-2 text-right text-text-1">{formatCurrency(investimenti / monthsElapsed)}</td>
                <td className="py-2 text-right text-text-1">{formatCurrency(investimenti)}</td>
                <td className="py-2 text-right text-text-3">{pct(investimenti)}%</td>
              </tr>
            )}
            {risparmi > 0 && (
              <tr>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-info" />
                    <span className="text-text-1">Risparmiato</span>
                  </div>
                </td>
                <td className="py-2 text-right text-text-1">{formatCurrency(risparmi / monthsElapsed)}</td>
                <td className="py-2 text-right text-text-1">{formatCurrency(risparmi)}</td>
                <td className="py-2 text-right text-text-3">{pct(risparmi)}%</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-subtle font-semibold">
              <td className="pt-3 text-text-2">Entrate totali</td>
              <td className="pt-3 text-right text-text-1">{formatCurrency(totale_entrate / monthsElapsed)}</td>
              <td className="pt-3 text-right text-text-1">{formatCurrency(totale_entrate)}</td>
              <td className="pt-3 text-right text-text-3">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
