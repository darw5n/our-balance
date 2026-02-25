"use client"

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { AnnualDistribution } from "@/lib/supabase/queries/analytics"

type Props = {
  data: AnnualDistribution
}

const SEGMENTS = [
  { key: "risparmi"     as const, label: "Risparmi liquidi", color: "#34d399" }, // emerald-400
  { key: "investimenti" as const, label: "Investimenti",     color: "#3b82f6" }, // blue-500
  { key: "viaggi"       as const, label: "Viaggi",           color: "#a78bfa" }, // violet-400
  { key: "altre_uscite" as const, label: "Altre uscite",     color: "#fb7185" }, // rose-400
]

export function AnnualDistributionChart({ data }: Props) {
  const { risparmi, investimenti, viaggi, altre_uscite, totale_entrate, totale_uscite } = data
  const hasData = totale_entrate > 0 || totale_uscite > 0
  const barBase = Math.max(totale_entrate, totale_uscite)

  const pct = (value: number) =>
    totale_entrate > 0 ? ((value / totale_entrate) * 100).toFixed(1) : "—"

  const rows = [
    { ...SEGMENTS[0], value: risparmi },
    { ...SEGMENTS[1], value: investimenti },
    { ...SEGMENTS[2], value: viaggi },
    { ...SEGMENTS[3], value: altre_uscite },
  ]

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Distribuzione del reddito</h2>
        <p className="text-xs text-zinc-400">
          Come si distribuisce ogni euro guadagnato: risparmi, investimenti, viaggi e spese.
        </p>
      </div>

      {!hasData ? (
        <div className="flex h-24 items-center justify-center text-xs text-zinc-500">
          Nessun dato disponibile.
        </div>
      ) : (
        <>
          {/* Stacked horizontal bar */}
          <div className="mb-3 flex h-7 w-full overflow-hidden rounded-lg bg-zinc-800">
            {rows.map((s) => {
              const width = barBase > 0 ? (s.value / barBase) * 100 : 0
              if (width <= 0) return null
              return (
                <div
                  key={s.key}
                  className="h-full transition-all"
                  style={{ width: `${width}%`, backgroundColor: s.color }}
                  title={`${s.label}: ${formatCurrency(s.value)}`}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap gap-3">
            {rows.filter((s) => s.value > 0).map((s) => (
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
                  <th className="pb-2 text-left font-medium">Voce</th>
                  <th className="pb-2 text-right font-medium">Media/mese</th>
                  <th className="pb-2 text-right font-medium">Totale anno</th>
                  <th className="pb-2 text-right font-medium">% entrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((s) => (
                  <tr key={s.key}>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                        <span style={{ color: s.color }}>{s.label}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-zinc-200">{formatCurrency(s.value / 12)}</td>
                    <td className="py-2 text-right text-zinc-200">{formatCurrency(s.value)}</td>
                    <td className="py-2 text-right text-zinc-400">{pct(s.value)}%</td>
                  </tr>
                ))}
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
