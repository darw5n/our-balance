import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { TransactionsFilters } from "@/components/dashboard/transactions-filters"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { TransactionsSummary } from "@/components/dashboard/transactions-summary"
import { processRecurringTransactions } from "@/app/actions/recurring"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

async function getTransactions(
  userId: string,
  filter?: { query?: string; from?: string; to?: string; category_id?: string }
): Promise<Transaction[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("transactions")
    .select("id, date, created_at, amount, description, type, status, scope, category_id")
    .eq("user_id", userId) as any

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
  searchParams?: Promise<{ q?: string; from?: string; to?: string; category?: string }>
}) {
  const user = await getServerUser()
  const params = await searchParams

  const q = params?.q ?? ""
  const from = params?.from ?? ""
  const to = params?.to ?? ""
  const category = params?.category ?? ""

  if (user?.id) await processRecurringTransactions(user.id)

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
      const amount = tx.scope === "family" ? raw * 0.5 : raw
      if (tx.type === "income") acc.totalIncome += amount
      else acc.totalExpense += amount
      return acc
    },
    { totalIncome: 0, totalExpense: 0 }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Transazioni</h1>
        <p className="font-sans text-xs text-text-3 mt-1">Storico di tutti i tuoi movimenti.</p>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <TransactionsFilters
            q={q}
            from={from}
            to={to}
            category={category}
            categories={categories as CategoryOption[]}
          />
        </div>
        <ExportCsvButton transactions={transactions} categories={categories as CategoryOption[]} />
      </div>

      {hasFilters && (
        <TransactionsSummary income={totalIncome} expense={totalExpense} count={transactions.length} />
      )}

      <section>
        <TransactionsTable transactions={transactions} categories={categories as CategoryOption[]} />
      </section>
    </div>
  )
}
