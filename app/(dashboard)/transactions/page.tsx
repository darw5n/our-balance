import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"

async function getTransactions(
  userId: string,
  filter?: { query?: string; from?: string; to?: string; category_id?: string }
): Promise<Transaction[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("transactions")
    .select("id, date, created_at, amount, description, type, status, category_id")
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transazioni</h1>
          <p className="text-xs text-zinc-400">
            Vista lista delle tue transazioni. Filtra per data, descrizione o categoria.
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
            className="h-8 w-36 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none placeholder:text-zinc-500"
          />
          <select
            name="category"
            defaultValue={category}
            className="h-8 rounded-md border border-white/15 bg-zinc-950 px-2 text-xs text-zinc-50 outline-none"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-8 rounded-md border border-emerald-500 bg-emerald-500 px-3 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Filtra
          </button>
          {(q || from || to || category) && (
            <a
              href="/transactions"
              className="flex h-8 items-center rounded-md border border-white/15 px-3 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              Reset
            </a>
          )}
        </form>
      </div>

      <section>
        <TransactionsTable transactions={transactions} categories={categories} />
      </section>
    </div>
  )
}
