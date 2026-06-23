import { getBudgetsWithProgress } from "@/lib/supabase/queries/budgets"
import { getCategories } from "@/lib/supabase/queries/categories"
import { BudgetsList } from "@/components/dashboard/budgets-list"
import { getServerUser } from "@/lib/supabase-server"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import type { ViewMode } from "@/lib/supabase/queries/transactions"

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>
}) {
  const user = await getServerUser()
  const params = await searchParams
  const view = params?.view
  const viewMode: ViewMode = view === "family" ? "family" : "personal"

  if (!user) {
    return null
  }

  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress(user.id, viewMode),
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

      <ViewModeSwitcher currentView={viewMode} basePath="/budgets" />

      <BudgetsList
        budgets={budgets}
        categoriesWithoutBudget={categoriesWithoutBudget}
        hasCategories={categories.length > 0}
      />
    </div>
  )
}
