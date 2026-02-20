"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"

export type TransactionType = "income" | "expense"

export type CreateTransactionInput = {
  amount: number
  type: TransactionType
  date: string // ISO date string YYYY-MM-DD
  description?: string | null
  category_id?: string | null
  status?: "confirmed" | "pending"
  scope?: "personal" | "family"
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>

export type CreateTransactionResult =
  | { success: true; id: string }
  | { success: false; error: string }

export type TransactionActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createTransaction(
  input: CreateTransactionInput
): Promise<CreateTransactionResult> {
  try {
    // Get authenticated user using helper
    const user = await getServerUser()

    if (!user?.id) {
      console.error("[createTransaction] No authenticated user found")
      console.error("[createTransaction] User object:", user)
      return { success: false, error: "Utente non autenticato. Effettua il login per continuare." }
    }

    console.log("[createTransaction] Authenticated user ID:", user.id)

    // Validate input
    if (!input.amount || !input.type || !input.date) {
      return { success: false, error: "Campi obbligatori mancanti: amount, type, date" }
    }

    // Format date to ISO date string (YYYY-MM-DD)
    let formattedDate: string
    try {
      const dateObj = new Date(input.date)
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Formato data non valido." }
      }
      formattedDate = dateObj.toISOString().split("T")[0]
    } catch {
      return { success: false, error: "Formato data non valido." }
    }

    // Prepare payload
    const payload = {
      user_id: user.id,
      amount: Number(input.amount),
      type: input.type,
      date: formattedDate,
      description: input.description || null,
      category_id: input.category_id || null,
      status: input.status || "confirmed",
      scope: input.scope || "personal",
    }

    // Debug logging
    console.log("[createTransaction] Payload:", JSON.stringify(payload, null, 2))

    // Create Supabase client and insert transaction
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.from("transactions").insert(payload).select("id").single()

    if (error) {
      console.error("[createTransaction] Insert error:", error)
      console.error("[createTransaction] Error code:", error.code)
      console.error("[createTransaction] Error details:", JSON.stringify(error, null, 2))
      console.error("[createTransaction] Error hint:", error.hint)
      return {
        success: false,
        error: error.message || "Errore durante il salvataggio. Controlla la console per i dettagli.",
      }
    }

    if (!data?.id) {
      return { success: false, error: "Transazione creata ma ID non restituito." }
    }

    console.log("[createTransaction] Transaction created successfully:", data.id)

    // Revalidate dashboard and transactions pages
    revalidatePath("/dashboard")
    revalidatePath("/transactions")

    return { success: true, id: data.id }
  } catch (error) {
    console.error("[createTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto durante il salvataggio.",
    }
  }
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput
): Promise<TransactionActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const payload: Record<string, unknown> = {}
    if (input.amount !== undefined) payload.amount = Number(input.amount)
    if (input.type !== undefined) payload.type = input.type
    if (input.date !== undefined) {
      const dateObj = new Date(input.date)
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Formato data non valido." }
      }
      payload.date = dateObj.toISOString().split("T")[0]
    }
    if (input.description !== undefined) payload.description = input.description || null
    if (input.category_id !== undefined) payload.category_id = input.category_id || null
    if (input.status !== undefined) payload.status = input.status
    if (input.scope !== undefined) payload.scope = input.scope

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[updateTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("[updateTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function deleteTransaction(id: string): Promise<TransactionActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[deleteTransaction] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("[deleteTransaction] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}

export async function bulkDeleteTransactions(ids: string[]): Promise<TransactionActionResult> {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "Utente non autenticato." }
    }

    if (!ids.length) {
      return { success: false, error: "Nessuna transazione selezionata." }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id)

    if (error) {
      console.error("[bulkDeleteTransactions] Error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("[bulkDeleteTransactions] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto.",
    }
  }
}
