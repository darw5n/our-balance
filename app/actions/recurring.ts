"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { ActionResult } from "@/lib/types/actions"
import { firstDayOfMonth, rewindDate, pendingTransactionDate } from "@/lib/supabase/query-utils"

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
  end_date?: string | null
  requires_confirmation: boolean
  confirmation_delay: number
}

export type UpdateRecurringInput = Partial<CreateRecurringInput>

export type RecurringActionResult = ActionResult

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

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

// The day-of-month to pin monthly/yearly cycles to (null for weekly).
function startDayOf(rec: { frequency: string; start_date: string | null }): number | null {
  return rec.frequency !== "weekly" && rec.start_date
    ? new Date(rec.start_date + "T00:00:00Z").getUTCDate()
    : null
}

// Advances `from` cycle-by-cycle until it is strictly after `today`,
// applying the same day-of-month pinning the processor uses. Used by resume
// to "skip the gap" — no missed cycles are replayed.
function nextDueAfterToday(
  rec: { frequency: string; start_date: string | null; type: string },
  from: string,
  today: string
): string {
  const freq = rec.frequency as RecurringFrequency
  const startDay = startDayOf(rec)
  let due = from
  for (let i = 0; due <= today && i < 1200; i++) {
    due = advanceDate(due, freq)
    if (startDay) due = pinDayOfMonth(due, startDay)
  }
  return rec.type === "income" ? firstDayOfMonth(due) : due
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
      end_date: input.end_date || null,
      next_due_date: input.start_date,
      requires_confirmation: input.requires_confirmation,
      confirmation_delay: input.confirmation_delay ?? 0,
      pending_confirmation: false,
      is_active: true,
      status: "active",
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
    if (input.end_date !== undefined) payload.end_date = input.end_date || null
    if (input.requires_confirmation !== undefined) payload.requires_confirmation = input.requires_confirmation
    if (input.confirmation_delay !== undefined) payload.confirmation_delay = input.confirmation_delay ?? 0

    const supabase = await createSupabaseServerClient()

    // If the end date is being pushed into the future on a concluded recurring,
    // reactivate it and recompute the next cycle after today.
    if (input.end_date) {
      const today = todayISO()
      if (input.end_date > today) {
        const { data: current } = await supabase
          .from("recurring_transactions")
          .select("status, frequency, start_date, type, next_due_date")
          .eq("id", id)
          .eq("user_id", user.id)
          .single()
        if (current?.status === "ended") {
          payload.status = "active"
          payload.next_due_date = nextDueAfterToday(current, current.next_due_date, today)
        }
      }
    }

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

export async function pauseRecurringTransaction(id: string): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()
    // Pausing also clears any pending confirmation: a paused recurring must not
    // show a confirmation prompt in the dashboard.
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ status: "paused", pending_confirmation: false })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("status", "active")

    if (error) {
      console.error("[pauseRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    return { success: true }
  } catch (error) {
    console.error("[pauseRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function resumeRecurringTransaction(id: string): Promise<RecurringActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()
    const { data: rec } = await supabase
      .from("recurring_transactions")
      .select("frequency, start_date, type, next_due_date, end_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!rec) return { success: false, error: "Ricorrenza non trovata." }

    const today = todayISO()
    if (rec.end_date && rec.end_date < today) {
      return { success: false, error: "La ricorrenza è già conclusa. Modifica la data di fine per riattivarla." }
    }

    // Skip the paused gap: no missed cycles are replayed.
    const nextDue = nextDueAfterToday(rec, rec.next_due_date, today)

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ status: "active", pending_confirmation: false, next_due_date: nextDue })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[resumeRecurringTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    // Drop provisional (unconfirmed) transactions that fell in the skipped gap.
    await supabase
      .from("transactions")
      .delete()
      .eq("user_id", user.id)
      .eq("recurring_id", id)
      .eq("status", "pending")
      .lt("date", nextDue)

    revalidatePath("/dashboard")
    revalidatePath("/recurring")
    return { success: true }
  } catch (error) {
    console.error("[resumeRecurringTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function processRecurringTransactions(userId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    const today = todayISO()

    const { data: due, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("status", "active")
      .lte("next_due_date", today)

    if (error) {
      console.error("[processRecurringTransactions] fetch error:", error)
      return
    }

    for (const rec of due ?? []) {
      const freq = rec.frequency as RecurringFrequency
      const delay: number = rec.confirmation_delay ?? 0
      const endDate: string | null = rec.end_date ?? null

      // The whole remaining schedule is past the end date → conclude it.
      if (endDate && (rec.next_due_date as string) > endDate) {
        await supabase
          .from("recurring_transactions")
          .update({ status: "ended" })
          .eq("id", rec.id)
          .eq("status", "active")
        continue
      }

      // For monthly/yearly: pin trigger dates to the original day-of-month from start_date
      // to avoid drift caused by month-end clamping (e.g. Jan 31 → Feb 28 → Mar 28).
      const startDay = startDayOf(rec)

      if (!rec.requires_confirmation) {
        // Pre-calculate all dates to create and the new next_due_date.
        let currentDue = rec.next_due_date as string
        const datesToCreate: string[] = []
        while (currentDue <= today) {
          if (endDate && currentDue > endDate) break
          const rawTrigger = advanceDateByCycles(currentDue, freq, delay)
          const triggerDate = startDay ? pinDayOfMonth(rawTrigger, startDay) : rawTrigger
          if (triggerDate > today) break
          datesToCreate.push(currentDue)
          currentDue = advanceDate(currentDue, freq)
        }
        if (datesToCreate.length === 0) continue

        // If the next cycle is now past the end date, mark the recurring ended.
        const reachedEnd = !!(endDate && currentDue > endDate)

        // Optimistic lock: advance next_due_date BEFORE inserting transactions.
        // If another concurrent call already updated this row, skip (0 rows returned).
        const { data: claimed } = await supabase
          .from("recurring_transactions")
          .update({ next_due_date: currentDue, ...(reachedEnd ? { status: "ended" } : {}) })
          .eq("id", rec.id)
          .eq("next_due_date", rec.next_due_date)
          .select("id")
        if (!claimed?.length) continue

        for (const date of datesToCreate) {
          // Skip if this cycle already has a transaction (matched by the explicit link).
          const { data: dup } = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("recurring_id", rec.id)
            .eq("date", date)
            .limit(1)
          if (dup?.length) continue

          const { error: insertError } = await supabase.from("transactions").insert({
            user_id: userId,
            type: rec.type,
            scope: rec.scope,
            amount: rec.amount,
            description: rec.description,
            category_id: rec.category_id,
            date,
            status: "confirmed",
            recurring_id: rec.id,
          })
          // 23505 = unique violation on (recurring_id, date): a concurrent run
          // already created this cycle — benign.
          if (insertError && insertError.code !== "23505") {
            console.error("[processRecurringTransactions] insert error:", insertError)
          }
        }
      } else if (!rec.pending_confirmation) {
        const dueDateForTx = rec.next_due_date as string
        // Whether the oldest (dueDateForTx) cycle already has a confirmed
        // transaction — e.g. the user confirmed it from the Transactions page
        // before this trigger date was even reached. If so, skip flagging:
        // don't nag in the dashboard for something already resolved.
        let oldestCycleConfirmed = false

        // Create provisional pending transactions so they appear in the
        // transactions list before the confirmation trigger fires.
        // - Income: one provisional per month from the 1st, for all months started.
        // - Expense: one provisional at next_due_date for the current cycle.
        if (rec.type === "income") {
          let cycleDue = dueDateForTx
          let isOldestCycle = true
          while (firstDayOfMonth(cycleDue) <= today) {
            const provisionalDate = firstDayOfMonth(cycleDue)
            if (endDate && provisionalDate > endDate) break

            // Prefer the explicit link; fall back to the month+description
            // heuristic for rows created before recurring_id existed.
            const { data: linked } = await supabase
              .from("transactions")
              .select("id, status")
              .eq("user_id", userId)
              .eq("recurring_id", rec.id)
              .eq("date", provisionalDate)
              .limit(1)

            let existing = linked
            if (!existing?.length) {
              const d = new Date(provisionalDate + "T00:00:00Z")
              d.setUTCMonth(d.getUTCMonth() + 1)
              const nextMonthStart = d.toISOString().split("T")[0]
              let existingQuery = supabase
                .from("transactions")
                .select("id, status")
                .eq("user_id", userId)
                .gte("date", provisionalDate)
                .lt("date", nextMonthStart)
                .in("status", ["pending", "confirmed"])
                .eq("type", "income")
                .limit(1)
              existingQuery = rec.description
                ? existingQuery.eq("description", rec.description)
                : existingQuery.is("description", null)
              const { data: heuristic } = await existingQuery
              existing = heuristic
            }

            if (isOldestCycle && existing?.[0]?.status === "confirmed") {
              oldestCycleConfirmed = true
            }

            if (!existing?.length) {
              await supabase.from("transactions").insert({
                user_id: userId,
                type: rec.type,
                scope: rec.scope,
                amount: rec.amount,
                description: rec.description,
                category_id: rec.category_id,
                date: provisionalDate,
                status: "pending",
                recurring_id: rec.id,
              })
            }
            cycleDue = advanceDate(cycleDue, freq)
            isOldestCycle = false
          }
        } else {
          // Expense: create one provisional pending transaction for the current cycle.
          const provisionalDate = dueDateForTx
          if (!(endDate && provisionalDate > endDate)) {
            const { data: linked } = await supabase
              .from("transactions")
              .select("id, status")
              .eq("user_id", userId)
              .eq("recurring_id", rec.id)
              .eq("date", provisionalDate)
              .limit(1)

            let existing = linked
            if (!existing?.length) {
              const d = new Date(provisionalDate + "T00:00:00Z")
              d.setUTCMonth(d.getUTCMonth() + 1)
              const nextMonthStart = d.toISOString().split("T")[0]
              let existingQuery = supabase
                .from("transactions")
                .select("id, status")
                .eq("user_id", userId)
                .gte("date", provisionalDate)
                .lt("date", nextMonthStart)
                .in("status", ["pending", "confirmed"])
                .eq("type", "expense")
                .limit(1)
              existingQuery = rec.description
                ? existingQuery.eq("description", rec.description)
                : existingQuery.is("description", null)
              const { data: heuristic } = await existingQuery
              existing = heuristic
            }

            oldestCycleConfirmed = existing?.[0]?.status === "confirmed"

            if (!existing?.length) {
              await supabase.from("transactions").insert({
                user_id: userId,
                type: rec.type,
                scope: rec.scope,
                amount: rec.amount,
                description: rec.description,
                category_id: rec.category_id,
                date: provisionalDate,
                status: "pending",
                recurring_id: rec.id,
              })
            }
          }
        }

        // Only flag for confirmation once the OLDEST cycle's trigger has passed.
        const rawTrigger = advanceDateByCycles(dueDateForTx, freq, delay)
        const triggerDate = startDay ? pinDayOfMonth(rawTrigger, startDay) : rawTrigger
        if (triggerDate > today) continue

        // Income: pin next_due_date to the 1st of the month so its own
        // look-ahead loop keeps iterating on clean month boundaries.
        // Expense: keep the original day-of-month (pinned like triggerDate
        // above) — confirm/skip rewind this value by one cycle to relocate
        // the provisional transaction, and pinning to day 1 would make that
        // lookup land on the wrong date (silently creating a duplicate).
        const advancedDue = advanceDate(dueDateForTx, freq)
        const nextDue =
          rec.type === "income"
            ? firstDayOfMonth(advancedDue)
            : startDay
              ? pinDayOfMonth(advancedDue, startDay)
              : advancedDue

        // If the next cycle is past the end date, the recurring concludes after
        // this (last) confirmation.
        const endStatus = endDate && nextDue > endDate ? { status: "ended" } : {}

        if (oldestCycleConfirmed) {
          await supabase
            .from("recurring_transactions")
            .update({ next_due_date: nextDue, ...endStatus })
            .eq("id", rec.id)
            .eq("pending_confirmation", false)
          continue
        }

        // Optimistic lock: only set pending_confirmation if not already set.
        const { data: claimed } = await supabase
          .from("recurring_transactions")
          .update({ pending_confirmation: true, next_due_date: nextDue, ...endStatus })
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
    const dueDate = rewindDate(rec.next_due_date, rec.frequency as RecurringFrequency)
    const pendingDate = pendingTransactionDate(dueDate, rec.type)

    // Locate the provisional transaction to confirm: prefer the explicit link
    // (oldest still-pending cycle), fall back to the (date, type, description)
    // heuristic for rows created before recurring_id existed.
    const { data: linkedTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("recurring_id", recurringId)
      .eq("status", "pending")
      .order("date", { ascending: true })
      .limit(1)

    let pendingTx = linkedTx
    if (!pendingTx?.length) {
      let pendingTxQuery = supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", pendingDate)
        .eq("status", "pending")
        .eq("type", rec.type)
        .limit(1)
      pendingTxQuery = rec.description
        ? pendingTxQuery.eq("description", rec.description)
        : pendingTxQuery.is("description", null)
      const { data: heuristic } = await pendingTxQuery
      pendingTx = heuristic
    }

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
        recurring_id: recurringId,
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

    // Delete the provisional pending transaction for the skipped cycle:
    // prefer the explicit link, fall back to the (date, type) heuristic.
    if (rec?.next_due_date) {
      const dueDate = rewindDate(rec.next_due_date as string, rec.frequency as RecurringFrequency)
      const provisionalDate = pendingTransactionDate(dueDate, rec.type as string)

      const { data: linkedPending } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("recurring_id", recurringId)
        .eq("status", "pending")
        .order("date", { ascending: true })
        .limit(1)

      if (linkedPending?.length) {
        await supabase.from("transactions").delete().eq("id", linkedPending[0].id)
      } else {
        await supabase
          .from("transactions")
          .delete()
          .eq("user_id", user.id)
          .eq("date", provisionalDate)
          .eq("status", "pending")
          .eq("type", rec.type)
      }
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
