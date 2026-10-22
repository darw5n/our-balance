import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { applyScope, ilikeContainsLiteral, toNumber } from "@/lib/supabase/query-utils"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"

/** Filtri della lista transazioni, come arrivano dall'URL. */
export type TransactionListFilters = {
  q?: string
  from?: string
  to?: string
  categoryId?: string
}

export const TRANSACTIONS_PAGE_SIZE = 100

// Supabase restituisce al massimo 1.000 righe per richiesta: oltre si legge a blocchi.
const BATCH_SIZE = 1000

const LIST_COLUMNS = "id, date, created_at, amount, description, type, status, scope, category_id"

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

/**
 * Id delle categorie il cui nome contiene il testo cercato: la ricerca libera
 * trova una transazione sia per descrizione sia per nome della categoria.
 */
async function categoryIdsMatching(userId: string, q: string): Promise<string[]> {
  const needle = q.toLowerCase()
  const categories = await getCategories(userId)
  return categories.filter((c) => c.name.toLowerCase().includes(needle)).map((c) => c.id)
}

/**
 * Query sulle transazioni dell'utente con i filtri applicati, ordinata dalla più recente.
 * Sincrona di proposito: il builder di Supabase è "thenable", e restituirlo da una
 * funzione async lo eseguirebbe subito.
 */
function buildFilteredQuery(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
  filters: TransactionListFilters,
  searchCategoryIds: string[],
  options?: { count?: "exact" }
) {
  let query = supabase.from("transactions").select(columns, options).eq("user_id", userId)

  if (filters.from) query = query.gte("date", filters.from)
  if (filters.to) query = query.lte("date", filters.to)
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId)

  const q = filters.q?.trim()
  if (q) {
    const byDescription = `description.ilike.${ilikeContainsLiteral(q)}`
    query = searchCategoryIds.length
      ? query.or(`${byDescription},category_id.in.(${searchCategoryIds.join(",")})`)
      : query.or(byDescription)
  }

  // L'id come ultimo criterio rende l'ordine stabile tra un blocco e l'altro.
  return query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
}

/** Legge fino a `limit` righe a blocchi da 1.000. Il conteggio, se chiesto, viene dal primo blocco. */
async function fetchInBatches<T>(
  userId: string,
  columns: string,
  filters: TransactionListFilters,
  limit: number,
  withCount = false
): Promise<{ rows: T[]; total: number | null; failed: boolean }> {
  const q = filters.q?.trim()
  const [supabase, searchCategoryIds] = await Promise.all([
    createSupabaseServerClient(),
    q ? categoryIdsMatching(userId, q) : Promise.resolve([]),
  ])
  const rows: T[] = []
  let total: number | null = null
  let failed = false

  while (rows.length < limit) {
    const start = rows.length
    const end = Math.min(start + BATCH_SIZE, limit) - 1
    const isFirst = start === 0
    const { data, error, count } = await buildFilteredQuery(
      supabase,
      userId,
      columns,
      filters,
      searchCategoryIds,
      withCount && isFirst ? { count: "exact" } : undefined
    ).range(start, end)

    if (error) {
      console.error("[transaction-list] error:", error)
      failed = true
      break
    }
    if (isFirst && withCount) total = count ?? null

    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < end - start + 1) break
  }

  return { rows, total, failed }
}

/** Prime `limit` transazioni che rispettano i filtri, più il totale delle corrispondenze. */
export const getTransactionList = cache(async function getTransactionList(
  userId: string,
  filters: TransactionListFilters,
  limit: number
): Promise<{ transactions: Transaction[]; total: number }> {
  if (!userId) return { transactions: [], total: 0 }
  const { rows, total } = await fetchInBatches<Transaction>(userId, LIST_COLUMNS, filters, limit, true)
  return { transactions: rows, total: total ?? rows.length }
})

/** Entrate e uscite (in vista personale) di tutte le transazioni che rispettano i filtri. */
export async function getTransactionTotals(
  userId: string,
  filters: TransactionListFilters
): Promise<{ income: number; expense: number }> {
  const { rows } = await fetchInBatches<{ amount: number | null; type: string | null; scope: string | null }>(
    userId,
    "amount, type, scope",
    filters,
    Infinity
  )
  return sumTotals(rows)
}

export function sumTotals(rows: Pick<Transaction, "amount" | "type" | "scope">[]): { income: number; expense: number } {
  return rows.reduce(
    (acc, tx) => {
      const amount = applyScope(Math.abs(toNumber(tx.amount)), tx.scope, "personal")
      if (tx.type === "income") acc.income += amount
      else acc.expense += amount
      return acc
    },
    { income: 0, expense: 0 }
  )
}

/** Tutte le transazioni che rispettano i filtri, per l'export CSV. `null` se la lettura si interrompe. */
export async function getAllTransactions(userId: string, filters: TransactionListFilters): Promise<Transaction[] | null> {
  const { rows, failed } = await fetchInBatches<Transaction>(userId, LIST_COLUMNS, filters, Infinity)
  return failed ? null : rows
}
