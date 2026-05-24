"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { ActionResult, ActionResultWithId } from "@/lib/types/actions"

export type BudgetInput = {
  category_id: string
  amount_limit: number
}

export type BudgetResult = ActionResultWithId

export async function upsertBudget(input: BudgetInput): Promise<ActionResultWithId> {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "Utente non autenticato." }
  }

  if (!input.category_id) {
    return { success: false, error: "Categoria obbligatoria." }
  }

  const amount_limit = Number(input.amount_limit)
  if (!Number.isFinite(amount_limit) || amount_limit <= 0) {
    return { success: false, error: "Il limite deve essere un numero positivo." }
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      { user_id: user.id, category_id: input.category_id, amount_limit },
      { onConflict: "user_id,category_id" }
    )
    .select("id")
    .single()

  if (error) {
    console.error("[upsertBudget] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/budgets")
  revalidatePath("/dashboard")
  return { success: true, id: data.id }
}

export async function deleteBudget(budgetId: string): Promise<ActionResult> {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "Utente non autenticato." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[deleteBudget] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/budgets")
  revalidatePath("/dashboard")
  return { success: true }
}
