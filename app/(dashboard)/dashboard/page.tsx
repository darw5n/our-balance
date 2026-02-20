import { BalanceCards } from "@/components/dashboard/balance-cards"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  getCashflowMonthly,
  getDashboardSummary,
  getDashboardSummaryPrevMonth,
  getTopCategories,
  type DashboardSummary,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getBudgetsWithProgress, type BudgetWithProgress } from "@/lib/supabase/queries/budgets"
import { getPendingConfirmations, type RecurringTransaction } from "@/lib/supabase/queries/recurring"
import { processRecurringTransactions } from "@/app/actions/recurring"

type DashboardData = {
  summary: DashboardSummary
  summaryPrev: DashboardSummary
  cashflow: Awaited<ReturnType<typeof getCashflowMonthly>>
  topCategories: Awaited<ReturnType<typeof getTopCategories>>
  categories: Awaited<ReturnType<typeof getCategories>>
  budgets: BudgetWithProgress[]
  pendingConfirmations: RecurringTransaction[]
}

async function getDashboardData(viewMode: ViewMode): Promise<DashboardData> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // RSC: solo lettura
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const EMPTY: DashboardSummary = { entrate: 0, uscite: 0, netto: 0, pending: 0, spese_comuni: 0 }

  if (!user) {
    return {
      summary: EMPTY,
      summaryPrev: EMPTY,
      cashflow: [],
      topCategories: [],
      categories: [],
      budgets: [],
      pendingConfirmations: [],
    }
  }

  // Process due recurring transactions before fetching pending confirmations
  await processRecurringTransactions(user.id)

  const [summary, summaryPrev, cashflow, topCategories, categories, budgets, pendingConfirmations] =
    await Promise.all([
      getDashboardSummary(user.id, viewMode),
      getDashboardSummaryPrevMonth(user.id, viewMode),
      getCashflowMonthly(user.id, 12, viewMode),
      getTopCategories(user.id, 5, viewMode),
      getCategories(user.id),
      getBudgetsWithProgress(user.id, viewMode),
      getPendingConfirmations(user.id),
    ])

  return { summary, summaryPrev, cashflow, topCategories, categories, budgets, pendingConfirmations }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const viewMode: ViewMode = view === "family" ? "family" : "personal"

  const { summary, summaryPrev, cashflow, topCategories, categories, budgets, pendingConfirmations } =
    await getDashboardData(viewMode)

  const hasAnyData =
    summary.entrate !== 0 ||
    summary.uscite !== 0 ||
    summary.netto !== 0 ||
    summary.pending !== 0 ||
    cashflow.length > 0 ||
    topCategories.length > 0

  const exceededBudgets = budgets.filter((b) => b.is_exceeded)

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

        {!hasAnyData && (
          <p className="text-xs text-zinc-400">
            Nessuna transazione, aggiungi la prima per iniziare a tracciare il bilancio.
          </p>
        )}

        <PendingConfirmations items={pendingConfirmations} />

        <BalanceCards
          current={summary}
          viewMode={viewMode}
        />

        {budgets.length > 0 && (
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
                      € {budget.spent.toFixed(2)} / € {budget.amount_limit.toFixed(2)}
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
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <CashflowChart data={cashflow} />
          <TopCategoriesChart data={topCategories} />
        </div>
      </div>

      <AddTransactionDialog categories={categories} />
    </>
  )
}
