import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/supabase-server"
import { getCategories } from "@/lib/supabase/queries/categories"
import { getUserSettings } from "@/lib/supabase/queries/user-settings"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect("/login")

  const [categories, settings] = await Promise.all([
    getCategories(user.id),
    getUserSettings(user.id),
  ])

  return (
    <DashboardShell userEmail={user.email ?? null} categories={categories} theme={settings.theme}>
      {children}
    </DashboardShell>
  )
}
