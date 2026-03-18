"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type CashflowChartProps = {
  data: CashflowMonthlyPoint[]
  hideIncome?: boolean
}

const AXIS_TICK = { fill: "rgba(244,244,245,0.8)", fontSize: 12 }
const AXIS_LINE = { stroke: "rgba(255,255,255,0.12)" }
const TOOLTIP_STYLE = {
  background: "rgba(9,9,11,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "rgba(244,244,245,0.95)",
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

export function CashflowChart({ data, hideIncome = false }: CashflowChartProps) {
  const isMobile = useIsMobile()
  const hasData = data.length > 0
  const formatMonth = (v: string) =>
    isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)

  // Compute netto for each month
  const nettoData = data.map((p) => ({
    month: p.month,
    netto: p.entrate + p.entrate_provvisorie - p.uscite,
    uscite: p.uscite,
  }))

  // Calculate where zero falls as a fraction from top (for gradient split)
  const nettoValues = nettoData.map((d) => d.netto)
  const max = Math.max(...nettoValues, 0)
  const min = Math.min(...nettoValues, 0)
  const range = max - min
  const zeroOffset = range === 0 ? 1 : max / range

  return (
    <Card className="border-border-subtle bg-surface-1 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-foreground/90">
          {hideIncome ? "Spese mensili in comune" : "Netto ultimi 12 mesi"}
        </h2>
        <p className="text-xs text-text-2">
          {hasData
            ? hideIncome
              ? "Andamento spese condivise mensili."
              : "Entrate meno uscite mese per mese."
            : "Nessuna transazione sufficiente per il grafico."}
        </p>
      </div>

      <div className="h-72 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-xs text-text-3">
            Nessun dato da visualizzare.
          </div>
        ) : hideIncome ? (
          /* Family view — bar chart of uscite */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nettoData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
              <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} width={55} tickFormatter={(v) => formatCurrencyAxis(Number(v))} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: unknown) => [formatCurrency(Number(v)), "Uscite"]}
              />
              <Bar dataKey="uscite" fill="rgba(248,113,133,0.85)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Personal view — netto area chart with green/red split */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={nettoData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nettoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(52,211,153,0.5)" />
                  <stop offset={`${zeroOffset * 100}%`} stopColor="rgba(52,211,153,0.1)" />
                  <stop offset={`${zeroOffset * 100}%`} stopColor="rgba(248,113,133,0.1)" />
                  <stop offset="100%" stopColor="rgba(248,113,133,0.5)" />
                </linearGradient>
                <linearGradient id="nettoStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={`${zeroOffset * 100}%`} stopColor="rgba(52,211,153,1)" />
                  <stop offset={`${zeroOffset * 100}%`} stopColor="rgba(248,113,133,1)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
              <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} width={55} tickFormatter={(v) => formatCurrencyAxis(Number(v))} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.12)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgba(244,244,245,0.9)", fontWeight: 500 }}
                formatter={(v: unknown) => [formatCurrency(Number(v)), "Netto"]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Area
                type="monotone"
                dataKey="netto"
                stroke="url(#nettoStroke)"
                strokeWidth={2}
                fill="url(#nettoFill)"
                dot={false}
                activeDot={{ r: 4, fill: "rgba(244,244,245,0.9)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
