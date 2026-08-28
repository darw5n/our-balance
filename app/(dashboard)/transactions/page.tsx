import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getTransactionYears, type ViewMode } from "@/lib/supabase/queries/transactions"
import { applyScope } from "@/lib/supabase/query-utils"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { TransactionsFilters } from "@/components/dashboard/transactions-filters"
import { TransactionsTabs } from "@/components/dashboard/transactions-tabs"
import { CategoryComparisonView } from "@/components/dashboard/category-comparison-view"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { TransactionsSummary } from "@/components/dashboard/transactions-summary"
import { processRecurringTransactions } from "@/app/actions/recurring"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import type { Category } from "@/lib/supabase/queries/categories"

async function getTransactions(
  userId: string,
  filter?: { query?: string; from?: string; to?: string; category_id?: string }
): Promise<Transaction[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("transactions")
    .select("id, date, created_at, amount, description, type, status, scope, category_id")
    .eq("user_id", userId)

  if (filter?.from) query = query.gte("date", filter.from)
  if (filter?.to) query = query.lte("date", filter.to)
  if (filter?.query) query = query.ilike("description", `%${filter.query}%`)
  if (filter?.category_id) query = query.eq("category_id", filter.category_id)

  const { data, error } = await query.order("date", { ascending: false })

  if (error || !data) return []
  return data as Transaction[]
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    from?: string
    to?: string
    category?: string
    tab?: string
    cat?: string
    y1?: string
    y2?: string
    view?: string
  }>
}) {
  const user = await getServerUser()
  const params = await searchParams

  const tab = params?.tab === "confronto" ? "confronto" : "lista"
  const viewMode: ViewMode = params?.view === "family" ? "family" : "personal"

  if (user?.id) await processRecurringTransactions(user.id)

  const header = (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Transazioni</h1>
        <p className="font-sans text-xs text-text-3 mt-1">Storico di tutti i tuoi movimenti.</p>
      </div>
      <TransactionsTabs active={tab} />
    </div>
  )

  // ── Tab CONFRONTO ──
  if (tab === "confronto") {
    const currentYear = new Date().getUTCFullYear()
    const [categories, availableYears]: [Category[], number[]] = user?.id
      ? await Promise.all([getCategories(user.id), getTransactionYears(user.id)])
      : [[], [currentYear]]

    const defaultY2 = availableYears[0] ?? currentYear
    const defaultY1 = availableYears[1] ?? defaultY2 - 1
    const parsedY1 = params?.y1 ? parseInt(params.y1, 10) : defaultY1
    const parsedY2 = params?.y2 ? parseInt(params.y2, 10) : defaultY2
    const y1 = Number.isFinite(parsedY1) ? parsedY1 : defaultY1
    const y2 = Number.isFinite(parsedY2) ? parsedY2 : defaultY2
    const cat = params?.cat ?? ""

    // Assicura che gli anni selezionati siano sempre tra le opzioni del selettore
    const years = Array.from(new Set([...availableYears, y1, y2])).sort((a, b) => b - a)

    return (
      <div className="space-y-6">
        {header}
        {user?.id && (
          <CategoryComparisonView
            userId={user.id}
            viewMode={viewMode}
            categories={categories}
            cat={cat}
            y1={y1}
            y2={y2}
            availableYears={years}
          />
        )}
      </div>
    )
  }

  // ── Tab LISTA (comportamento esistente) ──
  const q = params?.q ?? ""
  const from = params?.from ?? ""
  const to = params?.to ?? ""
  const category = params?.category ?? ""

  const [transactions, categories] = await Promise.all([
    user?.id
      ? getTransactions(user.id, {
          query: q || undefined,
          from: from || undefined,
          to: to || undefined,
          category_id: category || undefined,
        })
      : Promise.resolve([]),
    user?.id ? getCategories(user.id) : Promise.resolve([]),
  ])

  const hasFilters = !!(q || from || to || category)

  const { totalIncome, totalExpense } = transactions.reduce(
    (acc, tx) => {
      const raw = Math.abs(Number(tx.amount) || 0)
      const amount = applyScope(raw, tx.scope, "personal")
      if (tx.type === "income") acc.totalIncome += amount
      else acc.totalExpense += amount
      return acc
    },
    { totalIncome: 0, totalExpense: 0 }
  )

  return (
    <div className="space-y-6">
      {header}

      <TransactionsFilters
        q={q}
        from={from}
        to={to}
        category={category}
        categories={categories as CategoryOption[]}
        actions={<ExportCsvButton transactions={transactions} categories={categories as CategoryOption[]} />}
      />

      {hasFilters && (
        <TransactionsSummary income={totalIncome} expense={totalExpense} count={transactions.length} />
      )}

      <section>
        <TransactionsTable transactions={transactions} categories={categories as CategoryOption[]} />
      </section>
    </div>
  )
}
