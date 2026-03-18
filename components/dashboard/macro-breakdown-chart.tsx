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
    <Card className="border-border-subtle bg-surface-1 p-5 backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-foreground/90">Suddivisione macro-categorie</h2>
        <p className="text-xs text-text-2">
          Come si distribuiscono le entrate tra necessità, svago e risparmi.
        </p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-text-3">
          <p>Nessuna categoria ha una macro-categoria assegnata.</p>
          <Link href="/categories" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Vai a Categorie →
          </Link>
        </div>
      ) : (
        <>
          {/* Stacked horizontal bar: necessità | svago | risparmiato = 100% entrate */}
          <div className="mb-4 flex h-7 w-full overflow-hidden rounded-lg bg-surface-3">
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
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-foreground/80">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-3">
                  <th className="pb-2 text-left font-medium">Macro-categoria</th>
                  <th className="pb-2 text-right font-medium">Media/mese</th>
                  <th className="pb-2 text-right font-medium">Totale anno</th>
                  <th className="pb-2 text-right font-medium">% entrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {/* Necessità */}
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                      <span className="text-amber-400">Necessità</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-foreground/90">{formatCurrency(necessita / 12)}</td>
                  <td className="py-2 text-right text-foreground/90">{formatCurrency(necessita)}</td>
                  <td className="py-2 text-right text-text-2">{pct(necessita)}%</td>
                </tr>

                {/* Svago */}
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />
                      <span className="text-violet-400">Svago</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-foreground/90">{formatCurrency(svago / 12)}</td>
                  <td className="py-2 text-right text-foreground/90">{formatCurrency(svago)}</td>
                  <td className="py-2 text-right text-text-2">{pct(svago)}%</td>
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
                    <td className="py-2 text-right text-foreground/90">{formatCurrency(risparmi / 12)}</td>
                    <td className="py-2 text-right text-foreground/90">{formatCurrency(risparmi)}</td>
                    <td className="py-2 text-right text-text-2">{pct(risparmi)}%</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-subtle font-medium">
                  <td className="pt-3 text-foreground/80">Entrate totali</td>
                  <td className="pt-3 text-right text-foreground/90">{formatCurrency(totale_entrate / 12)}</td>
                  <td className="pt-3 text-right text-foreground/90">{formatCurrency(totale_entrate)}</td>
                  <td className="pt-3 text-right text-text-2">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
