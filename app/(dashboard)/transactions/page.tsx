import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"

async function getTransactions(
  userId: string,
  filter?: { query?: string; from?: string; to?: string }
): Promise<Transaction[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("transactions")
    .select("id, date, created_at, amount, description, type, status, category_id")
    .eq("user_id", userId) as any

  if (filter?.from) query = query.gte("date", filter.from)
  if (filter?.to) query = query.lte("date", filter.to)
  if (filter?.query) query = query.ilike("description", `%${filter.query}%`)

  const { data, error } = await query.order("date", { ascending: false })

  if (error || !data) return []
  return data as Transaction[]
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: { q?: string; from?: string; to?: string }
}) {
  const user = await getServerUser()

  const q = searchParams?.q ?? ""
  const from = searchParams?.from ?? ""
  const to = searchParams?.to ?? ""

  const [transactions, categories] = await Promise.all([
    user?.id
      ? getTransactions(user.id, {
          query: q || undefined,
          from: from || undefined,
          to: to || undefined,
        })
      : Promise.resolve([]),
    user?.id ? getCategories(user.id) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transazioni</h1>
          <p className="text-xs text-zinc-400">
            Vista lista delle tue transazioni. Filtra per data o descrizione.
          </p>
        </div>

        <form className="flex flex-wrap gap-2 text-xs" action="/transactions" method="get">
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
          />
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cerca descrizione..."
            className="h-8 w-40 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="h-8 rounded-md border border-emerald-500 bg-emerald-500 px-3 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Filtra
          </button>
        </form>
      </div>

      <section>
        <TransactionsTable transactions={transactions} categories={categories} />
      </section>
    </div>
  )
}
