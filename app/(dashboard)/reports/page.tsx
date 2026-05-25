import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react"
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

  const nettoAnno = entrateTotale - summary.uscite
  const prevNetto = entrateTotale > 0 ? Math.round((nettoAnno / monthsElapsed) * 12) : 0

  const statCards = [
    { label: `Entrate ${safeYear}`, value: entrateTotale, colorVar: "var(--income-fg)", icon: TrendingUp },
    { label: `Uscite ${safeYear}`, value: summary.uscite, colorVar: "var(--expense-fg)", icon: TrendingDown },
    { label: `Netto ${safeYear}`, value: nettoAnno, colorVar: "var(--info)", icon: Wallet },
    { label: "Prev. netto", value: prevNetto, colorVar: "var(--pending-fg)", icon: Calendar },
  ]

  return (
    <div className="space-y-4">
      {/* Year navigation + title */}
      <div className="flex items-center justify-between">
        <a
          href={makeUrl(safeYear - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-border-subtle text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1"
          aria-label={`Anno ${safeYear - 1}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
        <div className="text-center">
          <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">{safeYear}</h1>
          <p className="font-sans text-xs text-text-3">Entrate, uscite e risparmio annuali.</p>
        </div>
        {isFutureYear ? (
          <span
            className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-[10px] border border-border-subtle text-text-3"
            aria-disabled="true"
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <a
            href={makeUrl(safeYear + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-border-subtle text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1"
            aria-label={`Anno ${safeYear + 1}`}
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* View mode toggle */}
      <ViewModeSwitcher currentView={viewMode} basePath="/reports" extraParams={{ year: String(safeYear) }} />

      {/* 4 stat cards 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {statCards.map(({ label, value, colorVar, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <span className="font-sans text-[10px] leading-snug text-text-3">{label}</span>
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: `color-mix(in srgb, ${colorVar} 15%, transparent)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: colorVar }} />
              </div>
            </div>
            <p className="font-serif text-xl font-semibold" style={{ color: colorVar }}>
              {formatCurrency(Math.abs(value))}
            </p>
            {label.startsWith("Netto") && entrateTotale > 0 && (
              <p className="mt-0.5 font-sans text-[10px] text-text-3">
                {Math.round((nettoAnno / entrateTotale) * 100)}% risparmiato
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Cashflow mensile */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Cashflow mensile {safeYear}</h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">Entrate, uscite e netto mese per mese.</p>
        <div className="mt-4">
          <CashflowReportChart data={cashflowCurrent} year={safeYear} viewMode={viewMode} />
        </div>
      </Card>

      {/* Confronto anno precedente */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Confronto anno precedente</h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">{safeYear} vs {safeYear - 1}.</p>
        <div className="mt-4">
          <YearComparisonChart currentYear={cashflowCurrent} prevYear={cashflowPrev} year={safeYear} viewMode={viewMode} />
        </div>
      </Card>

      {/* Ripartizione macro-categorie */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Dove vanno i soldi</h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">Ripartizione per macro-categoria (50-30-20).</p>
        <div className="mt-4">
          <MacroBreakdownChart data={macroBreakdown} monthsElapsed={monthsElapsed} />
        </div>
      </Card>

      {/* Tabella mesi × categorie */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Dettaglio per categoria</h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">Spese mensili per categoria.</p>
        <div className="mt-4">
          <CategoryMonthTable data={categoryMonthly} year={safeYear} />
        </div>
      </Card>
    </div>
  )
}
