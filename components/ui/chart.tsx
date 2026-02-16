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
          "flex h-full w-full items-center justify-center text-xs text-zinc-100",
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
      cursor={{ fill: "rgba(255,255,255,0.04)" }}
      contentStyle={{
        background: "rgba(9,9,11,0.9)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        color: "rgba(244,244,245,0.95)",
        fontSize: 12,
      }}
      labelStyle={{ color: "rgba(244,244,245,0.9)" }}
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

