"use client"

import dynamic from "next/dynamic"

// I grafici (recharts) arrivano in un pacchetto a parte, dopo che la pagina è già usabile.
// Il segnaposto ha la stessa altezza del grafico (h-72), così niente salti di layout.
// Solo nel browser: recharts misura il contenitore, sul server non ha dimensioni.
function ChartPlaceholder() {
  return <div className="skeleton h-72 w-full !rounded-lg" aria-hidden="true" />
}

export const CashflowChart = dynamic(
  () => import("@/components/dashboard/cashflow-chart").then((m) => m.CashflowChart),
  { ssr: false, loading: ChartPlaceholder }
)

export const CashflowReportChart = dynamic(
  () => import("@/components/dashboard/cashflow-report-chart").then((m) => m.CashflowReportChart),
  { ssr: false, loading: ChartPlaceholder }
)

export const YearComparisonChart = dynamic(
  () => import("@/components/dashboard/year-comparison-chart").then((m) => m.YearComparisonChart),
  { ssr: false, loading: ChartPlaceholder }
)

export const CategoryComparisonChart = dynamic(
  () => import("@/components/dashboard/category-comparison-chart").then((m) => m.CategoryComparisonChart),
  { ssr: false, loading: ChartPlaceholder }
)
