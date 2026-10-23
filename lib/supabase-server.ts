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
 * Client con i cookie letti subito, da usare dentro `after()` in una pagina:
 * lì `cookies()` non è più leggibile, quindi la richiesta va "fotografata" prima.
 * Solo lettura dei cookie: dopo la risposta non si possono più scrivere.
 */
export async function createSupabaseClientForAfter() {
  const cookieList = (await cookies()).getAll()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieList
        },
        setAll() {
          // La risposta è già partita: niente da scrivere.
        },
      },
    }
  )
}

/**
 * Ottiene l'utente autenticato dal server.
 * Restituisce null se non autenticato.
 *
 * Usa `getClaims()`: verifica la firma del JWT in locale (con le chiavi
 * pubbliche del progetto, messe in cache) invece di chiamare il server Auth
 * a ogni richiesta come `getUser()`. Restituisce solo i campi che l'app usa.
 * Avvolto in `cache()` di React per deduplicare layout e pagina nella stessa richiesta.
 */
export const getServerUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getClaims()

    if (error) {
      console.error("[getServerUser] Auth error:", error.message)
      return null
    }
    if (!data?.claims?.sub) return null

    return { id: data.claims.sub, email: data.claims.email ?? null }
  } catch (error) {
    console.error("[getServerUser] Unexpected error:", error)
    return null
  }
})
