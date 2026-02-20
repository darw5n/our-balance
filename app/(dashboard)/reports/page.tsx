import Link from "next/link"
import { getServerUser } from "@/lib/supabase-server"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart"
import { MacroBreakdownChart } from "@/components/dashboard/macro-breakdown-chart"
import { YearComparisonChart } from "@/components/dashboard/year-comparison-chart"
import {
  getCashflowMonthly,
  getTopCategories,
  getDashboardSummaryYear,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import {
  getMacroCategoryBreakdown,
  getCashflowForYear,
} from "@/lib/supabase/queries/analytics"
import { formatCurrency } from "@/lib/utils"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string }>
}) {
  const { view, year: yearParam } = await searchParams
  const viewMode: ViewMode = view === "family" || view === "both" ? (view as ViewMode) : "personal"

  const currentUTCYear = new Date().getUTCFullYear()
  const year = yearParam ? parseInt(yearParam, 10) : currentUTCYear
  const safeYear = Number.isFinite(year) ? year : currentUTCYear
  const isCurrentYear = safeYear === currentUTCYear

  const user = await getServerUser()
  if (!user) return null

  const [summary, cashflowCurrent, cashflowPrev, cashflow12, topCategories, macroBreakdown] =
    await Promise.all([
      getDashboardSummaryYear(user.id, viewMode, safeYear),
      getCashflowForYear(user.id, viewMode, safeYear),
      getCashflowForYear(user.id, viewMode, safeYear - 1),
      getCashflowMonthly(user.id, 12, viewMode),
      getTopCategories(user.id, 5, viewMode),
      getMacroCategoryBreakdown(user.id, viewMode, safeYear),
    ])

  // Forecast: only for current partial year
  let previsione: number | null = null
  if (isCurrentYear) {
    const now = new Date()
    const monthsElapsed = now.getUTCMonth() + 1 // 1-12

    // Count months that have actual data
    const monthsWithData = cashflowCurrent.filter((p) => p.entrate > 0 || p.uscite > 0).length
    const divisor = monthsWithData > 0 ? monthsWithData : monthsElapsed

    if (divisor > 0 && summary.uscite > 0) {
      previsione = (summary.netto / divisor) * 12
    }
  }

  const prevYearUrl = (v: string) => {
    const params = new URLSearchParams()
    params.set("year", String(safeYear - 1))
    if (v !== "personal") params.set("view", v)
    return `/reports?${params.toString()}`
  }

  const nextYearUrl = (v: string) => {
    const params = new URLSearchParams()
    params.set("year", String(safeYear + 1))
    if (v !== "personal") params.set("view", v)
    return `/reports?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={prevYearUrl(viewMode)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label={`Anno ${safeYear - 1}`}
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Report {safeYear}</h1>
            <p className="text-xs text-zinc-400">Riepilogo entrate e uscite per il {safeYear}.</p>
          </div>
          <Link
            href={nextYearUrl(viewMode)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label={`Anno ${safeYear + 1}`}
          >
            →
          </Link>
        </div>
        <ViewModeSwitcher currentView={viewMode} basePath="/reports" extraParams={{ year: String(safeYear) }} />
      </div>

      {/* Summary cards */}
      <div className={`grid gap-3 ${previsione !== null ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Entrate {safeYear}</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">{formatCurrency(summary.entrate)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Uscite {safeYear}</p>
          <p className="mt-1 text-xl font-semibold text-rose-400">{formatCurrency(summary.uscite)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Netto {safeYear}</p>
          <p className={`mt-1 text-xl font-semibold ${summary.netto >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(summary.netto)}
          </p>
        </div>
        {previsione !== null && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Previsione netto</p>
            <p className={`mt-1 text-xl font-semibold ${previsione >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(previsione)}
            </p>
          </div>
        )}
      </div>

      {/* Year comparison */}
      <YearComparisonChart currentYear={cashflowCurrent} prevYear={cashflowPrev} year={safeYear} />

      {/* Macro breakdown */}
      <MacroBreakdownChart data={macroBreakdown} />

      {/* Cashflow + top categories */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <CashflowChart data={cashflow12} />
        <TopCategoriesChart data={topCategories} />
      </div>
    </div>
  )
}
