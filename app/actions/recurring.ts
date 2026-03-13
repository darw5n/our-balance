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
  confirmation_delay: number
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

// Returns the date after advancing by `cycles` frequency cycles
function advanceDateByCycles(dateStr: string, frequency: RecurringFrequency, cycles: number): string {
  let date = dateStr
  for (let i = 0; i < cycles; i++) {
    date = advanceDate(date, frequency)
  }
  return date
}

// Pins the day-of-month to targetDay, clamped to the month's last day.
// Used to correct month-end drift (e.g. Jan 31 → Feb 28 → Mar 28 should stay on the 31st/last).
function pinDayOfMonth(dateStr: string, targetDay: number): string {
  const date = new Date(dateStr + "T00:00:00Z")
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(targetDay, lastDay))
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
      confirmation_delay: input.confirmation_delay ?? 0,
      pending_confirmation: false,
      is_active: true,
    })

    if (error) {
      console.error("[createRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    // Immediately process the new recurring (creates any past-due transactions).
    await processRecurringTransactions(user.id)

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    revalidatePath("/transactions")
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
    if (input.confirmation_delay !== undefined) payload.confirmation_delay = input.confirmation_delay ?? 0

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
      const freq = rec.frequency as RecurringFrequency
      const delay: number = rec.confirmation_delay ?? 0

      // For monthly/yearly: pin trigger dates to the original day-of-month from start_date
      // to avoid drift caused by month-end clamping (e.g. Jan 31 → Feb 28 → Mar 28).
      const startDay =
        freq !== "weekly" && rec.start_date
          ? new Date(rec.start_date + "T00:00:00Z").getUTCDate()
          : null

      if (!rec.requires_confirmation) {
        // Pre-calculate all dates to create and the new next_due_date.
        let currentDue = rec.next_due_date as string
        const datesToCreate: string[] = []
        while (currentDue <= today) {
          const rawTrigger = advanceDateByCycles(currentDue, freq, delay)
          const triggerDate = startDay ? pinDayOfMonth(rawTrigger, startDay) : rawTrigger
          if (triggerDate > today) break
          datesToCreate.push(currentDue)
          currentDue = advanceDate(currentDue, freq)
        }
        if (datesToCreate.length === 0) continue

        // Optimistic lock: advance next_due_date BEFORE inserting transactions.
        // If another concurrent call already updated this row, skip (0 rows returned).
        const { data: claimed } = await supabase
          .from("recurring_transactions")
          .update({ next_due_date: currentDue })
          .eq("id", rec.id)
          .eq("next_due_date", rec.next_due_date)
          .select("id")
        if (!claimed?.length) continue

        for (const date of datesToCreate) {
          // Skip if an identical transaction already exists (same date, amount, description).
          const dupQuery = supabase
            .from("transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("date", date)
            .eq("amount", rec.amount)
            .limit(1)
          const { data: dup } = rec.description
            ? await dupQuery.eq("description", rec.description)
            : await dupQuery.is("description", null)
          if (dup?.length) continue

          await supabase.from("transactions").insert({
            user_id: userId,
            type: rec.type,
            scope: rec.scope,
            amount: rec.amount,
            description: rec.description,
            category_id: rec.category_id,
            date,
            status: "confirmed",
          })
        }
      } else if (!rec.pending_confirmation) {
        const dueDateForTx = rec.next_due_date as string

        // For income: create a provisional pending transaction as soon as the due
        // date passes — even if the confirmation trigger hasn't arrived yet.
        // This ensures the current month shows expected income from day one.
        if (rec.type === "income") {
          const { data: existingPending } = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("date", dueDateForTx)
            .eq("status", "pending")
            .eq("type", "income")
            .limit(1)
          if (!existingPending?.length) {
            await supabase.from("transactions").insert({
              user_id: userId,
              type: rec.type,
              scope: rec.scope,
              amount: rec.amount,
              description: rec.description,
              category_id: rec.category_id,
              date: dueDateForTx,
              status: "pending",
            })
          }
        }

        // Only flag for confirmation once `next_due_date + delay cycles <= today`.
        const rawTrigger = advanceDateByCycles(dueDateForTx, freq, delay)
        const triggerDate = startDay ? pinDayOfMonth(rawTrigger, startDay) : rawTrigger
        if (triggerDate > today) continue

        const nextDue = advanceDate(dueDateForTx, freq)

        // Optimistic lock: only set pending_confirmation if not already set.
        const { data: claimed } = await supabase
          .from("recurring_transactions")
          .update({ pending_confirmation: true, next_due_date: nextDue })
          .eq("id", rec.id)
          .eq("pending_confirmation", false)
          .select("id")
        if (!claimed?.length) continue
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

    // Try to find and update the provisional pending transaction
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", pendingDate)
      .eq("status", "pending")
      .eq("type", rec.type)
      .limit(1)

    let txError: { message: string } | null = null
    if (pendingTx?.length) {
      const { error } = await supabase
        .from("transactions")
        .update({ amount: Number(amount), status: "confirmed" })
        .eq("id", pendingTx[0].id)
      txError = error
    } else {
      // Fallback: insert (no provisional transaction existed)
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: rec.type,
        scope: rec.scope,
        amount: Number(amount),
        description: rec.description,
        category_id: rec.category_id,
        date: pendingDate,
        status: "confirmed",
      })
      txError = error
    }

    if (txError) {
      console.error("[confirmRecurringTransaction] tx error:", txError)
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

    // Fetch the recurring to get the due date for deleting the provisional transaction
    const { data: rec } = await supabase
      .from("recurring_transactions")
      .select("next_due_date, frequency, type")
      .eq("id", recurringId)
      .eq("user_id", user.id)
      .single()

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ pending_confirmation: false })
      .eq("id", recurringId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[skipRecurringConfirmation] Error:", error)
      return { success: false, error: error.message }
    }

    // Delete the provisional pending transaction if it exists
    if (rec?.type === "income" && rec.next_due_date) {
      const dueDateForTx = rewindDate(rec.next_due_date as string, rec.frequency as RecurringFrequency)
      await supabase
        .from("transactions")
        .delete()
        .eq("user_id", user.id)
        .eq("date", dueDateForTx)
        .eq("status", "pending")
        .eq("type", "income")
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("[skipRecurringConfirmation] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}
