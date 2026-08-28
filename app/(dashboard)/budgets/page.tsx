import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { getCategories } from "@/lib/supabase/queries/categories"
import { BudgetsList } from "@/components/dashboard/budgets-list"
import { getServerUser } from "@/lib/supabase-server"

export default async function BudgetsPage() {
  const user = await getServerUser()

  if (!user) {
    return null
  }

  // I budget non hanno uno scope: si calcolano sempre in ottica personale
  // (spese family contate al 50%), coerente con la pagina Categorie.
  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress(user.id, "personal"),
    getCategories(user.id),
  ])

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id))
  const categoriesWithoutBudget = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Budget</h1>
        <p className="font-sans text-xs text-text-3 mt-1">
          Imposta limiti di spesa mensili per categoria e monitora i progressi.
        </p>
      </div>

      <BudgetsList
        budgets={budgets}
        categoriesWithoutBudget={categoriesWithoutBudget}
        hasCategories={categories.length > 0}
      />
    </div>
  )
}
