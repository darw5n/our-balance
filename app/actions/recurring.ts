"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"

export type RecurringFrequency = "weekly" | "monthly" | "yearly"
export type RecurringType = "income" | "expense"

export type CreateRecurringInput = {
  type: RecurringType
  scope: "personal" | "family"
  amount: number
  description?: string | null
  category_id?: string | null
  frequency: RecurringFrequency
  start_date: string
  requires_confirmation: boolean
}

export type UpdateRecurringInput = Partial<CreateRecurringInput>

export type RecurringActionResult =
  | { success: true }
  | { success: false; error: string }

function advanceDate(dateStr: string, frequency: RecurringFrequency): string {
  const date = new Date(dateStr + "T00:00:00Z")
  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7)
  } else if (frequency === "monthly") {
    date.setUTCMonth(date.getUTCMonth() + 1)
  } else {
    date.setUTCFullYear(date.getUTCFullYear() + 1)
  }
  return date.toISOString().split("T")[0]
}

function rewindDate(dateStr: string, frequency: RecurringFrequency): string {
  const date = new Date(dateStr + "T00:00:00Z")
  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() - 7)
  } else if (frequency === "monthly") {
    date.setUTCMonth(date.getUTCMonth() - 1)
  } else {
    date.setUTCFullYear(date.getUTCFullYear() - 1)
  }
  return date.toISOString().split("T")[0]
}

export async function createRecurringTransaction(
  input: CreateRecurringInput
): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      type: input.type,
      scope: input.scope,
      amount: Number(input.amount),
      description: input.description || null,
      category_id: input.category_id || null,
      frequency: input.frequency,
      start_date: input.start_date,
      next_due_date: input.start_date,
      requires_confirmation: input.requires_confirmation,
      pending_confirmation: false,
      is_active: true,
    })

    if (error) {
      console.error("[createRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    return { success: true }
  } catch (error) {
    console.error("[createRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function updateRecurringTransaction(
  id: string,
  input: UpdateRecurringInput
): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const payload: Record<string, unknown> = {}
    if (input.type !== undefined) payload.type = input.type
    if (input.scope !== undefined) payload.scope = input.scope
    if (input.amount !== undefined) payload.amount = Number(input.amount)
    if (input.description !== undefined) payload.description = input.description || null
    if (input.category_id !== undefined) payload.category_id = input.category_id || null
    if (input.frequency !== undefined) payload.frequency = input.frequency
    if (input.start_date !== undefined) payload.start_date = input.start_date
    if (input.requires_confirmation !== undefined) payload.requires_confirmation = input.requires_confirmation

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("recurring_transactions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[updateRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    return { success: true }
  } catch (error) {
    console.error("[updateRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function deleteRecurringTransaction(id: string): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[deleteRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    return { success: true }
  } catch (error) {
    console.error("[deleteRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function processRecurringTransactions(userId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    const today = new Date().toISOString().split("T")[0]

    const { data: due, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("next_due_date", today)

    if (error) {
      console.error("[processRecurringTransactions] fetch error:", error)
      return
    }

    for (const rec of due ?? []) {
      if (!rec.requires_confirmation) {
        // Auto-create one transaction per missed occurrence
        let currentDue = rec.next_due_date as string
        while (currentDue <= today) {
          await supabase.from("transactions").insert({
            user_id: userId,
            type: rec.type,
            scope: rec.scope,
            amount: rec.amount,
            description: rec.description,
            category_id: rec.category_id,
            date: currentDue,
            status: "confirmed",
          })
          currentDue = advanceDate(currentDue, rec.frequency as RecurringFrequency)
        }
        await supabase
          .from("recurring_transactions")
          .update({ next_due_date: currentDue })
          .eq("id", rec.id)
      } else if (!rec.pending_confirmation) {
        // Flag the oldest missed occurrence for confirmation; advance next_due_date by one cycle
        const nextDue = advanceDate(rec.next_due_date, rec.frequency as RecurringFrequency)
        await supabase
          .from("recurring_transactions")
          .update({ pending_confirmation: true, next_due_date: nextDue })
          .eq("id", rec.id)
      }
      // If already pending_confirmation=true → skip (user must confirm first)
    }
  } catch (error) {
    console.error("[processRecurringTransactions] Unexpected error:", error)
  }
}

export async function confirmRecurringTransaction(
  recurringId: string,
  amount: number
): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()

    const { data: rec, error: fetchError } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("id", recurringId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !rec) {
      return { success: false, error: "Ricorrenza non trovata." }
    }

    // next_due_date was already advanced by one cycle when pending_confirmation was set,
    // so the actual occurrence date is one cycle back.
    const pendingDate = rewindDate(rec.next_due_date, rec.frequency as RecurringFrequency)

    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: rec.type,
      scope: rec.scope,
      amount: Number(amount),
      description: rec.description,
      category_id: rec.category_id,
      date: pendingDate,
      status: "confirmed",
    })

    if (txError) {
      console.error("[confirmRecurringTransaction] tx insert error:", txError)
      return { success: false, error: txError.message }
    }

    const { error: updateError } = await supabase
      .from("recurring_transactions")
      .update({ pending_confirmation: false })
      .eq("id", recurringId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[confirmRecurringTransaction] update error:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("[confirmRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function skipRecurringConfirmation(recurringId: string): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ pending_confirmation: false })
      .eq("id", recurringId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[skipRecurringConfirmation] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[skipRecurringConfirmation] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}
