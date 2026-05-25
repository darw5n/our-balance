import { Users2 } from "lucide-react"
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

  await processRecurringTransactions(user.id)

  const [summary, topCategories, recentTransactions, pendingConfirmations, upcoming, cashflowData] =
    await Promise.all([
      getDashboardSummary(user.id, viewMode),
      getTopCategories(user.id, 5, viewMode),
      getRecentTransactions(user.id, 5, viewMode),
      getPendingConfirmations(user.id),
      getUpcomingRecurring(user.id),
      getCashflowMonthly(user.id, 12, viewMode),
    ])

  const now = new Date()
  const monthLabel = now.toLocaleDateString("it-IT", { month: "short", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase())  // "Mag 2026"
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

      {/* Hero balance card */}
      <HeroBalanceCard summary={summary} monthLabel={monthLabel} />

      {/* Spese in comune — mini-card, solo in vista personal quando presenti */}
      {summary.spese_comuni > 0 && (
        <Card className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                style={{ background: "color-mix(in srgb, var(--shared) 15%, transparent)" }}
              >
                <Users2 className="h-4 w-4" style={{ color: "var(--shared)" }} />
              </div>
              <div>
                <p className="font-sans text-[10px] text-text-3">Spese in comune</p>
                <p className="font-serif text-[17px] font-semibold" style={{ color: "var(--shared)" }}>
                  {formatCurrency(summary.spese_comuni / 2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-sans text-[10px] text-text-3">La mia quota (50%)</p>
              <p className="font-sans text-sm text-text-2">
                Totale {formatCurrency(summary.spese_comuni)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* In scadenza */}
      {upcoming.length > 0 && <UpcomingCard upcoming={upcoming} />}

      {/* Netto ultimi 12 mesi */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">
          {viewMode === "family" ? "Spese mensili in comune" : "Netto ultimi 12 mesi"}
        </h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">
          {viewMode === "family" ? "Andamento spese condivise mensili." : "Entrate meno uscite mese per mese."}
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
