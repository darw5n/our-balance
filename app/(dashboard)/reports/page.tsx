import { TrendingUp, TrendingDown, Wallet, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react"
import { getServerUser } from "@/lib/supabase-server"
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
  const nettoTotale = summary.netto + summary.entrate_provvisorie

  // Previsione: solo per anno corrente parziale
  let previsione: number | null = null
  if (isCurrentYear) {
    const now = new Date()
    const currentMonthIndex = now.getUTCMonth() // 0-based
    const hasPrevData = cashflowPrev.some((p) => p.entrate > 0 || p.uscite > 0)

    if (hasPrevData) {
      // Anno precedente come baseline per la stagionalità
      const prevRemainingNetto = cashflowPrev
        .slice(currentMonthIndex + 1)
        .reduce((sum, p) => sum + p.entrate - p.uscite, 0)
      previsione = nettoTotale + prevRemainingNetto
    } else {
      // Fallback: estrapolazione lineare
      const monthsElapsed = currentMonthIndex + 1
      if (monthsElapsed > 0) {
        previsione = (nettoTotale / monthsElapsed) * 12
      }
    }
  }

  // Savings rate (solo vista personal, quando ci sono entrate)
  const savingsRate =
    viewMode === "personal" && entrateTotale > 0
      ? Math.round((nettoTotale / entrateTotale) * 100)
      : null

  // Media uscite mensile: per anno corrente usa i mesi trascorsi
  const monthsElapsed = isCurrentYear ? new Date().getUTCMonth() + 1 : 12
  const avgUscite = summary.uscite / monthsElapsed

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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label={`Anno ${safeYear - 1}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Report {safeYear}</h1>
            <p className="text-xs text-zinc-400">Riepilogo entrate e uscite per il {safeYear}.</p>
          </div>
          {isFutureYear ? (
            <span
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-white/5 text-zinc-700"
              aria-disabled="true"
            >
              <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <a
              href={makeUrl(safeYear + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
              aria-label={`Anno ${safeYear + 1}`}
            >
              <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
        <ViewModeSwitcher currentView={viewMode} basePath="/reports" extraParams={{ year: String(safeYear) }} />
      </div>

      {/* Summary cards */}
      {viewMode === "family" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Uscite {safeYear}</p>
                <p className="text-xl font-semibold text-rose-400">{formatCurrency(summary.uscite)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Uscite medio/mese</p>
                <p className="text-xl font-semibold text-amber-400">{formatCurrency(avgUscite)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <CalendarClock className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Entrate {safeYear}</p>
                <p className="text-xl font-semibold text-emerald-400">{formatCurrency(entrateTotale)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Uscite {safeYear}</p>
                <p className="text-xl font-semibold text-rose-400">{formatCurrency(summary.uscite)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Netto {safeYear}</p>
                <p className="text-xl font-semibold text-sky-400">{formatCurrency(nettoTotale)}</p>
                {savingsRate !== null && (
                  <p className="text-[10px] text-zinc-500">
                    {savingsRate > 0 ? savingsRate : 0}% delle entrate risparmiato
                  </p>
                )}
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <Wallet className="h-4 w-4 text-sky-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">
                  {isCurrentYear && previsione !== null ? "Previsione netto" : "Netto medio/mese"}
                </p>
                <p className="text-xl font-semibold text-amber-400">
                  {isCurrentYear && previsione !== null
                    ? formatCurrency(previsione)
                    : formatCurrency(nettoTotale / 12)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-1.5">
                <CalendarClock className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashflow mensile con linea netto */}
      <CashflowReportChart data={cashflowCurrent} year={safeYear} viewMode={viewMode} />

      {/* Confronto anno precedente — vicino al cashflow per continuità narrativa */}
      <YearComparisonChart currentYear={cashflowCurrent} prevYear={cashflowPrev} year={safeYear} viewMode={viewMode} />

      {/* Ripartizione macro-categorie (50-30-20) */}
      <MacroBreakdownChart data={macroBreakdown} />

      {/* Tabella mesi × categorie */}
      <CategoryMonthTable data={categoryMonthly} year={safeYear} />
    </div>
  )
}
