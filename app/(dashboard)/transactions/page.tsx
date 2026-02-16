import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  id: string
  date?: string | null
  created_at?: string | null
  amount?: number | null
  description?: string | null
  type?: string | null
  status?: string | null
}

async function getTransactions(filter?: { query?: string; from?: string; to?: string }) {
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

  let query = supabase
    .from("transactions")
    .select("id, date, created_at, amount, description, type, status", { head: false }) as any

  if (user?.id) {
    query = query.eq("user_id", user.id)
  }

  if (filter?.from) {
    query = query.gte("date", filter.from)
  }

  if (filter?.to) {
    query = query.lte("date", filter.to)
  }

  if (filter?.query) {
    query = query.ilike("description", `%${filter.query}%`)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error || !data) return []

  return data as Transaction[]
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: { q?: string; from?: string; to?: string }
}) {
  const q = searchParams?.q ?? ""
  const from = searchParams?.from ?? ""
  const to = searchParams?.to ?? ""

  const transactions = await getTransactions({
    query: q || undefined,
    from: from || undefined,
    to: to || undefined,
  })

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
        {transactions.length === 0 ? (
          <p className="text-xs text-zinc-400">Nessuna transazione trovata.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const dateValue = tx.date ?? tx.created_at
                const dateLabel = dateValue
                  ? new Date(dateValue).toLocaleDateString("it-IT")
                  : "-"
                const amount = tx.amount ?? 0
                const isNegative = (amount ?? 0) < 0
                const formattedAmount = formatCurrency(amount ?? 0)

                return (
                  <TableRow key={tx.id}>
                    <TableCell>{dateLabel}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-zinc-200">
                      {tx.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isNegative ? "text-rose-400" : "text-emerald-400"}>
                        {formattedAmount}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize text-xs text-zinc-300">
                      {tx.type || "-"}
                    </TableCell>
                    <TableCell className="capitalize text-xs text-zinc-300">
                      {tx.status || "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

