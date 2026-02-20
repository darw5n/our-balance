"use server"

import { revalidatePath } from "next/cache"
import { getServerUser } from "@/lib/supabase-server"

export type CreateCategoryInput = {
  name: string
  color: string
  type: "expense" | "income"
  macro_category?: string | null
}

export type UpdateCategoryInput = {
  name: string
  color: string
  type: "expense" | "income"
  macro_category?: string | null
}

export type CategoryResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function createCategory(input: CreateCategoryInput): Promise<CategoryResult> {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "Utente non autenticato." }
  }

  const name = input.name?.trim()
  if (!name) {
    return { success: false, error: "Il nome della categoria è obbligatorio." }
  }

  const color = input.color?.trim() || "#71717a"
  const type = input.type === "income" ? "income" : "expense"
  const macro_category = input.macro_category ?? null

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, color, type, macro_category })
    .select("id")
    .single()

  if (error) {
    console.error("[createCategory] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/categories")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true, id: data.id }
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput
): Promise<CategoryResult> {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "Utente non autenticato." }
  }

  const name = input.name?.trim()
  if (!name) {
    return { success: false, error: "Il nome della categoria è obbligatorio." }
  }

  const color = input.color?.trim() || "#71717a"
  const type = input.type === "income" ? "income" : "expense"
  const macro_category = input.macro_category ?? null

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .update({ name, color, type, macro_category })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select("id")
    .single()

  if (error) {
    console.error("[updateCategory] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/categories")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true, id: data.id }
}

export async function deleteCategory(categoryId: string): Promise<CategoryResult> {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "Utente non autenticato." }
  }

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[deleteCategory] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/categories")
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true, id: categoryId }
}

type DefaultCategory = {
  name: string
  color: string
  type: "expense" | "income"
  macro_category: string | null
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Necessità — spese fisse e fondamentali
  { name: "Affitto / Mutuo",    color: "#f59e0b", type: "expense", macro_category: "necessita" },
  { name: "Alimentari",         color: "#22c55e", type: "expense", macro_category: "necessita" },
  { name: "Bollette",           color: "#3b82f6", type: "expense", macro_category: "necessita" },
  { name: "Auto",               color: "#8b5cf6", type: "expense", macro_category: "necessita" },
  { name: "Trasporti",          color: "#6366f1", type: "expense", macro_category: "necessita" },
  { name: "Salute",             color: "#ec4899", type: "expense", macro_category: "necessita" },
  { name: "Telefono / Internet",color: "#14b8a6", type: "expense", macro_category: "necessita" },
  // Svago — spese discrezionali e piaceri
  { name: "Ristorante",         color: "#ef4444", type: "expense", macro_category: "svago" },
  { name: "Aperitivo / Bar",    color: "#f97316", type: "expense", macro_category: "svago" },
  { name: "Shopping",           color: "#a78bfa", type: "expense", macro_category: "svago" },
  { name: "Viaggi",             color: "#fb923c", type: "expense", macro_category: "svago" },
  { name: "Abbonamenti",        color: "#c084fc", type: "expense", macro_category: "svago" },
  { name: "Sport / Hobby",      color: "#4ade80", type: "expense", macro_category: "svago" },
  // Investimenti — allocazione di capitale
  { name: "ETF / Fondi",        color: "#60a5fa", type: "expense", macro_category: "investimenti" },
  // Entrate
  { name: "Stipendio",          color: "#34d399", type: "income",  macro_category: null },
  { name: "Freelance / Extra",  color: "#2dd4bf", type: "income",  macro_category: null },
]

export async function createDefaultCategories(): Promise<{ success: boolean; created: number; error?: string }> {
  const user = await getServerUser()
  if (!user?.id) return { success: false, created: 0, error: "Utente non autenticato." }

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  // Recupera nomi esistenti per evitare duplicati
  const { data: existing } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id)

  const existingNames = new Set((existing ?? []).map((c: { name: string }) => c.name.toLowerCase()))

  const toInsert = DEFAULT_CATEGORIES
    .filter((c) => !existingNames.has(c.name.toLowerCase()))
    .map((c) => ({ ...c, user_id: user.id }))

  if (toInsert.length === 0) return { success: true, created: 0 }

  const { error } = await supabase.from("categories").insert(toInsert)

  if (error) {
    console.error("[createDefaultCategories] Error:", error)
    return { success: false, created: 0, error: error.message }
  }

  revalidatePath("/categories")
  revalidatePath("/dashboard")
  return { success: true, created: toInsert.length }
}
