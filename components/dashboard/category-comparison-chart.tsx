"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { AXIS_TICK, AXIS_LINE, TOOLTIP_STYLE, MONTHS_SHORT, MONTH_FULL } from "@/components/dashboard/charts/chart-config"

type Props = {
  monthsA: number[]   // 12 valori, indice 0 = Gennaio (primo anno)
  monthsB: number[]   // 12 valori, indice 0 = Gennaio (secondo anno)
  labelA: string      // es. "2025"
  labelB: string      // es. "2026"
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduce
}

export function CategoryComparisonChart({ monthsA, monthsB, labelA, labelB }: Props) {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()

  const data = MONTHS_SHORT.map((month, i) => ({
    month,
    a: monthsA[i] ?? 0,
    b: monthsB[i] ?? 0,
  }))

  const formatMonth = (v: string) =>
    isMobile ? v.charAt(0).toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1)

  return (
    <div className="h-72 w-full">
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
            formatter={(value: unknown, name?: string) => [
              formatCurrency(Number(value)),
              name === "a" ? labelA : labelB,
            ]}
          />
          <Legend
            wrapperStyle={{ color: "var(--text-2)", fontSize: 12 }}
            formatter={(value) => (value === "a" ? labelA : labelB)}
          />
          <Line
            type="monotone"
            dataKey="a"
            name="a"
            stroke="var(--info)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={!reduce}
          />
          <Line
            type="monotone"
            dataKey="b"
            name="b"
            stroke="var(--accent-brand)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={!reduce}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
