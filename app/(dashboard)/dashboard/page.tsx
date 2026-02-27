import { Suspense } from "react"
import { BalanceCards } from "@/components/dashboard/balance-cards"
import { formatCurrency } from "@/lib/utils"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations"
import { UpcomingRecurring } from "@/components/dashboard/upcoming-recurring"
import { Card } from "@/components/ui/card"
import {
  getCashflowMonthly,
  getDashboardSummary,
  getDashboardSummaryYear,
  getTopCategories,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { getPendingConfirmations, getUpcomingRecurring } from "@/lib/supabase/queries/recurring"
import { processRecurringTransactions } from "@/app/actions/recurring"
import { getServerUser } from "@/lib/supabase-server"

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-7 w-32" />
        </div>
        <div className="skeleton h-9 w-9 !rounded-md" />
      </div>
    </Card>
  )
}

function BalanceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

function BudgetsSkeleton() {
  return (
    <Card className="border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
      <div className="mb-3 skeleton h-4 w-32 rounded" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
      <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
        <div className="mb-4 space-y-2">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-3 w-56" />
        </div>
        <div className="skeleton h-48 w-full !rounded-lg" />
      </Card>
      <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
        <div className="mb-4 space-y-2">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-3 w-56" />
        </div>
        <div className="space-y-2.5">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-10/12" />
          <div className="skeleton h-3 w-9/12" />
          <div className="skeleton h-3 w-8/12" />
        </div>
      </Card>
    </div>
  )
}

// ─── Async section components ─────────────────────────────────────────────────

async function PendingSection({ userId }: { userId: string }) {
  // Process recurring before reading pending confirmations
  await processRecurringTransactions(userId)
  const [pendingConfirmations, upcomingRecurring] = await Promise.all([
    getPendingConfirmations(userId),
    getUpcomingRecurring(userId),
  ])
  if (pendingConfirmations.length === 0 && upcomingRecurring.length === 0) return null
  return (
    <>
      <PendingConfirmations items={pendingConfirmations} />
      <UpcomingRecurring items={upcomingRecurring} />
    </>
  )
}

async function SummarySection({ userId, viewMode }: { userId: string; viewMode: ViewMode }) {
  const currentYear = new Date().getUTCFullYear()
  const [summary, summaryYTD] = await Promise.all([
    getDashboardSummary(userId, viewMode),
    getDashboardSummaryYear(userId, viewMode, currentYear),
  ])
  const hasAnyData =
    summary.entrate !== 0 ||
    summary.uscite !== 0 ||
    summary.netto !== 0 ||
    summary.pending !== 0
  return (
    <>
      {!hasAnyData && (
        <p className="text-xs text-zinc-400">
          Nessuna transazione, aggiungi la prima per iniziare a tracciare il bilancio.
        </p>
      )}
      <BalanceCards current={summary} ytdUscite={summaryYTD.uscite} viewMode={viewMode} />
    </>
  )
}

async function BudgetsSection({ userId, viewMode }: { userId: string; viewMode: ViewMode }) {
  const budgets = await getBudgetsWithProgress(userId, viewMode)
  if (budgets.length === 0) return null
  const exceededBudgets = budgets.filter((b) => b.is_exceeded)
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-100">Budget del mese</h2>
        {exceededBudgets.length > 0 && (
          <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-medium text-rose-400">
            {exceededBudgets.length}{" "}
            {exceededBudgets.length === 1 ? "budget superato" : "budget superati"}
          </span>
        )}
      </div>
      <ul className="space-y-3">
        {budgets.map((budget) => (
          <li key={budget.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: budget.category_color }}
                />
                <span className="truncate text-xs text-zinc-300">{budget.category_name}</span>
                {budget.is_exceeded && (
                  <span className="shrink-0 text-xs text-rose-400">Superato!</span>
                )}
              </div>
              <span className="shrink-0 text-xs text-zinc-400">
                {formatCurrency(budget.spent)} / {formatCurrency(budget.amount_limit)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  budget.is_exceeded || budget.percentage >= 100
                    ? "bg-rose-500"
                    : budget.percentage >= 80
                    ? "bg-amber-400"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function ChartsSection({ userId, viewMode }: { userId: string; viewMode: ViewMode }) {
  const [cashflow, topCategories] = await Promise.all([
    getCashflowMonthly(userId, 12, viewMode),
    getTopCategories(userId, 5, viewMode),
  ])
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
      <CashflowChart data={cashflow} hideIncome={viewMode === "family"} />
      <TopCategoriesChart data={topCategories} />
    </div>
  )
}

async function DialogSection({ userId }: { userId: string }) {
  const categories = await getCategories(userId)
  return <AddTransactionDialog categories={categories} />
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const viewMode: ViewMode = view === "family" ? "family" : "personal"
  const user = await getServerUser()

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-zinc-400">
              Riepilogo di entrate, uscite e categorie principali per il mese corrente.
            </p>
          </div>
          <ViewModeSwitcher currentView={viewMode} basePath="/dashboard" />
        </div>

        {user && (
          <>
            {/* Pending e upcoming — nessuno skeleton, appaiono quando pronti */}
            <Suspense fallback={null}>
              <PendingSection userId={user.id} />
            </Suspense>

            {/* Balance cards — skeleton immediato */}
            <Suspense fallback={<BalanceCardsSkeleton />}>
              <SummarySection userId={user.id} viewMode={viewMode} />
            </Suspense>

            {/* Budget — skeleton immediato */}
            <Suspense fallback={<BudgetsSkeleton />}>
              <BudgetsSection userId={user.id} viewMode={viewMode} />
            </Suspense>

            {/* Grafici — skeleton immediato */}
            <Suspense fallback={<ChartsSkeleton />}>
              <ChartsSection userId={user.id} viewMode={viewMode} />
            </Suspense>
          </>
        )}
      </div>

      {/* Dialog aggiunta transazione — carica categorie in background */}
      {user && (
        <Suspense fallback={null}>
          <DialogSection userId={user.id} />
        </Suspense>
      )}
    </>
  )
}
