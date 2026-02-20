"use client"

import { createBrowserClient } from "@supabase/ssr"

/**
 * Client Supabase per uso client-side
 * Gestisce correttamente i cookie per Next.js
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)