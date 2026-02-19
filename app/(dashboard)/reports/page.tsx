import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart"
import {
  getCashflowMonthly,
  getTopCategories,
  getDashboardSummaryYear,
  type ViewMode,
} from "@/lib/supabase/queries/transactions"
import { formatCurrency } from "@/lib/utils"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const viewMode: ViewMode = view === "family" || view === "both" ? (view as ViewMode) : "personal"
  const year = 2026

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [summary, cashflow, topCategories] = await Promise.all([
    getDashboardSummaryYear(user.id, viewMode, year),
    getCashflowMonthly(user.id, 12, viewMode),
    getTopCategories(user.id, 5, viewMode),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
          <p className="text-xs text-zinc-400">Riepilogo annuale entrate e uscite per il {year}.</p>
        </div>
        <ViewModeSwitcher currentView={viewMode} basePath="/reports" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Entrate {year}</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">{formatCurrency(summary.entrate)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Uscite {year}</p>
          <p className="mt-1 text-xl font-semibold text-rose-400">{formatCurrency(summary.uscite)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
          <p className="text-xs text-zinc-400">Saldo {year}</p>
          <p className={`mt-1 text-xl font-semibold ${summary.netto >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(summary.netto)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <CashflowChart data={cashflow} />
        <TopCategoriesChart data={topCategories} />
      </div>
    </div>
  )
}
