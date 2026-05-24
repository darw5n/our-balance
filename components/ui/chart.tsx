"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"

type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

type ChartContainerProps = {
  children: React.ReactNode
  className?: string
  config: ChartConfig
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center text-xs text-text-1",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

type ChartTooltipProps = React.ComponentProps<typeof Tooltip>

function ChartTooltip(props: ChartTooltipProps) {
  return (
    <Tooltip
      cursor={{ fill: "var(--surface-hover)" }}
      contentStyle={{
        background: "var(--surface-overlay)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        color: "var(--text-1)",
        fontSize: 12,
      }}
      labelStyle={{ color: "var(--text-2)" }}
      {...props}
    />
  )
}

const ChartLegend = Legend

export {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
}

