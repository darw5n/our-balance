"use client"

import { useEffect, useState } from "react"
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
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type Props = {
  data: CashflowMonthlyPoint[]
  year: number
  viewMode?: "personal" | "family"
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

const LEGEND_LABELS: Record<string, string> = {
  entrate: "Entrate",
  entrate_provvisorie: "Provvisorie",
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
    <div className="h-72 w-full">
      {!hasData ? (
        <div className="flex h-full items-center justify-center font-sans text-xs text-text-3">
          Nessun dato da visualizzare per il {year}.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
              width={55}
              tickFormatter={(v) => formatCurrencyAxis(Number(v))}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-hover)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--text-2)", fontWeight: 500 }}
              labelFormatter={(v) => MONTH_FULL[String(v).toLowerCase()] ?? v}
              formatter={(value: unknown, name?: string) => [
                formatCurrency(Number(value)),
                LEGEND_LABELS[name as string] ?? name,
              ]}
            />
            <Legend
              wrapperStyle={{ color: "var(--text-2)", fontSize: 12 }}
              formatter={(value) => LEGEND_LABELS[value] ?? value}
            />
            {!isFamily && <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 3" />}
            {!isFamily && (
              <>
                <Bar dataKey="entrate" stackId="e" fill="var(--income-fg)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="entrate_provvisorie" stackId="e" fill="var(--income-fg)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
              </>
            )}
            <Bar dataKey="uscite" fill="var(--expense-fg)" radius={[4, 4, 0, 0]} />
            {!isFamily && (
              <Line
                type="monotone"
                dataKey="netto"
                stroke="var(--info)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--info)" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
