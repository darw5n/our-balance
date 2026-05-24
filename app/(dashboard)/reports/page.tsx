import { ChevronLeft, ChevronRight } from "lucide-react"
import { getServerUser } from "@/lib/supabase-server"
import { Card } from "@/components/ui/card"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { MacroBreakdownChart } from "@/components/dashboard/macro-breakdown-chart"
import { YearComparisonChart } from "@/components/dashboard/year-comparison-chart"
import { CategoryMonthTable } from "@/components/dashboard/category-month-table"
import { CashflowReportChart } from "@/components/dashboard/cashflow-report-chart"
import {
  getDashboardSummaryYear,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import {
  getMacroCategoryBreakdown,
  getCashflowForYear,
  getCategoryMonthlyBreakdown,
} from "@/lib/supabase/queries/analytics"
import { processRecurringTransactions } from "@/app/actions/recurring"
import { formatCurrency } from "@/lib/utils"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string }>
}) {
  const { view, year: yearParam } = await searchParams
  const viewMode: ViewMode = view === "family" ? "family" : "personal"

  const currentUTCYear = new Date().getUTCFullYear()
  const year = yearParam ? parseInt(yearParam, 10) : currentUTCYear
  const safeYear = Number.isFinite(year) ? year : currentUTCYear
  const isCurrentYear = safeYear === currentUTCYear
  const isFutureYear = safeYear >= currentUTCYear

  const user = await getServerUser()
  if (!user) return null

  await processRecurringTransactions(user.id)

  const [summary, cashflowCurrent, cashflowPrev, macroBreakdown, categoryMonthly] =
    await Promise.all([
      getDashboardSummaryYear(user.id, viewMode, safeYear),
      getCashflowForYear(user.id, viewMode, safeYear),
      getCashflowForYear(user.id, viewMode, safeYear - 1),
      getMacroCategoryBreakdown(user.id, viewMode, safeYear),
      getCategoryMonthlyBreakdown(user.id, viewMode, safeYear),
    ])

  // Include provisional income in totals (only relevant for current year)
  const entrateTotale = summary.entrate + summary.entrate_provvisorie

  // Media uscite mensile: per anno corrente usa i mesi trascorsi
  const monthsElapsed = isCurrentYear ? new Date().getUTCMonth() + 1 : 12

  const makeUrl = (targetYear: number) => {
    const params = new URLSearchParams()
    params.set("year", String(targetYear))
    if (viewMode !== "personal") params.set("view", viewMode)
    return `/reports?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full items-center justify-between sm:w-auto sm:justify-start sm:gap-3">
          <a
            href={makeUrl(safeYear - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-3 transition-colors hover:bg-white/5 hover:text-text-1"
            aria-label={`Anno ${safeYear - 1}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <div className="text-center sm:text-left">
            <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">{safeYear}</h1>
            <p className="font-sans text-xs text-text-3 mt-1">Riepilogo entrate e uscite annuali.</p>
          </div>
          {isFutureYear ? (
            <span
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-border-subtle text-text-3"
              aria-disabled="true"
            >
              <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <a
              href={makeUrl(safeYear + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-3 transition-colors hover:bg-white/5 hover:text-text-1"
              aria-label={`Anno ${safeYear + 1}`}
            >
              <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
        <ViewModeSwitcher currentView={viewMode} basePath="/reports" extraParams={{ year: String(safeYear) }} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "Entrate anno", value: entrateTotale, colorVar: "var(--income-fg)" },
          { label: "Uscite anno", value: summary.uscite, colorVar: "var(--expense-fg)" },
          { label: "Netto anno", value: entrateTotale - summary.uscite, colorVar: "var(--info)" },
          {
            label: "Media mensile",
            value: entrateTotale > 0 ? Math.round((entrateTotale - summary.uscite) / 12) : 0,
            colorVar: "var(--pending-fg)",
          },
        ].map(({ label, value, colorVar }) => (
          <Card key={label} className="p-4">
            <p className="font-sans text-[10px] text-text-3 leading-snug mb-2">{label}</p>
            <p className="font-serif text-xl font-semibold" style={{ color: colorVar }}>
              {formatCurrency(Math.abs(value))}
            </p>
          </Card>
        ))}
      </div>

      {/* Cashflow mensile con linea netto */}
      <CashflowReportChart data={cashflowCurrent} year={safeYear} viewMode={viewMode} />

      {/* Confronto anno precedente — vicino al cashflow per continuità narrativa */}
      <YearComparisonChart currentYear={cashflowCurrent} prevYear={cashflowPrev} year={safeYear} viewMode={viewMode} />

      {/* Ripartizione macro-categorie (50-30-20) */}
      <MacroBreakdownChart data={macroBreakdown} monthsElapsed={monthsElapsed} />

      {/* Tabella mesi × categorie */}
      <CategoryMonthTable data={categoryMonthly} year={safeYear} />
    </div>
  )
}
