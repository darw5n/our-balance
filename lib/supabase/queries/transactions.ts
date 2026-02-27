import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export type ViewMode = "personal" | "family"

export type DashboardSummary = {
  entrate: number
  uscite: number
  netto: number
  pending: number
  spese_comuni: number  // totale lordo spese scope=family (utile in vista personal)
}

export type CashflowMonthlyPoint = {
  month: string
  entrate: number
  uscite: number
}

export type TopCategory = {
  name: string
  color: string
  amount: number
  percentage: number
}

type TransactionRow = {
  amount: number | null
  type: string | null
  status: string | null
  date: string | null
  scope?: string | null
  category_id?: string | null
}

function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function getLastMonthsRange(months: number, now = new Date()) {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0))
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { fromISO: from.toISOString(), toISO: to.toISOString() }
}

function getYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function applyScope(amount: number, scope: string | null | undefined, viewMode: ViewMode): number {
  if (viewMode === "personal" && scope === "family") return amount * 0.5
  return amount
}

function computeSummary(data: TransactionRow[], viewMode: ViewMode): DashboardSummary {
  let entrate = 0
  let uscite = 0
  let pending = 0
  let spese_comuni = 0

  for (const row of data) {
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)
    const type = row.type ?? ""
    const status = row.status ?? ""

    if (status === "pending") {
      pending += amount
    }

    if (status === "confirmed" && type === "income") {
      entrate += amount
    }

    if (status === "confirmed" && type === "expense") {
      uscite += amount
      // Traccia le spese in comune al lordo (prima dell'halving) solo in vista personal
      if (viewMode === "personal" && row.scope === "family") {
        spese_comuni += rawAmount
      }
    }
  }

  return { entrate, uscite, netto: entrate - uscite, pending, spese_comuni }
}

const EMPTY_SUMMARY: DashboardSummary = { entrate: 0, uscite: 0, netto: 0, pending: 0, spese_comuni: 0 }

export const getDashboardSummary = cache(async function getDashboardSummary(
  userId: string,
  viewMode: ViewMode
): Promise<DashboardSummary> {
  if (!userId) return { ...EMPTY_SUMMARY }

  const supabase = await createSupabaseServerClient()
  const { startISO, endISO } = getMonthRange()

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope", { head: false })
    .eq("user_id", userId)
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return { ...EMPTY_SUMMARY }

  return computeSummary(data as TransactionRow[], viewMode)
})

export const getDashboardSummaryPrevMonth = cache(async function getDashboardSummaryPrevMonth(
  userId: string,
  viewMode: ViewMode
): Promise<DashboardSummary> {
  if (!userId) return { ...EMPTY_SUMMARY }

  const supabase = await createSupabaseServerClient()
  const now = new Date()
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const { startISO, endISO } = getMonthRange(prevMonth)

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope", { head: false })
    .eq("user_id", userId)
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return { ...EMPTY_SUMMARY }

  return computeSummary(data as TransactionRow[], viewMode)
})

export const getDashboardSummaryYear = cache(async function getDashboardSummaryYear(
  userId: string,
  viewMode: ViewMode,
  year: number
): Promise<DashboardSummary> {
  if (!userId) return { ...EMPTY_SUMMARY }

  const supabase = await createSupabaseServerClient()
  const { startISO, endISO } = getYearRange(year)

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope", { head: false })
    .eq("user_id", userId)
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return { ...EMPTY_SUMMARY }

  return computeSummary(data as TransactionRow[], viewMode)
})

export const getCashflowMonthly = cache(async function getCashflowMonthly(
  userId: string,
  months: number = 12,
  viewMode: ViewMode = "personal"
): Promise<CashflowMonthlyPoint[]> {
  if (!userId || months <= 0) return []

  const supabase = await createSupabaseServerClient()
  const { fromISO, toISO } = getLastMonthsRange(months)

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope", { head: false })
    .eq("user_id", userId)
    .gte("date", fromISO)
    .lt("date", toISO)

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return []

  const buckets = new Map<string, { date: Date; entrate: number; uscite: number }>()

  for (const row of data as TransactionRow[]) {
    if (!row.date) continue
    const d = new Date(row.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`

    if (!buckets.has(key)) {
      buckets.set(key, { date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)), entrate: 0, uscite: 0 })
    }

    const bucket = buckets.get(key)!
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)
    const type = row.type ?? ""
    const status = row.status ?? ""

    if (status !== "confirmed") continue

    if (type === "income") {
      bucket.entrate += amount
    } else if (type === "expense") {
      bucket.uscite += amount
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime())

  return sorted.map(({ date, entrate, uscite }) => {
    const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date)
    return { month: monthLabel, entrate, uscite }
  })
})

type TopCategoryRow = {
  amount: number | null
  type: string | null
  status: string | null
  date: string | null
  scope?: string | null
  category: {
    id?: string
    name: string | null
    color: string | null
  } | null | Array<{
    id?: string
    name: string | null
    color: string | null
  }>
}

export const getTopCategories = cache(async function getTopCategories(
  userId: string,
  limit: number = 5,
  viewMode: ViewMode = "personal"
): Promise<TopCategory[]> {
  if (!userId || limit <= 0) return []

  const supabase = await createSupabaseServerClient()
  const { startISO, endISO } = getMonthRange()

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope, category:categories ( id, name, color )", { head: false })
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return []

  const totals = new Map<
    string,
    {
      name: string
      color: string
      amount: number
    }
  >()

  for (const row of data as unknown as TopCategoryRow[]) {
    if (!row.category || row.status !== "confirmed") continue

    // Handle category as object or array (Supabase join can return either)
    let categoryObj: { id?: string; name: string | null; color: string | null } | null = null

    if (Array.isArray(row.category)) {
      categoryObj = row.category[0] || null
    } else {
      categoryObj = row.category
    }

    if (!categoryObj) continue

    const id = categoryObj.id ?? categoryObj.name ?? "unknown"
    const name = categoryObj.name ?? "Senza categoria"
    const color = categoryObj.color ?? "#71717a"
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)

    const existing = totals.get(id)
    if (existing) {
      existing.amount += amount
    } else {
      totals.set(id, { name, color, amount })
    }
  }

  const all = Array.from(totals.values()).sort((a, b) => b.amount - a.amount)

  const top = all.slice(0, limit)
  const totalAmount = top.reduce((acc, item) => acc + item.amount, 0)

  if (totalAmount <= 0) {
    return top.map((item) => ({
      name: item.name,
      color: item.color,
      amount: item.amount,
      percentage: 0,
    }))
  }

  return top.map((item) => ({
    name: item.name,
    color: item.color,
    amount: item.amount,
    percentage: (item.amount / totalAmount) * 100,
  }))
})
