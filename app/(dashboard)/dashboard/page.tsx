import { Suspense } from "react"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations"
import { HeroBalanceCard } from "@/components/dashboard/hero-balance-card"
import { NlQuickAddBar } from "@/components/dashboard/nl-quick-add-bar"
import { UpcomingCard } from "@/components/dashboard/upcoming-card"
import { CategorySpendingCard } from "@/components/dashboard/category-spending-card"
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card"
import {
  getDashboardSummary,
  getTopCategories,
  getRecentTransactions,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import { getPendingConfirmations, getUpcomingRecurring } from "@/lib/supabase/queries/recurring"
import { processRecurringTransactions } from "@/app/actions/recurring"
import { getServerUser } from "@/lib/supabase-server"

// ─── Page ──────────────────────────────────────────────────────────────────────

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

  // Process recurring and fetch all data in parallel
  await processRecurringTransactions(user.id)

  const [summary, topCategories, recentTransactions, pendingConfirmations, upcoming] = await Promise.all([
    getDashboardSummary(user.id, viewMode),
    getTopCategories(user.id, 5, viewMode),
    getRecentTransactions(user.id, 5, viewMode),
    getPendingConfirmations(user.id),
    getUpcomingRecurring(user.id),
  ])

  const currentMonthLabel = new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })

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

      {/* Hero balance */}
      <HeroBalanceCard summary={summary} />

      {/* Quick add */}
      <NlQuickAddBar />

      {/* In scadenza */}
      {upcoming && upcoming.length > 0 && <UpcomingCard upcoming={upcoming} />}

      {/* Dove vanno i soldi */}
      {topCategories && topCategories.length > 0 && (
        <CategorySpendingCard categories={topCategories} month={currentMonthLabel} />
      )}

      {/* Movimenti recenti */}
      {recentTransactions && recentTransactions.length > 0 && (
        <RecentTransactionsCard transactions={recentTransactions} />
      )}
    </div>
  )
}
