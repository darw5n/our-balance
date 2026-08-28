"use server"

import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { createAdminClient } from "@/lib/supabase-admin"
import { getServerUser } from "@/lib/supabase-server"
import { MCP_TOKEN_PREFIX, hashToken } from "@/lib/mcp/token"

export type ApiTokenInfo = {
  id: string
  created_at: string
  last_used_at: string | null
}

export async function getApiTokenInfo(): Promise<ApiTokenInfo | null> {
  const user = await getServerUser()
  if (!user?.id) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from("api_tokens")
    .select("id, created_at, last_used_at")
    .eq("user_id", user.id)
    .single()

  return data ?? null
}

export async function generateApiToken(): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  const user = await getServerUser()
  if (!user?.id) return { success: false, error: "Non autenticato." }

  const admin = createAdminClient()

  // Rimuove eventuale token esistente
  await admin.from("api_tokens").delete().eq("user_id", user.id)

  const token = MCP_TOKEN_PREFIX + randomBytes(32).toString("hex")

  const { error } = await admin.from("api_tokens").insert({
    user_id: user.id,
    token_hash: hashToken(token),
    name: "Claude MCP",
    last_used_at: null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/settings")
  return { success: true, token }
}

export async function revokeApiToken(): Promise<
  { success: true } | { success: false; error: string }
> {
  const user = await getServerUser()
  if (!user?.id) return { success: false, error: "Non autenticato." }

  const admin = createAdminClient()
  const { error } = await admin.from("api_tokens").delete().eq("user_id", user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/settings")
  return { success: true }
}
