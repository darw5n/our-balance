import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { getCategories } from "@/lib/supabase/queries/categories"
import { BudgetsList } from "@/components/dashboard/budgets-list"
import { getServerUser } from "@/lib/supabase-server"

export default async function BudgetsPage() {
  const user = await getServerUser()

  if (!user) {
    return null
  }

  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress(user.id),
    getCategories(user.id),
  ])

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id))
  const categoriesWithoutBudget = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="text-xs text-zinc-400">
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
