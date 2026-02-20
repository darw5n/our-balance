"use server"

import { revalidatePath } from "next/cache"
import { getServerUser } from "@/lib/supabase-server"

export type CreateCategoryInput = {
  name: string
  color: string
  type: "expense" | "income"
  macro_category?: string | null
  group_name?: string | null
}

export type UpdateCategoryInput = {
  name: string
  color: string
  type: "expense" | "income"
  macro_category?: string | null
  group_name?: string | null
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
  const group_name = input.group_name?.trim() || null

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, color, type, macro_category, group_name })
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
  const group_name = input.group_name?.trim() || null

  const supabase = await (await import("@/lib/supabase-server")).createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .update({ name, color, type, macro_category, group_name })
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
  group_name: string | null
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Alimentari
  { name: "Ristoranti & Asporto",      color: "#f97316", type: "expense", macro_category: "svago",        group_name: "Alimentari" },
  { name: "Spesa supermercato",        color: "#22c55e", type: "expense", macro_category: "necessita",    group_name: "Alimentari" },
  // Animali
  { name: "Cibo & Accessori",          color: "#fb923c", type: "expense", macro_category: "necessita",    group_name: "Animali" },
  { name: "Veterinario",               color: "#ea580c", type: "expense", macro_category: "necessita",    group_name: "Animali" },
  // Altro
  { name: "Spese varie",               color: "#71717a", type: "expense", macro_category: "svago",        group_name: "Altro" },
  // Casa
  { name: "Affitto / Mutuo",           color: "#f59e0b", type: "expense", macro_category: "necessita",    group_name: "Casa" },
  { name: "Arredamento",               color: "#d97706", type: "expense", macro_category: "necessita",    group_name: "Casa" },
  { name: "Manutenzione",              color: "#92400e", type: "expense", macro_category: "necessita",    group_name: "Casa" },
  // Utenze
  { name: "Acqua",                     color: "#22d3ee", type: "expense", macro_category: "necessita",    group_name: "Utenze" },
  { name: "Gas",                       color: "#fb923c", type: "expense", macro_category: "necessita",    group_name: "Utenze" },
  { name: "Internet",                  color: "#818cf8", type: "expense", macro_category: "necessita",    group_name: "Utenze" },
  { name: "Luce",                      color: "#fbbf24", type: "expense", macro_category: "necessita",    group_name: "Utenze" },
  { name: "Rifiuti",                   color: "#6b7280", type: "expense", macro_category: "necessita",    group_name: "Utenze" },
  // Finanza
  { name: "Investimenti",              color: "#10b981", type: "expense", macro_category: "investimenti", group_name: "Finanza" },
  { name: "Tasse & Imposte",           color: "#64748b", type: "expense", macro_category: "necessita",    group_name: "Finanza" },
  // Formazione
  { name: "Corsi & Libri",             color: "#60a5fa", type: "expense", macro_category: "svago",        group_name: "Formazione" },
  { name: "Scuola & Università",       color: "#3b82f6", type: "expense", macro_category: "necessita",    group_name: "Formazione" },
  // Salute
  { name: "Dentista",                  color: "#f472b6", type: "expense", macro_category: "necessita",    group_name: "Salute" },
  { name: "Farmaci",                   color: "#ec4899", type: "expense", macro_category: "necessita",    group_name: "Salute" },
  { name: "Visite mediche",            color: "#db2777", type: "expense", macro_category: "necessita",    group_name: "Salute" },
  // Shopping
  { name: "Abbigliamento",             color: "#f43f5e", type: "expense", macro_category: "svago",        group_name: "Shopping" },
  { name: "Tecnologia",                color: "#94a3b8", type: "expense", macro_category: "svago",        group_name: "Shopping" },
  // Svago
  { name: "Hobby",                     color: "#4ade80", type: "expense", macro_category: "svago",        group_name: "Svago" },
  { name: "Intrattenimento",           color: "#7c3aed", type: "expense", macro_category: "svago",        group_name: "Svago" },
  { name: "Palestra & Sport",          color: "#14b8a6", type: "expense", macro_category: "svago",        group_name: "Svago" },
  { name: "Regali",                    color: "#fb7185", type: "expense", macro_category: "svago",        group_name: "Svago" },
  // Trasporti
  { name: "Carburante",                color: "#8b5cf6", type: "expense", macro_category: "necessita",    group_name: "Trasporti" },
  { name: "Manutenzione auto",         color: "#4f46e5", type: "expense", macro_category: "necessita",    group_name: "Trasporti" },
  { name: "Parcheggio & Pedaggi",      color: "#6366f1", type: "expense", macro_category: "necessita",    group_name: "Trasporti" },
  // Viaggi
  { name: "Attività & Escursioni",     color: "#2dd4bf", type: "expense", macro_category: "svago",        group_name: "Viaggi" },
  { name: "Hotel & Alloggio",          color: "#0284c7", type: "expense", macro_category: "svago",        group_name: "Viaggi" },
  { name: "Voli & Treni",              color: "#0ea5e9", type: "expense", macro_category: "svago",        group_name: "Viaggi" },
  // Entrate
  { name: "Freelance & Extra",         color: "#2dd4bf", type: "income",  macro_category: null,           group_name: "Entrate" },
  { name: "Stipendio",                 color: "#34d399", type: "income",  macro_category: null,           group_name: "Entrate" },
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
