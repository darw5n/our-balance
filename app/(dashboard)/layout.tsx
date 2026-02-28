import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect("/")

  const categories = await getCategories(user.id)

  return (
    <DashboardShell userEmail={user.email ?? null} categories={categories}>
      {children}
    </DashboardShell>
  )
}
