import { getRecurringTransactions } from "@/lib/supabase/queries/recurring"
import { getCategories } from "@/lib/supabase/queries/categories"
import { RecurringList } from "@/components/dashboard/recurring-list"
import { getServerUser } from "@/lib/supabase-server"
import { Card } from "@/components/ui/card"

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
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Programmati</h1>
        <p className="font-sans text-xs text-text-3 mt-1">Spese ricorrenti e obiettivi di risparmio.</p>
      </div>

      <RecurringList recurring={recurring} categories={categories} />

      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1 mb-4">Obiettivi di risparmio</h2>
        <p className="font-sans text-sm text-text-3 text-center py-6">
          Prossimamente: imposta obiettivi di risparmio e tieni traccia dei progressi.
        </p>
      </Card>
    </div>
  )
}
