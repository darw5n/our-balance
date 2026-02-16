"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // TODO: replace with real auth user email (Supabase session)
  const userEmail = "user@example.com"
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            OurBalance
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-300 sm:inline">{userEmail}</span>
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-zinc-50 hover:bg-white/5 hover:text-zinc-50"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

