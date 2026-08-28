import { TrendingDown, Calendar } from "lucide-react"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations"
import { HeroBalanceCard } from "@/components/dashboard/hero-balance-card"
import { UpcomingCard } from "@/components/dashboard/upcoming-card"
import { CategorySpendingCard } from "@/components/dashboard/category-spending-card"
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { Card } from "@/components/ui/card"
import {
  getDashboardSummary,
  getDashboardSummaryYear,
  getTopCategories,
  getRecentTransactions,
  getCashflowMonthly,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import { getPendingConfirmations, getUpcomingRecurring } from "@/lib/supabase/queries/recurring"
import { processRecurringTransactions } from "@/app/actions/recurring"
import { getServerUser } from "@/lib/supabase-server"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const viewMode: ViewMode = view === "family" ? "family" : "personal"
  const user = await getServerUser()

  if (!user) {
    return (
      <div className="space-y-3">
        <div className="pt-1 pb-2">
          <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Dashboard</h1>
          <p className="font-sans text-xs text-text-3 mt-1 mb-4">Riepilogo entrate, uscite e categorie del mese.</p>
        </div>
      </div>
    )
  }

  // Unico punto in cui le ricorrenze vengono elaborate al caricamento pagina.
  // La query è indicizzata su next_due_date e nel caso normale (niente in
  // scadenza) torna vuota subito. La logica di recupero gestisce i cicli
  // arretrati quando l'app non viene aperta per un po'.
  await processRecurringTransactions(user.id)

  const currentYear = new Date().getUTCFullYear()

  const [summary, summaryYear, topCategories, recentTransactions, pendingConfirmations, upcoming, cashflowData] =
    await Promise.all([
      getDashboardSummary(user.id, viewMode),
      getDashboardSummaryYear(user.id, viewMode, currentYear),
      getTopCategories(user.id, 5, viewMode),
      getRecentTransactions(user.id, 5, viewMode),
      getPendingConfirmations(user.id),
      getUpcomingRecurring(user.id),
      getCashflowMonthly(user.id, 12, viewMode),
    ])

  const now = new Date()
  const monthLabel = now.toLocaleDateString("it-IT", { month: "short", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase())
  const currentMonthLabel = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" })

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="pt-1 pb-2">
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Dashboard</h1>
        <p className="font-sans text-xs text-text-3 mt-1 mb-4">Riepilogo entrate, uscite e categorie del mese.</p>
        <ViewModeSwitcher currentView={viewMode} basePath="/dashboard" />
      </div>

      {/* Pending confirmations */}
      {pendingConfirmations.length > 0 && (
        <PendingConfirmations items={pendingConfirmations} />
      )}

      {/* Hero: personale → card gradiente con netto | famiglia → 2 stat card uscite */}
      {viewMode === "family" ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <span className="font-sans text-[10px] leading-snug text-text-3">Uscite questo mese</span>
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: "color-mix(in srgb, var(--expense-fg) 15%, transparent)" }}
              >
                <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--expense-fg)" }} />
              </div>
            </div>
            <p className="font-serif text-xl font-semibold text-expense-fg">
              {formatCurrency(summary.uscite)}
            </p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <span className="font-sans text-[10px] leading-snug text-text-3">Uscite da gennaio</span>
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: "color-mix(in srgb, var(--expense-fg) 15%, transparent)" }}
              >
                <Calendar className="h-3.5 w-3.5" style={{ color: "var(--expense-fg)" }} />
              </div>
            </div>
            <p className="font-serif text-xl font-semibold text-expense-fg">
              {formatCurrency(summaryYear.uscite)}
            </p>
          </Card>
        </div>
      ) : (
        <HeroBalanceCard summary={summary} monthLabel={monthLabel} />
      )}

      {/* In scadenza */}
      {upcoming.length > 0 && <UpcomingCard upcoming={upcoming} />}

      {/* Cashflow chart */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">
          {viewMode === "family" ? "Spese in comune per mese" : "Netto ultimi 12 mesi"}
        </h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">
          {viewMode === "family" ? "Andamento delle spese condivise." : "Entrate meno uscite mese per mese."}
        </p>
        <div className="mt-4">
          <CashflowChart data={cashflowData} hideIncome={viewMode === "family"} />
        </div>
      </Card>

      {/* Dove vanno i soldi */}
      {topCategories.length > 0 && (
        <CategorySpendingCard categories={topCategories} month={currentMonthLabel} />
      )}

      {/* Movimenti recenti */}
      {recentTransactions.length > 0 && (
        <RecentTransactionsCard transactions={recentTransactions} />
      )}
    </div>
  )
}
