import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Crea un Supabase client server-side con gestione corretta dei cookie
 * Usa questo nelle Server Actions e Route Handlers
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  // Debug: log available cookies
  if (process.env.NODE_ENV === "development") {
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter((c) =>
      c.name.includes("supabase") || c.name.includes("sb-")
    )
    console.log("[SupabaseServer] Available Supabase cookies:", supabaseCookies.length)
    if (supabaseCookies.length > 0) {
      console.log("[SupabaseServer] Cookie names:", supabaseCookies.map((c) => c.name))
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Actions, i cookie vengono gestiti automaticamente dal middleware
          // Non possiamo settare cookie direttamente qui, ma possiamo loggarli per debug
          if (process.env.NODE_ENV === "development") {
            console.log("[SupabaseServer] Cookies to set:", cookiesToSet.length)
            cookiesToSet.forEach(({ name }) => {
              console.log("[SupabaseServer] Setting cookie:", name)
            })
          }
        },
      },
    }
  )
}

/**
 * Ottiene l'utente autenticato dal server
 * Restituisce null se non autenticato
 */
export async function getServerUser() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("[getServerUser] Auth error:", error.message)
      return null
    }

    return user
  } catch (error) {
    console.error("[getServerUser] Unexpected error:", error)
    return null
  }
}
