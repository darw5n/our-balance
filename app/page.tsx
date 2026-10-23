import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export default async function Home() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // RSC: solo lettura
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()

  if (data?.claims?.sub) {
    redirect("/dashboard")
  }

  return <LandingPage />
}
