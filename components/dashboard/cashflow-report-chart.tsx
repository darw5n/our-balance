"use client"

import { useEffect, useState } from "react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type Props = {
  data: CashflowMonthlyPoint[]
  year: number
}

const TOOLTIP_STYLE = {
  background: "rgba(9,9,11,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "rgba(244,244,245,0.95)",
  fontSize: 12,
}

const AXIS_TICK = { fill: "rgba(244,244,245,0.8)", fontSize: 12 }
const AXIS_LINE = { stroke: "rgba(255,255,255,0.12)" }

const LEGEND_LABELS: Record<string, string> = {
  entrate: "Entrate",
  uscite: "Uscite",
  netto: "Netto",
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export function CashflowReportChart({ data, year }: Props) {
  const isMobile = useIsMobile()
  const formatMonth = (v: string) => isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)
  const chartData = data.map((p) => ({
    month: p.month,
    entrate: p.entrate,
    uscite: p.uscite,
    netto: p.entrate - p.uscite,
  }))

  const hasData = data.some((p) => p.entrate > 0 || p.uscite > 0)

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Cashflow mensile {year}</h2>
        <p className="text-xs text-zinc-400">Entrate, uscite e netto mese per mese.</p>
      </div>

      <div className="h-72 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Nessun dato da visualizzare per il {year}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
              <YAxis
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={AXIS_LINE}
                width={55}
                tickFormatter={(v) => formatCurrencyAxis(Number(v))}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgba(244,244,245,0.9)" }}
                formatter={(value: unknown, name?: string) => [
                  formatCurrency(Number(value)),
                  LEGEND_LABELS[name as string] ?? name,
                ]}
              />
              <Legend
                wrapperStyle={{ color: "rgba(244,244,245,0.85)", fontSize: 12 }}
                formatter={(value) => LEGEND_LABELS[value] ?? value}
              />
              <Bar dataKey="entrate" fill="rgba(52,211,153,0.85)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uscite" fill="rgba(251,113,133,0.85)" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="netto"
                stroke="rgba(56,189,248,0.9)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "rgba(56,189,248,0.9)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
