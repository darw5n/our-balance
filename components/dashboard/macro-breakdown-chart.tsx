"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { MacroBreakdown } from "@/lib/supabase/queries/analytics"

type Props = {
  data: MacroBreakdown
}

// 3 segments in the stacked bar: necessità | svago | risparmiato
const BAR_SEGMENTS = [
  { key: "necessita" as const, label: "Necessità",   color: "#f59e0b" },
  { key: "svago"     as const, label: "Svago",        color: "#8b5cf6" },
  { key: "risparmi"  as const, label: "Risparmiato",  color: "#10b981" },
]

export function MacroBreakdownChart({ data }: Props) {
  const { totale_entrate, necessita, svago, investimenti, risparmi } = data
  const hasData = totale_entrate > 0 || (necessita + svago + investimenti) > 0
  const barBase = Math.max(totale_entrate, necessita + svago)

  const pct = (value: number) =>
    totale_entrate > 0 ? ((value / totale_entrate) * 100).toFixed(1) : "—"

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Suddivisione macro-categorie</h2>
        <p className="text-xs text-zinc-400">
          Come si distribuiscono le entrate tra necessità, svago e risparmi.
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
          {/* Stacked horizontal bar: necessità | svago | risparmiato = 100% entrate */}
          <div className="mb-4 flex h-7 w-full overflow-hidden rounded-lg bg-zinc-800">
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
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
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
                {/* Necessità */}
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                      <span className="text-amber-400">Necessità</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-zinc-200">{formatCurrency(necessita / 12)}</td>
                  <td className="py-2 text-right text-zinc-200">{formatCurrency(necessita)}</td>
                  <td className="py-2 text-right text-zinc-400">{pct(necessita)}%</td>
                </tr>

                {/* Svago */}
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />
                      <span className="text-violet-400">Svago</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-zinc-200">{formatCurrency(svago / 12)}</td>
                  <td className="py-2 text-right text-zinc-200">{formatCurrency(svago)}</td>
                  <td className="py-2 text-right text-zinc-400">{pct(svago)}%</td>
                </tr>

                {/* Risparmiato totale */}
                {risparmi > 0 && (
                  <tr>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                        <span className="text-emerald-400">Risparmiato</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-zinc-200">{formatCurrency(risparmi / 12)}</td>
                    <td className="py-2 text-right text-zinc-200">{formatCurrency(risparmi)}</td>
                    <td className="py-2 text-right text-zinc-400">{pct(risparmi)}%</td>
                  </tr>
                )}
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
