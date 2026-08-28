import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { rewindDate, pendingTransactionDate } from "@/lib/supabase/query-utils"

export type RecurringTransaction = {
  id: string
  user_id: string
  type: "income" | "expense"
  scope: "personal" | "family"
  amount: number
  description: string | null
  category_id: string | null
  frequency: "weekly" | "monthly" | "yearly"
  start_date: string
  end_date: string | null
  next_due_date: string
  requires_confirmation: boolean
  confirmation_delay: number
  pending_confirmation: boolean
  is_active: boolean
  status: "active" | "paused" | "ended"
  created_at: string
  category?: { name: string; color: string } | null
}

export const getRecurringTransactions = cache(async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, categories ( name, color )")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[getRecurringTransactions] Error:", error.message, error.code, error.details)
    return []
  }

  return (data ?? []).map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    return {
      ...row,
      category: cat ? { name: (cat as { name: string }).name, color: (cat as { color: string }).color } : null,
    }
  }) as RecurringTransaction[]
})

export const getUpcomingRecurring = cache(async function getUpcomingRecurring(userId: string, days: number = 14): Promise<RecurringTransaction[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()
  const now = new Date()
  const future = new Date(now)
  future.setDate(future.getDate() + days)

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, categories ( name, color )")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("status", "active")
    .eq("pending_confirmation", false)
    .gt("next_due_date", now.toISOString())
    .lte("next_due_date", future.toISOString())
    .order("next_due_date", { ascending: true })

  if (error) return []

  return (data ?? []).map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    return {
      ...row,
      category: cat ? { name: (cat as { name: string }).name, color: (cat as { color: string }).color } : null,
    }
  }) as RecurringTransaction[]
})

export const getPendingConfirmations = cache(async function getPendingConfirmations(userId: string): Promise<RecurringTransaction[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, categories ( name, color )")
    .eq("user_id", userId)
    .eq("pending_confirmation", true)
    .eq("is_active", true)
    .in("status", ["active", "ended"])

  if (error) {
    console.error("[getPendingConfirmations] Error:", error.message, error.code, error.details)
    return []
  }

  return Promise.all((data ?? []).map(async (row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const mapped = {
      ...row,
      category: cat ? { name: (cat as { name: string }).name, color: (cat as { color: string }).color } : null,
    } as RecurringTransaction

    // Show the live amount from the actual pending transaction, in case the
    // user already edited it from the Transactions page before this
    // confirmation prompt appeared — avoids re-showing a stale template amount.
    const dueDate = rewindDate(mapped.next_due_date, mapped.frequency)
    const pendingDate = pendingTransactionDate(dueDate, mapped.type)

    // Prefer the explicit link (oldest still-pending cycle); fall back to the
    // (date, type, description) heuristic for rows created before recurring_id.
    const { data: linkedTx } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("recurring_id", mapped.id)
      .eq("status", "pending")
      .order("date", { ascending: true })
      .limit(1)

    let pendingTx = linkedTx
    if (!pendingTx?.length) {
      let pendingTxQuery = supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("date", pendingDate)
        .eq("status", "pending")
        .eq("type", mapped.type)
        .limit(1)
      pendingTxQuery = mapped.description
        ? pendingTxQuery.eq("description", mapped.description)
        : pendingTxQuery.is("description", null)
      const { data: heuristic } = await pendingTxQuery
      pendingTx = heuristic
    }

    if (pendingTx?.[0]?.amount != null) {
      mapped.amount = pendingTx[0].amount
    }
    return mapped
  }))
})
