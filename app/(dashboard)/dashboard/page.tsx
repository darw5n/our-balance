import { TrendingUp, TrendingDown, Wallet, Users2 } from "lucide-react"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations"
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

  const currentMonthLabel = new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })
  const entrateTotale = summary.entrate + summary.entrate_provvisorie
  const nettoMese = summary.entrate - summary.uscite
  const savingsRate = entrateTotale > 0 ? nettoMese / entrateTotale : 0
  const savingsBadge =
    nettoMese < 0
      ? { label: "Deficit", color: "var(--expense-fg)" }
      : savingsRate >= 0.2
      ? { label: "Ottimo", color: "var(--income-fg)" }
      : savingsRate >= 0.1
      ? { label: "Buono", color: "var(--info)" }
      : { label: "Attenzione", color: "var(--pending-fg)" }

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

      {/* In scadenza */}
      {upcoming.length > 0 && <UpcomingCard upcoming={upcoming} />}

      {/* 4 stat cards 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Entrate mese */}
        <Card className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <span className="font-sans text-[10px] leading-snug text-text-3">Entrate mese</span>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "color-mix(in srgb, var(--income-fg) 15%, transparent)" }}
            >
              <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--income-fg)" }} />
            </div>
          </div>
          <p className="font-serif text-xl font-semibold" style={{ color: "var(--income-fg)" }}>
            {formatCurrency(entrateTotale)}
          </p>
          {summary.entrate_provvisorie > 0 && (
            <p className="mt-0.5 font-sans text-[10px] text-text-3">
              di cui {formatCurrency(summary.entrate_provvisorie)} provvisori
            </p>
          )}
        </Card>

        {/* Uscite mese */}
        <Card className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <span className="font-sans text-[10px] leading-snug text-text-3">Uscite mese</span>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "color-mix(in srgb, var(--expense-fg) 15%, transparent)" }}
            >
              <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--expense-fg)" }} />
            </div>
          </div>
          <p className="font-serif text-xl font-semibold" style={{ color: "var(--expense-fg)" }}>
            {formatCurrency(summary.uscite)}
          </p>
        </Card>

        {/* Netto mese */}
        <Card className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <span className="font-sans text-[10px] leading-snug text-text-3">Netto mese</span>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "color-mix(in srgb, var(--info) 15%, transparent)" }}
            >
              <Wallet className="h-3.5 w-3.5" style={{ color: "var(--info)" }} />
            </div>
          </div>
          <p className="font-serif text-xl font-semibold" style={{ color: "var(--info)" }}>
            {formatCurrency(Math.abs(nettoMese))}
          </p>
          {entrateTotale > 0 && (
            <p className="mt-0.5 font-sans text-[10px] font-medium" style={{ color: savingsBadge.color }}>
              {savingsBadge.label}
            </p>
          )}
        </Card>

        {/* Spese in comune — solo in vista personal quando presenti */}
        {summary.spese_comuni > 0 && (
          <Card className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <span className="font-sans text-[10px] leading-snug text-text-3">Spese in comune</span>
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: "color-mix(in srgb, var(--shared) 15%, transparent)" }}
              >
                <Users2 className="h-3.5 w-3.5" style={{ color: "var(--shared)" }} />
              </div>
            </div>
            <p className="font-serif text-xl font-semibold" style={{ color: "var(--shared)" }}>
              {formatCurrency(summary.spese_comuni / 2)}
            </p>
            <p className="mt-0.5 font-sans text-[10px] text-text-3">
              La mia quota · Totale {formatCurrency(summary.spese_comuni)}
            </p>
          </Card>
        )}
      </div>

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
