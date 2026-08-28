import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { ViewMode } from "@/lib/supabase/queries/transactions"

export type Theme = "light" | "dark" | "system"

export type UserSettings = {
  theme: Theme
  defaultView: ViewMode
}

const DEFAULTS: UserSettings = { theme: "system", defaultView: "personal" }

/**
 * Preferenze utente dalla tabella `profiles`. Se la riga non esiste ancora
 * (nessun trigger la crea alla registrazione), ritorna i default.
 */
export const getUserSettings = cache(async function getUserSettings(
  userId: string
): Promise<UserSettings> {
  if (!userId) return { ...DEFAULTS }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("profiles")
    .select("theme, default_view")
    .eq("id", userId)
    .single()

  if (!data) return { ...DEFAULTS }

  const theme: Theme =
    data.theme === "light" || data.theme === "dark" ? data.theme : "system"
  // La colonna ammette anche 'both': lo trattiamo come 'personal' per lo switcher.
  const defaultView: ViewMode = data.default_view === "family" ? "family" : "personal"

  return { theme, defaultView }
})
