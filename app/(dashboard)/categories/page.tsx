import { getServerUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { createDefaultCategories } from "@/app/actions/categories"
import { CategoriesList } from "@/components/dashboard/categories-list"

export default async function CategoriesPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")

  // getCategories è già in cache: la legge anche il layout.
  const [categories, budgets] = await Promise.all([
    getCategories(user.id),
    getBudgetsWithProgress(user.id, "personal"),
  ])

  // Auto-seed default categories for new users, poi ricarica per leggerle.
  if (categories.length === 0) {
    const seeded = await createDefaultCategories()
    if (seeded.created > 0) redirect("/categories")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Categorie</h1>
        <p className="font-sans text-xs text-text-3 mt-1">
          Gestisci le categorie per classificare le tue transazioni (es. Alimentari, Trasporti).
        </p>
      </div>

      <CategoriesList categories={categories} budgets={budgets} />
    </div>
  )
}
