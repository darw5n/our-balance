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

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/transactions", label: "Transazioni",  icon: ArrowLeftRight },
  { href: "/reports",      label: "Report",       icon: BarChart2 },
  { href: "/recurring",    label: "Programmati",  icon: Repeat },
]

const SECONDARY_NAV = [
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

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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

  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-text-1">

      {/* Top bar — sticky, full width, content centered */}
      <header className="sticky top-0 z-50 bg-surface-overlay backdrop-blur-xl border-b border-border-subtle">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 pt-3.5 pb-2.5">

          {/* Left: greeting + username */}
          <div>
            <p className="font-sans text-[11px] text-text-3">Buongiorno 👋</p>
            <p className="font-serif text-[20px] font-semibold text-text-1 leading-tight capitalize">
              {userName}
            </p>
          </div>

          {/* Center: desktop navigation (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm transition-all duration-200 ease-out ${
                    active
                      ? "bg-accent-brand-bg text-accent-brand font-semibold"
                      : "text-text-2 hover:bg-surface-2 hover:text-text-1"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.2 : 1.7} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right: dark mode toggle + avatar */}
          <div className="flex items-center gap-2.5">
            <DarkModeToggle />

            {/* Avatar — opens secondary dropdown */}
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
                      className={`flex items-center gap-3 rounded-[14px] px-3 py-2 font-sans text-sm transition-colors ${
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

      {/* Page content — centered, responsive max-width */}
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-3 pb-32 md:pb-10">
        {children}
      </main>

      {/* FAB — floats above bottom nav on mobile, bottom-right on desktop */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="Aggiungi transazione"
        className={[
          "fixed z-50 flex items-center justify-center rounded-full text-white",
          "shadow-[0_4px_24px_rgba(200,90,58,0.4)] transition-all duration-200 active:scale-95",
          // Mobile: centered above bottom nav
          "bottom-[72px] left-1/2 h-[58px] w-[58px] -translate-x-1/2",
          // Desktop: bottom-right corner, slightly larger context
          "md:bottom-8 md:right-8 md:left-auto md:translate-x-0 md:h-[54px] md:w-[54px]",
        ].join(" ")}
        style={{ backgroundColor: "var(--accent-brand)" }}
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Bottom nav — mobile only, 4 items (no FAB slot) */}
      <nav
        className="md:hidden fixed bottom-0 left-1/2 z-40 w-full max-w-[640px] -translate-x-1/2 border-t border-border-subtle bg-surface-overlay backdrop-blur-2xl"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
