"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type Props = {
  currentYear: CashflowMonthlyPoint[]
  prevYear: CashflowMonthlyPoint[]
  year: number
}

type ChartPoint = {
  month: string
  current: number
  prev: number
}

export function YearComparisonChart({ currentYear, prevYear, year }: Props) {
  const data: ChartPoint[] = currentYear.map((point, i) => ({
    month: point.month,
    current: point.entrate - point.uscite,
    prev: prevYear[i] ? prevYear[i].entrate - prevYear[i].uscite : 0,
  }))

  const hasCurrentData = currentYear.some((p) => p.entrate > 0 || p.uscite > 0)

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Netto mensile: {year} vs {year - 1}</h2>
        <p className="text-xs text-zinc-400">Confronto entrate − uscite mese per mese.</p>
      </div>

      <div className="h-72 w-full">
        {!hasCurrentData ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Nessun dato da visualizzare per il {year}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(244,244,245,0.8)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tickFormatter={(v: string) => v.charAt(0).toUpperCase()}
              />
              <YAxis
                tick={{ fill: "rgba(244,244,245,0.8)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                width={55}
                tickFormatter={(v) => formatCurrencyAxis(Number(v))}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.12)" }}
                contentStyle={{
                  background: "rgba(9,9,11,0.9)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "rgba(244,244,245,0.95)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(244,244,245,0.9)" }}
                formatter={(value: unknown, name?: string) => {
                  const label = name === "current" ? String(year) : String(year - 1)
                  return [formatCurrency(Number(value)), label]
                }}
              />
              <Legend
                wrapperStyle={{ color: "rgba(244,244,245,0.85)", fontSize: 12 }}
                formatter={(value) => (value === "current" ? String(year) : String(year - 1))}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="rgba(52,211,153,0.9)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="prev"
                stroke="rgba(161,161,170,0.6)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
