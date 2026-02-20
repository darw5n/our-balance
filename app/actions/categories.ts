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
  // Abitazione — Necessità
  { name: "Affitto",                   color: "#f59e0b", type: "expense", macro_category: "necessita" },
  { name: "Bolletta gas",              color: "#fb923c", type: "expense", macro_category: "necessita" },
  { name: "Bolletta elettricità",      color: "#fbbf24", type: "expense", macro_category: "necessita" },
  { name: "Bolletta rifiuti",          color: "#d97706", type: "expense", macro_category: "necessita" },
  { name: "Manutenzione casa",         color: "#92400e", type: "expense", macro_category: "necessita" },
  // Cibo — Necessità
  { name: "Spesa supermercato",        color: "#22c55e", type: "expense", macro_category: "necessita" },
  // Cibo — Svago
  { name: "Ristorante",                color: "#ef4444", type: "expense", macro_category: "svago" },
  { name: "Aperitivo / Bar",           color: "#f97316", type: "expense", macro_category: "svago" },
  // Trasporti — Necessità
  { name: "Carburante",                color: "#8b5cf6", type: "expense", macro_category: "necessita" },
  { name: "Trasporti pubblici",        color: "#6366f1", type: "expense", macro_category: "necessita" },
  { name: "Manutenzione auto",         color: "#4f46e5", type: "expense", macro_category: "necessita" },
  // Salute — Necessità
  { name: "Farmaci",                   color: "#ec4899", type: "expense", macro_category: "necessita" },
  { name: "Visite mediche",            color: "#db2777", type: "expense", macro_category: "necessita" },
  { name: "Palestra",                  color: "#14b8a6", type: "expense", macro_category: "necessita" },
  // Cura Personale — Svago
  { name: "Parrucchiere",              color: "#a78bfa", type: "expense", macro_category: "svago" },
  { name: "Estetica",                  color: "#c084fc", type: "expense", macro_category: "svago" },
  { name: "Prodotti igiene",           color: "#e879f9", type: "expense", macro_category: "svago" },
  // Shopping — Svago
  { name: "Abbigliamento",             color: "#f43f5e", type: "expense", macro_category: "svago" },
  { name: "Elettronica",               color: "#64748b", type: "expense", macro_category: "svago" },
  { name: "Regali",                    color: "#fb7185", type: "expense", macro_category: "svago" },
  // Svago — Svago
  { name: "Intrattenimento",           color: "#7c3aed", type: "expense", macro_category: "svago" },
  { name: "Abbonamenti",               color: "#9333ea", type: "expense", macro_category: "svago" },
  { name: "Hobby",                     color: "#4ade80", type: "expense", macro_category: "svago" },
  // Viaggi — Svago
  { name: "Voli",                      color: "#0ea5e9", type: "expense", macro_category: "svago" },
  { name: "Hotel / Alloggio",          color: "#0284c7", type: "expense", macro_category: "svago" },
  { name: "Trasporti extra",           color: "#38bdf8", type: "expense", macro_category: "svago" },
  // Formazione — Investimenti (capitale umano)
  { name: "Libri",                     color: "#60a5fa", type: "expense", macro_category: "investimenti" },
  { name: "Corsi online",              color: "#3b82f6", type: "expense", macro_category: "investimenti" },
  { name: "Formazione professionale",  color: "#2563eb", type: "expense", macro_category: "investimenti" },
  // Investimenti finanziari — Investimenti
  { name: "ETF / Fondi",               color: "#10b981", type: "expense", macro_category: "investimenti" },
  // Entrate
  { name: "Stipendio",                 color: "#34d399", type: "income",  macro_category: null },
  { name: "Freelance / Extra",         color: "#2dd4bf", type: "income",  macro_category: null },
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
