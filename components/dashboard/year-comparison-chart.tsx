"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
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

const AXIS_TICK = { fill: "var(--text-3)", fontSize: 12 }
const AXIS_LINE = { stroke: "var(--border-subtle)" }
const TOOLTIP_STYLE = {
  background: "var(--surface-1)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 8,
  color: "var(--text-1)",
  fontSize: 12,
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

export function YearComparisonChart({ currentYear, prevYear, year, viewMode = "personal" }: Props) {
  const isMobile = useIsMobile()
  const isFamily = viewMode === "family"
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
    <div className="h-72 w-full">
      {!hasCurrentData ? (
        <div className="flex h-full items-center justify-center font-sans text-xs text-text-3">
          Nessun dato da visualizzare per il {year}.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
              tickFormatter={formatMonth}
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
              width={55}
              tickFormatter={(v) => formatCurrencyAxis(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-subtle)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--text-2)", fontWeight: 500 }}
              labelFormatter={(v) => MONTH_FULL[String(v).toLowerCase()] ?? v}
              formatter={(value: unknown, name?: string) => {
                const label = name === "current" ? String(year) : String(year - 1)
                return [formatCurrency(Number(value)), label]
              }}
            />
            {!isFamily && <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 3" />}
            <Legend
              wrapperStyle={{ color: "var(--text-2)", fontSize: 12 }}
              formatter={(value) => (value === "current" ? String(year) : String(year - 1))}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--text-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="prev"
              stroke="var(--text-3)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
