import { createSupabaseServerClient } from "@/lib/supabase-server"

export type Category = {
  id: string
  name: string
  color: string
  type: string
  user_id?: string
}

export async function getCategories(userId: string): Promise<Category[]> {
  if (!userId) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, color, type, user_id")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) {
    console.error("[getCategories] Error:", error)
    return []
  }

  return (data ?? []) as Category[]
}
