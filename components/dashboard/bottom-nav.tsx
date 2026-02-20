"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { LayoutDashboard, ArrowLeftRight, BarChart2, MoreHorizontal, Wallet, RefreshCw, Tag, X } from "lucide-react"

const PRIMARY_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transazioni", icon: ArrowLeftRight },
  { href: "/reports", label: "Report", icon: BarChart2 },
]

const MORE_LINKS = [
  { href: "/budgets", label: "Budget", icon: Wallet },
  { href: "/recurring", label: "Ricorrenti", icon: RefreshCw },
  { href: "/categories", label: "Categorie", icon: Tag },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close overlay on outside click
  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [moreOpen])

  // Close overlay on navigation
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const isMoreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href))

  return (
    <>
      {/* More overlay */}
      {moreOpen && (
        <div
          ref={overlayRef}
          className="fixed bottom-16 left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl md:hidden"
        >
          <div className="mb-1 flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-medium text-zinc-400">Altro</span>
            <button onClick={() => setMoreOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {MORE_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname.startsWith(href)
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-stretch">
          {PRIMARY_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-emerald-400" : ""}`} />
                {label}
              </Link>
            )
          })}

          {/* Altro tab */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              isMoreActive || moreOpen ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <MoreHorizontal className={`h-5 w-5 ${isMoreActive || moreOpen ? "stroke-emerald-400" : ""}`} />
            Altro
          </button>
        </div>
      </nav>
    </>
  )
}
