"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils"

type Props = {
  monthsA: number[]   // 12 valori, indice 0 = Gennaio (primo anno)
  monthsB: number[]   // 12 valori, indice 0 = Gennaio (secondo anno)
  labelA: string      // es. "2025"
  labelB: string      // es. "2026"
}

const MONTHS_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

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
