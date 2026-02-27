"use server"

import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"

/**
 * Looks at the user's past transactions to suggest a category_id
 * based on the description and transaction type.
 *
 * Strategy:
 * 1. Full description ILIKE match → find most-used category
 * 2. If no result, fallback to individual words (≥3 chars)
 */
export async function suggestCategory(
  description: string,
  type: string
): Promise<string | null> {
  const desc = description.trim()
  if (desc.length < 3) return null

  const user = await getServerUser()
  if (!user) return null

  const supabase = await createSupabaseServerClient()

  function mostCommon(rows: { category_id: string | null }[]): string | null {
    const counts = new Map<string, number>()
    for (const row of rows) {
      if (row.category_id) {
        counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
      }
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return best?.[0] ?? null
  }

  // 1. Full description match
  const { data: exact } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("user_id", user.id)
    .eq("type", type)
    .not("category_id", "is", null)
    .ilike("description", `%${desc}%`)
    .order("date", { ascending: false })
    .limit(20)

  if (exact && exact.length > 0) {
    const result = mostCommon(exact as { category_id: string | null }[])
    if (result) return result
  }

  // 2. Fallback: individual words ≥ 3 chars
  const words = desc.split(/\s+/).filter((w) => w.length >= 3)
  if (words.length === 0) return null

  const orFilter = words.map((w) => `description.ilike.%${w}%`).join(",")

  const { data: partial } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("user_id", user.id)
    .eq("type", type)
    .not("category_id", "is", null)
    .or(orFilter)
    .order("date", { ascending: false })
    .limit(30)

  if (!partial || partial.length === 0) return null
  return mostCommon(partial as { category_id: string | null }[])
}
