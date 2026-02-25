import { createSupabaseServerClient } from "@/lib/supabase-server"

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
  next_due_date: string
  requires_confirmation: boolean
  pending_confirmation: boolean
  is_active: boolean
  created_at: string
  category?: { name: string; color: string } | null
}

export async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
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
}

export async function getUpcomingRecurring(userId: string, days: number = 14): Promise<RecurringTransaction[]> {
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
}

export async function getPendingConfirmations(userId: string): Promise<RecurringTransaction[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, categories ( name, color )")
    .eq("user_id", userId)
    .eq("pending_confirmation", true)
    .eq("is_active", true)

  if (error) {
    console.error("[getPendingConfirmations] Error:", error.message, error.code, error.details)
    return []
  }

  return (data ?? []).map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    return {
      ...row,
      category: cat ? { name: (cat as { name: string }).name, color: (cat as { color: string }).color } : null,
    }
  }) as RecurringTransaction[]
}
