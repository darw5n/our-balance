"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { ActionResult } from "@/lib/types/actions"
import type { Theme } from "@/lib/supabase/queries/user-settings"

export type UserSettingsPatch = {
  theme?: Theme
  default_view?: "personal" | "family"
}

export async function updateUserSettings(patch: UserSettingsPatch): Promise<ActionResult> {
  const user = await getServerUser()
  if (!user?.id) return { success: false, error: "Utente non autenticato." }

  const payload: Record<string, unknown> = { id: user.id }
  if (patch.theme !== undefined) payload.theme = patch.theme
  if (patch.default_view !== undefined) payload.default_view = patch.default_view

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" })

  if (error) {
    console.error("[updateUserSettings] Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/reports")
  revalidatePath("/settings")
  return { success: true }
}
