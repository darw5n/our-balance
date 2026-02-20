import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { ViewMode, CashflowMonthlyPoint } from "./transactions"

export type MacroBreakdown = {
  necessita: number
  svago: number
  risparmi: number
  investimenti: number
  totale_entrate: number
}

type TransactionWithCategory = {
  amount: number | null
  type: string | null
  status: string | null
  date: string | null
  scope?: string | null
  category: {
    macro_category: string | null
  } | Array<{ macro_category: string | null }> | null
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

function getYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export async function getMacroCategoryBreakdown(
  userId: string,
  viewMode: ViewMode,
  year: number
): Promise<MacroBreakdown> {
  const empty: MacroBreakdown = { necessita: 0, svago: 0, risparmi: 0, investimenti: 0, totale_entrate: 0 }
  if (!userId) return empty

  const supabase = await createSupabaseServerClient()
  const { startISO, endISO } = getYearRange(year)

  let expenseQuery = supabase
    .from("transactions")
    .select("amount, type, status, date, scope, category:categories ( macro_category )", { head: false })
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("status", "confirmed")
    .gte("date", startISO)
    .lt("date", endISO)

  let incomeQuery = supabase
    .from("transactions")
    .select("amount, type, status, date, scope", { head: false })
    .eq("user_id", userId)
    .eq("type", "income")
    .eq("status", "confirmed")
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    expenseQuery = expenseQuery.eq("scope", "family")
    incomeQuery = incomeQuery.eq("scope", "family")
  }

  const [{ data: expenseData }, { data: incomeData }] = await Promise.all([expenseQuery, incomeQuery])

  const result: MacroBreakdown = { necessita: 0, svago: 0, risparmi: 0, investimenti: 0, totale_entrate: 0 }

  for (const row of (expenseData ?? []) as unknown as TransactionWithCategory[]) {
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)

    let macro: string | null = null
    if (row.category) {
      if (Array.isArray(row.category)) {
        macro = row.category[0]?.macro_category ?? null
      } else {
        macro = (row.category as { macro_category: string | null }).macro_category
      }
    }

    if (macro === "necessita") result.necessita += amount
    else if (macro === "svago") result.svago += amount
    else if (macro === "risparmi") result.risparmi += amount
    else if (macro === "investimenti") result.investimenti += amount
  }

  for (const row of (incomeData ?? []) as Array<{ amount: number | null; scope?: string | null }>) {
    const rawAmount = Math.abs(toNumber(row.amount))
    result.totale_entrate += applyScope(rawAmount, row.scope, viewMode)
  }

  return result
}

export async function getCashflowForYear(
  userId: string,
  viewMode: ViewMode,
  year: number
): Promise<CashflowMonthlyPoint[]> {
  if (!userId) return []

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

  if (error || !data) return buildEmptyYear(year)

  const buckets = new Map<number, { entrate: number; uscite: number }>()

  for (const row of data as Array<{ amount: number | null; type: string | null; status: string | null; date: string | null; scope?: string | null }>) {
    if (!row.date || row.status !== "confirmed") continue
    const d = new Date(row.date)
    const month = d.getUTCMonth() // 0-indexed

    if (!buckets.has(month)) {
      buckets.set(month, { entrate: 0, uscite: 0 })
    }

    const bucket = buckets.get(month)!
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)

    if (row.type === "income") bucket.entrate += amount
    else if (row.type === "expense") bucket.uscite += amount
  }

  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(year, i, 1))
    const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date)
    const bucket = buckets.get(i) ?? { entrate: 0, uscite: 0 }
    return { month: monthLabel, entrate: bucket.entrate, uscite: bucket.uscite }
  })
}

function buildEmptyYear(year: number): CashflowMonthlyPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(year, i, 1))
    const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date)
    return { month: monthLabel, entrate: 0, uscite: 0 }
  })
}

export type CategoryMonthlyAverage = {
  name: string
  color: string
  macro_category: string | null
  avg_monthly: number
}

export async function getCategoryMonthlyAverages(
  userId: string,
  viewMode: ViewMode,
  months: number = 6
): Promise<CategoryMonthlyAverage[]> {
  if (!userId || months <= 0) return []

  const supabase = await createSupabaseServerClient()

  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1))
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  let query = supabase
    .from("transactions")
    .select("amount, type, status, date, scope, category:categories ( id, name, color, macro_category )", { head: false })
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("status", "confirmed")
    .gte("date", from.toISOString())
    .lt("date", to.toISOString())

  if (viewMode === "family") {
    query = query.eq("scope", "family")
  }

  const { data, error } = await query

  if (error || !data) return []

  type Row = {
    amount: number | null
    scope?: string | null
    category: {
      id?: string
      name: string | null
      color: string | null
      macro_category: string | null
    } | Array<{
      id?: string
      name: string | null
      color: string | null
      macro_category: string | null
    }> | null
  }

  const totals = new Map<string, { name: string; color: string; macro_category: string | null; amount: number }>()

  for (const row of data as unknown as Row[]) {
    if (!row.category) continue

    let cat: { id?: string; name: string | null; color: string | null; macro_category: string | null } | null = null
    if (Array.isArray(row.category)) {
      cat = row.category[0] ?? null
    } else {
      cat = row.category
    }
    if (!cat) continue

    const id = cat.id ?? cat.name ?? "unknown"
    const name = cat.name ?? "Senza categoria"
    const color = cat.color ?? "#71717a"
    const macro_category = cat.macro_category ?? null
    const rawAmount = Math.abs(toNumber(row.amount))
    const amount = applyScope(rawAmount, row.scope, viewMode)

    const existing = totals.get(id)
    if (existing) {
      existing.amount += amount
    } else {
      totals.set(id, { name, color, macro_category, amount })
    }
  }

  return Array.from(totals.values())
    .map(({ name, color, macro_category, amount }) => ({
      name,
      color,
      macro_category,
      avg_monthly: amount / months,
    }))
    .sort((a, b) => b.avg_monthly - a.avg_monthly)
}
