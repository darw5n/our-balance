"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type Props = {
  currentYear: CashflowMonthlyPoint[]
  prevYear: CashflowMonthlyPoint[]
  year: number
  viewMode?: "personal" | "family"
}

type ChartPoint = {
  month: string
  current: number
  prev: number
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
      background: dark ? "rgba(9,9,11,0.9)" : "rgba(255,255,255,0.97)",
      border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
      borderRadius: 8,
      color: dark ? "rgba(244,244,245,0.95)" : "rgba(0,0,0,0.85)",
      fontSize: 12,
    },
    labelStyle: { color: dark ? "rgba(244,244,245,0.9)" : "rgba(0,0,0,0.8)", fontWeight: 500 as const },
    currentLineColor: dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
    prevLineColor: dark ? "rgba(161,161,170,0.45)" : "rgba(0,0,0,0.25)",
  }
}

export function YearComparisonChart({ currentYear, prevYear, year, viewMode = "personal" }: Props) {
  const isMobile = useIsMobile()
  const isFamily = viewMode === "family"
  const { axisTick, axisLine, gridStroke, refLine, legendStyle, tooltipStyle, labelStyle, currentLineColor, prevLineColor } = useChartTheme()
  const formatMonth = (v: string) => isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)

  const data: ChartPoint[] = currentYear.map((point, i) => ({
    month: point.month,
    current: isFamily ? point.uscite : point.entrate + point.entrate_provvisorie - point.uscite,
    prev: prevYear[i]
      ? isFamily ? prevYear[i].uscite : prevYear[i].entrate + prevYear[i].entrate_provvisorie - prevYear[i].uscite
      : 0,
  }))

  const hasCurrentData = currentYear.some((p) => p.entrate > 0 || p.uscite > 0)

  return (
    <Card className="border-border-subtle bg-surface-1 p-5 backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-foreground/90">
          {isFamily ? `Uscite mensili: ${year} vs ${year - 1}` : `Netto mensile: ${year} vs ${year - 1}`}
        </h2>
        <p className="text-xs text-text-2">
          {isFamily ? "Confronto spese mese per mese." : "Confronto entrate − uscite mese per mese."}
        </p>
      </div>

      <div className="h-72 w-full">
        {!hasCurrentData ? (
          <div className="flex h-full items-center justify-center text-xs text-text-3">
            Nessun dato da visualizzare per il {year}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="month"
                tick={axisTick}
                axisLine={axisLine}
                tickLine={axisLine}
                tickFormatter={formatMonth}
              />
              <YAxis
                tick={axisTick}
                axisLine={axisLine}
                tickLine={axisLine}
                width={55}
                tickFormatter={(v) => formatCurrencyAxis(Number(v))}
              />
              <Tooltip
                cursor={{ stroke: "rgba(128,128,128,0.15)" }}
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(v) => MONTH_FULL[String(v).toLowerCase()] ?? v}
                formatter={(value: unknown, name?: string) => {
                  const label = name === "current" ? String(year) : String(year - 1)
                  return [formatCurrency(Number(value)), label]
                }}
              />
              {!isFamily && <ReferenceLine y={0} stroke={refLine} strokeDasharray="4 3" />}
              <Legend
                wrapperStyle={legendStyle}
                formatter={(value) => (value === "current" ? String(year) : String(year - 1))}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke={currentLineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="prev"
                stroke={prevLineColor}
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
