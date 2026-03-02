"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Plus,
  Wallet,
  Tag,
  Repeat,
  LogOut,
  User,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import type { Category } from "@/lib/supabase/queries/categories"

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transazioni", icon: ArrowLeftRight },
  { href: "/reports", label: "Report", icon: BarChart2 },
]

const SECONDARY_NAV = [
  { href: "/budgets", label: "Budget", icon: Wallet },
  { href: "/categories", label: "Categorie", icon: Tag },
]

type Props = {
  children: React.ReactNode
  userEmail: string | null
  categories: Category[]
}

export function DashboardShell({ children, userEmail, categories }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const isSecondaryActive = SECONDARY_NAV.some((l) => isActive(l.href))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Left: logo + primary nav (desktop) */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="mr-4 text-sm font-semibold tracking-tight">
              OurBalance
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {PRIMARY_NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive(href)
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: secondary menu */}
          <div className="flex items-center gap-2">
            {/* Secondary menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu account"
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  menuOpen || isSecondaryActive
                    ? "border-white/20 bg-zinc-800 text-zinc-50"
                    : "border-white/10 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <User className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-xl">
                  {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(href)
                          ? "bg-zinc-800 text-zinc-50"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}

                  <div className="my-1.5 border-t border-white/10" />

                  {userEmail && (
                    <p className="truncate px-3 py-2 text-xs text-zinc-500">{userEmail}</p>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Esci
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-8">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/95 backdrop-blur md:hidden">
        <div className="flex">
          {/* Dashboard */}
          {[
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/transactions", label: "Transazioni", icon: ArrowLeftRight },
          ].map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}

          {/* + central elevated */}
          <div className="flex h-16 flex-1 items-center justify-center">
            <button
              onClick={() => setAddOpen(true)}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
              aria-label="Aggiungi transazione"
            >
              <Plus className="h-6 w-6 stroke-[2.5] text-zinc-950" />
            </button>
          </div>

          {/* Report + Programmati */}
          {[
            { href: "/reports", label: "Report", icon: BarChart2 },
            { href: "/recurring", label: "Programmati", icon: Repeat },
          ].map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop FAB — solo su dashboard e transazioni */}
      {(pathname === "/dashboard" || pathname.startsWith("/transactions")) && (
        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-400 active:scale-95 md:flex"
          aria-label="Aggiungi transazione"
        >
          <Plus className="h-6 w-6 stroke-[2.5] text-zinc-950" />
        </button>
      )}

      {/* Global add transaction dialog */}
      <AddTransactionDialog
        categories={categories}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}
