import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { ViewMode } from "@/lib/supabase/queries/transactions"

export type BudgetWithProgress = {
  id: string
  category_id: string
  category_name: string
  category_color: string
  amount_limit: number
  spent: number
  percentage: number
  is_exceeded: boolean
}

function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function parseMonthParam(month?: string): Date | undefined {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return undefined
  const [year, mon] = month.split("-").map(Number)
  return new Date(Date.UTC(year, mon - 1, 1))
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export const getBudgetsWithProgress = cache(async function getBudgetsWithProgress(
  userId: string,
  viewMode: ViewMode = "personal",
  month?: string  // "YYYY-MM", defaults to current month
): Promise<BudgetWithProgress[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("id, category_id, amount_limit, categories ( name, color )")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (budgetsError || !budgets || budgets.length === 0) {
    if (budgetsError) console.error("[getBudgetsWithProgress] budgets error:", budgetsError)
    return []
  }

  const dateForRange = parseMonthParam(month)
  const { startISO, endISO } = getMonthRange(dateForRange)

  let txQuery = supabase
    .from("transactions")
    .select("amount, category_id, scope")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("status", "confirmed")
    .gte("date", startISO)
    .lt("date", endISO)

  if (viewMode === "family") {
    txQuery = txQuery.eq("scope", "family")
  }

  const { data: transactions, error: txError } = await txQuery

  if (txError) {
    console.error("[getBudgetsWithProgress] transactions error:", txError)
  }

  const spentByCategory = new Map<string, number>()
  for (const tx of transactions ?? []) {
    if (!tx.category_id) continue
    const rawAmount = Math.abs(toNumber(tx.amount))
    const amount = viewMode === "personal" && tx.scope === "family" ? rawAmount * 0.5 : rawAmount
    const prev = spentByCategory.get(tx.category_id) ?? 0
    spentByCategory.set(tx.category_id, prev + amount)
  }

  return budgets.map((b) => {
    const cat = Array.isArray(b.categories) ? b.categories[0] : b.categories
    const category_name = (cat as { name?: string | null } | null)?.name ?? "Senza categoria"
    const category_color = (cat as { color?: string | null } | null)?.color ?? "#71717a"
    const amount_limit = toNumber(b.amount_limit)
    const spent = spentByCategory.get(b.category_id) ?? 0
    const percentage = amount_limit > 0 ? (spent / amount_limit) * 100 : 0
    const is_exceeded = spent >= amount_limit

    return {
      id: b.id,
      category_id: b.category_id,
      category_name,
      category_color,
      amount_limit,
      spent,
      percentage,
      is_exceeded,
    }
  })
})
