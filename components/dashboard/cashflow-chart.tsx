"use client"

import * as React from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type CashflowChartProps = {
  data: CashflowMonthlyPoint[]
}

export function CashflowChart({ data }: CashflowChartProps) {
  const hasData = data.length > 0

  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-zinc-200">Cashflow ultimi 12 mesi</h2>
        <p className="text-xs text-zinc-400">
          {hasData ? "Andamento entrate/uscite mensili." : "Nessuna transazione sufficiente per il grafico."}
        </p>
      </div>

      <div className="h-72 w-full">
        {hasData ? (
          <ChartContainer
            config={{
              entrate: { label: "Entrate", color: "rgba(52,211,153,0.9)" },
              uscite: { label: "Uscite", color: "rgba(248,113,113,0.9)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(244,244,245,0.8)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <YAxis
                  tick={{ fill: "rgba(244,244,245,0.8)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  width={64}
                  tickFormatter={(v) => formatCurrency(Number(v))}
                />
                <ChartTooltip
                  formatter={(value: any, name: string) => {
                    const label = name === "entrate" ? "Entrate" : "Uscite"
                    return [formatCurrency(Number(value)), label]
                  }}
                />
                <ChartLegend
                  wrapperStyle={{ color: "rgba(244,244,245,0.85)", fontSize: 12 }}
                  formatter={(value) => (value === "entrate" ? "Entrate" : "Uscite")}
                />
                <Bar dataKey="entrate" fill="rgba(52,211,153,0.9)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="uscite" fill="rgba(248,113,113,0.9)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Nessun dato da visualizzare.
          </div>
        )}
      </div>
    </Card>
  )
}

