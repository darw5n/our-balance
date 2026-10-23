import { getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getTransactionYears, type ViewMode } from "@/lib/supabase/queries/transactions"
import {
  getTransactionList,
  getTransactionTotals,
  sumTotals,
  TRANSACTIONS_PAGE_SIZE,
  type TransactionListFilters,
} from "@/lib/supabase/queries/transaction-list"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { TransactionsFilters } from "@/components/dashboard/transactions-filters"
import { TransactionsTabs } from "@/components/dashboard/transactions-tabs"
import { CategoryComparisonView } from "@/components/dashboard/category-comparison-view"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { TransactionsSummary } from "@/components/dashboard/transactions-summary"
import { LoadMoreLink } from "@/components/dashboard/load-more-link"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import type { Category } from "@/lib/supabase/queries/categories"

// Tetto alle righe caricate in una volta: oltre conviene filtrare o esportare.
const MAX_LIMIT = 5000

/** "?limit=" dell'URL arrotondato a un multiplo della pagina, tra una pagina e il tetto. */
function parseLimit(raw?: string): number {
  const n = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(n) || n <= TRANSACTIONS_PAGE_SIZE) return TRANSACTIONS_PAGE_SIZE
  return Math.min(Math.ceil(n / TRANSACTIONS_PAGE_SIZE) * TRANSACTIONS_PAGE_SIZE, MAX_LIMIT)
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
    limit?: string
  }>
}) {
  const [user, params] = await Promise.all([getServerUser(), searchParams])

  const tab = params?.tab === "confronto" ? "confronto" : "lista"

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
    const viewMode: ViewMode = params?.view === "family" ? "family" : "personal"
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

  // ── Tab LISTA ──
  const q = params?.q ?? ""
  const from = params?.from ?? ""
  const to = params?.to ?? ""
  const category = params?.category ?? ""
  const limit = parseLimit(params?.limit)
  const filters: TransactionListFilters = {
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
    categoryId: category || undefined,
  }
  const hasFilters = !!(q || from || to || category)

  const [{ transactions, total }, categories] = await Promise.all([
    user?.id ? getTransactionList(user.id, filters, limit) : Promise.resolve({ transactions: [], total: 0 }),
    user?.id ? getCategories(user.id) : Promise.resolve([]),
  ])

  // I totali servono solo con i filtri attivi. Se la lista è già completa si sommano
  // le righe caricate, altrimenti si chiedono al database su tutte le corrispondenze.
  let totals: { income: number; expense: number } | null = null
  if (hasFilters && user?.id) {
    totals = transactions.length >= total ? sumTotals(transactions) : await getTransactionTotals(user.id, filters)
  }

  const loadMoreParams = new URLSearchParams()
  for (const [key, value] of Object.entries({ q, from, to, category })) {
    if (value) loadMoreParams.set(key, value)
  }
  loadMoreParams.set("limit", String(limit + TRANSACTIONS_PAGE_SIZE))
  const canLoadMore = transactions.length < total && limit < MAX_LIMIT

  return (
    <div className="space-y-6">
      {header}

      <TransactionsFilters
        q={q}
        from={from}
        to={to}
        category={category}
        categories={categories as CategoryOption[]}
        actions={total > 0 ? <ExportCsvButton filters={filters} /> : null}
      />

      {totals && (
        <TransactionsSummary income={totals.income} expense={totals.expense} count={total} />
      )}

      <section>
        <TransactionsTable transactions={transactions} categories={categories as CategoryOption[]} />
        {canLoadMore && (
          <LoadMoreLink
            href={`/transactions?${loadMoreParams.toString()}`}
            shown={transactions.length}
            total={total}
            step={TRANSACTIONS_PAGE_SIZE}
          />
        )}
      </section>
    </div>
  )
}
