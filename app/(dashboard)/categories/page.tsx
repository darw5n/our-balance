import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCategories } from "@/lib/supabase/queries/categories"
import { CategoriesList } from "@/components/dashboard/categories-list"

export default async function CategoriesPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const categories = await getCategories(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorie</h1>
        <p className="text-xs text-zinc-400">
          Gestisci le categorie per classificare le tue transazioni (es. Alimentari, Trasporti).
        </p>
      </div>

      <CategoriesList categories={categories} />
    </div>
  )
}
