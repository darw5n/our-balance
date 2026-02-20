import { createSupabaseServerClient } from "@/lib/supabase-server"

export type MacroCategory = "necessita" | "svago" | "investimenti"

export type Category = {
  id: string
  name: string
  color: string
  type: string
  user_id?: string
  macro_category?: MacroCategory | null
}

export async function getCategories(userId: string): Promise<Category[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, color, type, user_id, macro_category")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) {
    console.error("[getCategories] Error:", error)
    return []
  }

  return (data ?? []) as Category[]
}
