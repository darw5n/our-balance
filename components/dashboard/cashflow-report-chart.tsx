"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
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
  viewMode?: "personal" | "family"
}

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    axisTick: { fill: dark ? "rgba(244,244,245,0.8)" : "rgba(0,0,0,0.6)", fontSize: 12 as const },
    axisLine: { stroke: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" },
    gridStroke: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    refLine: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    legendStyle: { color: dark ? "rgba(244,244,245,0.85)" : "rgba(0,0,0,0.7)", fontSize: 12 },
    tooltipStyle: {
      background: dark ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.97)",
      border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
      borderRadius: 8,
      color: dark ? "rgba(244,244,245,0.95)" : "rgba(0,0,0,0.85)",
      fontSize: 12,
    },
    labelStyle: { color: dark ? "rgba(244,244,245,0.9)" : "rgba(0,0,0,0.8)", fontWeight: 500 as const },
  }
}

const LEGEND_LABELS: Record<string, string> = {
  entrate: "Entrate",
  uscite: "Uscite",
  netto: "Netto",
}

const MONTH_FULL: Record<string, string> = {
  gen: "Gennaio", feb: "Febbraio", mar: "Marzo", apr: "Aprile",
  mag: "Maggio", giu: "Giugno", lug: "Luglio", ago: "Agosto",
  set: "Settembre", ott: "Ottobre", nov: "Novembre", dic: "Dicembre",
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

export function CashflowReportChart({ data, year, viewMode = "personal" }: Props) {
  const isMobile = useIsMobile()
  const { axisTick, axisLine, gridStroke, refLine, legendStyle, tooltipStyle, labelStyle } = useChartTheme()
  const formatMonth = (v: string) => isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)

  const isFamily = viewMode === "family"

  const chartData = data.map((p) => ({
    month: p.month,
    entrate: p.entrate,
    uscite: p.uscite,
    entrate_provvisorie: p.entrate_provvisorie,
    netto: p.entrate + p.entrate_provvisorie - p.uscite,
  }))

  const hasData = data.some((p) => p.entrate > 0 || p.uscite > 0)

  return (
    <Card className="border-border-subtle bg-surface-1 p-5 backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-foreground/90">
          {isFamily ? `Uscite mensili ${year}` : `Cashflow mensile ${year}`}
        </h2>
        <p className="text-xs text-text-2">
          {isFamily ? "Spese in comune mese per mese." : "Entrate, uscite e netto mese per mese."}
        </p>
      </div>

      <div className="h-72 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-xs text-text-3">
            Nessun dato da visualizzare per il {year}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={axisLine} tickLine={axisLine} tickFormatter={formatMonth} />
              <YAxis
                tick={axisTick}
                axisLine={axisLine}
                tickLine={axisLine}
                width={55}
                tickFormatter={(v) => formatCurrencyAxis(Number(v))}
              />
              <Tooltip
                cursor={{ fill: "rgba(128,128,128,0.07)" }}
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(v) => MONTH_FULL[String(v).toLowerCase()] ?? v}
                formatter={(value: unknown, name?: string) => [
                  formatCurrency(Number(value)),
                  name === "entrate_provvisorie" ? "Provvisorie" : (LEGEND_LABELS[name as string] ?? name),
                ]}
              />
              <Legend
                wrapperStyle={legendStyle}
                formatter={(value) => LEGEND_LABELS[value] ?? value}
              />
              {!isFamily && <ReferenceLine y={0} stroke={refLine} strokeDasharray="4 3" />}
              {!isFamily && (
                <>
                  <Bar dataKey="entrate" stackId="e" fill="rgba(52,211,153,0.85)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="entrate_provvisorie" stackId="e" fill="rgba(52,211,153,0.3)" radius={[4, 4, 0, 0]} />
                </>
              )}
              <Bar dataKey="uscite" fill="rgba(251,113,133,0.85)" radius={[4, 4, 0, 0]} />
              {!isFamily && (
                <Line
                  type="monotone"
                  dataKey="netto"
                  stroke="rgba(56,189,248,0.9)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "rgba(56,189,248,0.9)" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
