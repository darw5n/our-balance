import { getServerUser, createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { createDefaultCategories } from "@/app/actions/categories"
import { CategoriesList } from "@/components/dashboard/categories-list"

export default async function CategoriesPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")

  // Auto-seed default categories for new users
  const supabase = await createSupabaseServerClient()
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
  if (!count) await createDefaultCategories()

  const [categories, budgets] = await Promise.all([
    getCategories(user.id),
    getBudgetsWithProgress(user.id, "personal"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorie</h1>
        <p className="text-xs text-zinc-400">
          Gestisci le categorie per classificare le tue transazioni (es. Alimentari, Trasporti).
        </p>
      </div>

      <CategoriesList categories={categories} budgets={budgets} />
    </div>
  )
}
