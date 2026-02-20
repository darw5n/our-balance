"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { MacroBreakdown } from "@/lib/supabase/queries/analytics"

type Props = {
  data: MacroBreakdown
}

const MACRO_CONFIG = [
  { key: "necessita" as const, label: "Necessità", color: "#f59e0b", textColor: "text-amber-400", isResidual: false },
  { key: "svago" as const, label: "Svago", color: "#8b5cf6", textColor: "text-violet-400", isResidual: false },
  { key: "investimenti" as const, label: "Investimenti", color: "#3b82f6", textColor: "text-blue-400", isResidual: false },
  { key: "risparmi" as const, label: "Risparmiato", color: "#10b981", textColor: "text-emerald-400", isResidual: true },
]

export function MacroBreakdownChart({ data }: Props) {
  const { totale_entrate } = data
  const totalSpending = data.necessita + data.svago + data.investimenti
  const hasData = totale_entrate > 0 || totalSpending > 0
  // Bar base: totale_entrate so all segments (spending + residual savings) fill 100%
  const barBase = Math.max(totale_entrate, totalSpending)

  const pct = (value: number) =>
    totale_entrate > 0 ? ((value / totale_entrate) * 100).toFixed(1) : "—"

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Suddivisione macro-categorie</h2>
        <p className="text-xs text-zinc-400">
          Come si distribuiscono le entrate tra necessità, svago, investimenti e risparmi.
        </p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-zinc-500">
          <p>Nessuna categoria ha una macro-categoria assegnata.</p>
          <Link href="/categories" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Vai a Categorie →
          </Link>
        </div>
      ) : (
        <>
          {/* Stacked horizontal bar — base = totale_entrate (100%) */}
          <div className="mb-6 flex h-8 w-full overflow-hidden rounded-lg bg-zinc-800">
            {MACRO_CONFIG.map((m) => {
              const value = data[m.key]
              const width = barBase > 0 ? (value / barBase) * 100 : 0
              if (width <= 0) return null
              return (
                <div
                  key={m.key}
                  className="h-full transition-all"
                  style={{ width: `${width}%`, backgroundColor: m.color }}
                  title={`${m.label}: ${formatCurrency(value)}`}
                />
              )
            })}
          </div>

          {/* Legend pills */}
          <div className="mb-5 flex flex-wrap gap-3">
            {MACRO_CONFIG.filter((m) => data[m.key] > 0).map((m) => (
              <div key={m.key} className="flex items-center gap-1.5 text-xs text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                {m.label}
                {m.isResidual && <span className="text-zinc-500">(calcolato)</span>}
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="pb-2 text-left font-medium">Macro-categoria</th>
                  <th className="pb-2 text-right font-medium">Media/mese</th>
                  <th className="pb-2 text-right font-medium">Totale anno</th>
                  <th className="pb-2 text-right font-medium">% entrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MACRO_CONFIG.map((m) => {
                  const value = data[m.key]
                  return (
                    <tr key={m.key} className="py-1">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                          <span className={m.textColor}>{m.label}</span>
                          {m.isResidual && <span className="text-zinc-600">(residuale)</span>}
                        </div>
                      </td>
                      <td className="py-2 text-right text-zinc-200">{formatCurrency(value / 12)}</td>
                      <td className="py-2 text-right text-zinc-200">{formatCurrency(value)}</td>
                      <td className="py-2 text-right text-zinc-400">{pct(value)}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/15 font-medium">
                  <td className="pt-3 text-zinc-300">Entrate totali</td>
                  <td className="pt-3 text-right text-zinc-200">{formatCurrency(totale_entrate / 12)}</td>
                  <td className="pt-3 text-right text-zinc-200">{formatCurrency(totale_entrate)}</td>
                  <td className="pt-3 text-right text-zinc-400">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
