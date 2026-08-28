"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { AXIS_TICK, AXIS_LINE, TOOLTIP_STYLE } from "@/components/dashboard/charts/chart-config"
import type { CashflowMonthlyPoint } from "@/lib/supabase/queries/transactions"

type CashflowChartProps = {
  data: CashflowMonthlyPoint[]
  hideIncome?: boolean
}

export function CashflowChart({ data, hideIncome = false }: CashflowChartProps) {
  const isMobile = useIsMobile()
  const hasData = data.length > 0
  const formatMonth = (v: string) =>
    isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)

  const nettoData = data.map((p) => ({
    month: p.month,
    netto: p.entrate + p.entrate_provvisorie - p.uscite,
    uscite: p.uscite,
  }))

  const nettoValues = nettoData.map((d) => d.netto)
  const max = Math.max(...nettoValues, 0)
  const min = Math.min(...nettoValues, 0)
  const range = max - min
  const zeroOffset = range === 0 ? 1 : max / range

  return (
    <div className="h-72 w-full">
      {!hasData ? (
        <div className="flex h-full items-center justify-center font-sans text-xs text-text-3">
          Nessun dato disponibile.
        </div>
      ) : hideIncome ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={nettoData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="usciteFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense-fg)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--expense-fg)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
            <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} width={55} tickFormatter={(v) => formatCurrencyAxis(Number(v))} />
            <Tooltip
              cursor={{ stroke: "var(--border-subtle)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--text-2)", fontWeight: 500 }}
              formatter={(v: unknown) => [formatCurrency(Number(v)), "Uscite"]}
            />
            <Area
              type="monotone"
              dataKey="uscite"
              stroke="var(--expense-fg)"
              strokeWidth={2}
              fill="url(#usciteFill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--expense-fg)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={nettoData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nettoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--income-fg)" stopOpacity={0.4} />
                <stop offset={`${zeroOffset * 100}%`} stopColor="var(--income-fg)" stopOpacity={0.08} />
                <stop offset={`${zeroOffset * 100}%`} stopColor="var(--expense-fg)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--expense-fg)" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="nettoStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={`${zeroOffset * 100}%`} stopColor="var(--income-fg)" />
                <stop offset={`${zeroOffset * 100}%`} stopColor="var(--expense-fg)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={formatMonth} />
            <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} width={55} tickFormatter={(v) => formatCurrencyAxis(Number(v))} />
            <Tooltip
              cursor={{ stroke: "var(--border-subtle)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--text-2)", fontWeight: 500 }}
              formatter={(v: unknown) => [formatCurrency(Number(v)), "Netto"]}
            />
            <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 3" />
            <Area
              type="monotone"
              dataKey="netto"
              stroke="url(#nettoStroke)"
              strokeWidth={2}
              fill="url(#nettoFill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--text-1)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
