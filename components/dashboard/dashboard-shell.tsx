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
  Settings,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import { DarkModeToggle } from "@/components/dashboard/dark-mode-toggle"
import type { Category } from "@/lib/supabase/queries/categories"

const BOTTOM_NAV = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/transactions", label: "Transazioni",  icon: ArrowLeftRight },
  { id: "ADD" } as const,
  { href: "/reports",      label: "Report",       icon: BarChart2 },
  { href: "/recurring",    label: "Programmati",  icon: Repeat },
]

const SECONDARY_NAV = [
  { href: "/recurring",   label: "Programmati",  icon: Repeat },
  { href: "/budgets",     label: "Budget",        icon: Wallet },
  { href: "/categories",  label: "Categorie",     icon: Tag },
  { href: "/settings",    label: "Impostazioni",  icon: Settings },
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

  // Listen for global open-add-transaction event (from NlQuickAddBar etc.)
  useEffect(() => {
    const handler = () => setAddOpen(true)
    window.addEventListener("open-add-transaction", handler)
    return () => window.removeEventListener("open-add-transaction", handler)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const userName = userEmail ? userEmail.split("@")[0] : "…"
  const userInitial = userName.charAt(0).toUpperCase()
  const isSecondaryActive = SECONDARY_NAV.some((l) => isActive(l.href))

  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-text-1">
      {/* Centered column wrapper */}
      <div className="mx-auto w-full max-w-[430px] flex-1 flex flex-col">

        {/* Top bar */}
        <header className="sticky top-0 z-50 bg-surface-overlay backdrop-blur-xl px-5 pt-3.5 pb-2">
          <div className="flex items-center justify-between">
            {/* Left: greeting + name */}
            <div>
              <p className="font-sans text-[11px] text-text-3">Buongiorno 👋</p>
              <p className="font-serif text-[22px] font-semibold text-text-1 leading-tight capitalize">
                {userName}
              </p>
            </div>

            {/* Right: dark mode toggle + avatar */}
            <div className="flex items-center gap-2.5">
              <DarkModeToggle />

              {/* Avatar button — opens secondary menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu account"
                  className="flex h-9 w-9 items-center justify-center rounded-full font-sans text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent-brand)" }}
                >
                  {userInitial}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-[22px] border border-border-subtle bg-surface-1 p-1.5 shadow-xl">
                    {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-sans transition-colors ${
                          isActive(href)
                            ? "bg-surface-2 text-text-1"
                            : "text-text-2 hover:bg-surface-2 hover:text-text-1"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}

                    <div className="my-1.5 border-t border-border-subtle" />

                    {userEmail && (
                      <p className="truncate px-3 py-2 font-sans text-xs text-text-3">{userEmail}</p>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 font-sans text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-expense-fg"
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

        {/* Page content */}
        <main className="flex-1 px-4 pb-28 pt-2">{children}</main>
      </div>

      {/* Bottom nav — fixed, centered, full-width capped at 430px */}
      <nav
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border-subtle bg-surface-overlay backdrop-blur-2xl"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          {BOTTOM_NAV.map((item) => {
            if ("id" in item && item.id === "ADD") {
              return (
                <button
                  key="ADD"
                  onClick={() => setAddOpen(true)}
                  aria-label="Aggiungi transazione"
                  className="flex h-[54px] w-[54px] items-center justify-center rounded-full text-white shadow-[0_4px_20px_rgba(200,90,58,0.35)] transition-transform active:scale-95"
                  style={{ backgroundColor: "var(--accent-brand)" }}
                >
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </button>
              )
            }

            const { href, label, icon: Icon } = item as { href: string; label: string; icon: React.ElementType }
            const active = isActive(href)

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-[3px] pb-1"
              >
                <div
                  className={`flex h-[38px] w-[38px] items-center justify-center transition-all duration-200 ease-out ${
                    active ? "rounded-full bg-accent-brand-bg" : "rounded-[12px] bg-transparent"
                  }`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] transition-colors ${
                      active ? "text-accent-brand" : "text-text-3"
                    }`}
                    strokeWidth={active ? 2.2 : 1.7}
                  />
                </div>
                <span
                  className={`font-sans text-[9.5px] transition-colors ${
                    active ? "font-semibold text-accent-brand" : "font-normal text-text-3"
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Global add transaction dialog */}
      <AddTransactionDialog
        categories={categories}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}
