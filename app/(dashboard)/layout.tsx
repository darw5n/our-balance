"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo sempre visibile */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
              OurBalance
            </Link>

            {/* Nav links: visibili solo su desktop */}
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Transazioni
              </Link>
              <Link href="/budgets" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Budget
              </Link>
              <Link href="/recurring" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Ricorrenti
              </Link>
              <Link href="/reports" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Report
              </Link>
              <Link href="/categories" className="text-xs text-zinc-400 transition-colors hover:text-zinc-50">
                Categorie
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden text-sm text-zinc-300 sm:inline">{userEmail}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-zinc-50 hover:bg-white/5 hover:text-zinc-50"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Padding bottom su mobile per non coprire i contenuti con la bottom nav */}
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-8">{children}</main>

      <BottomNav />
    </div>
  )
}
