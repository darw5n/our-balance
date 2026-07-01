import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

/**
 * Crea un Supabase client server-side con gestione corretta dei cookie
 * Usa questo nelle Server Actions e Route Handlers
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In server components il set dei cookie non è permesso — ignorabile.
            // In server actions e route handlers, funziona correttamente.
          }
        },
      },
    }
  )
}

/**
 * Ottiene l'utente autenticato dal server.
 * Restituisce null se non autenticato.
 *
 * Avvolto in `cache()` di React: `supabase.auth.getUser()` fa una richiesta
 * di rete per validare il token, e questa funzione viene chiamata sia nel
 * layout che nella pagina. `cache()` deduplica le chiamate nella stessa
 * richiesta server, evitando round-trip di rete ripetuti a ogni navigazione.
 */
export const getServerUser = cache(async () => {
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
})
