import { BalanceCards } from "@/components/dashboard/balance-cards"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  getCashflowMonthly,
  getDashboardSummary,
  getTopCategories,
  type DashboardSummary,
} from "@/lib/supabase/queries/transactions"

type DashboardData = {
  summary: DashboardSummary
  cashflow: Awaited<ReturnType<typeof getCashflowMonthly>>
  topCategories: Awaited<ReturnType<typeof getTopCategories>>
}

async function getDashboardData(): Promise<DashboardData> {
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

  if (!user) {
    return {
      summary: { entrate: 0, uscite: 0, netto: 0, pending: 0 },
      cashflow: [],
      topCategories: [],
    }
  }

  const [summary, cashflow, topCategories] = await Promise.all([
    getDashboardSummary(user.id, "personal"),
    getCashflowMonthly(user.id, 12),
    getTopCategories(user.id, 5),
  ])

  return { summary, cashflow, topCategories }
}

export default async function DashboardPage() {
  const { summary, cashflow, topCategories } = await getDashboardData()

  const hasAnyData =
    summary.entrate !== 0 ||
    summary.uscite !== 0 ||
    summary.netto !== 0 ||
    summary.pending !== 0 ||
    cashflow.length > 0 ||
    topCategories.length > 0

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-zinc-400">
              Riepilogo di entrate, uscite e categorie principali per il mese corrente.
            </p>
          </div>

          {!hasAnyData && (
            <p className="text-xs text-zinc-400">
              Nessuna transazione, aggiungi la prima per iniziare a tracciare il bilancio.
            </p>
          )}
        </div>

        <BalanceCards
          entrate={summary.entrate}
          uscite={summary.uscite}
          netto={summary.netto}
          pending={summary.pending}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <CashflowChart data={cashflow} />
          <TopCategoriesChart data={topCategories} />
        </div>
      </div>

      <AddTransactionDialog />
    </>
  )
}

