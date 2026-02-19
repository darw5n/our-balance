import { getRecurringTransactions } from "@/lib/supabase/queries/recurring"
import { getCategories } from "@/lib/supabase/queries/categories"
import { RecurringList } from "@/components/dashboard/recurring-list"
import { getServerUser } from "@/lib/supabase-server"

export default async function RecurringPage() {
  const user = await getServerUser()

  if (!user) {
    return null
  }

  const [recurring, categories] = await Promise.all([
    getRecurringTransactions(user.id),
    getCategories(user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transazioni ricorrenti</h1>
        <p className="text-xs text-zinc-400">
          Gestisci entrate e uscite periodiche. Le uscite vengono create automaticamente; le entrate con conferma richiedono il tuo ok.
        </p>
      </div>

      <RecurringList recurring={recurring} categories={categories} />
    </div>
  )
}
