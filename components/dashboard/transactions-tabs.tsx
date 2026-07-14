"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const TABS = [
  { value: "lista", label: "Lista" },
  { value: "confronto", label: "Confronto" },
]

/**
 * Switcher tra la lista transazioni e la vista di confronto.
 * Guidato da URL (?tab=confronto), così lo stato è condivisibile via link.
 */
export function TransactionsTabs({ active }: { active: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function hrefFor(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "confronto") {
      params.set("tab", "confronto")
    } else {
      // Torna alla lista: rimuovi i parametri specifici del confronto
      params.delete("tab")
      params.delete("cat")
      params.delete("y1")
      params.delete("y2")
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div
      role="tablist"
      aria-label="Vista transazioni"
      className="flex w-full rounded-[14px] border border-border-subtle bg-surface-2 p-[3px]"
    >
      {TABS.map(({ value, label }) => {
        const isActive = active === value
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            role="tab"
            aria-selected={isActive}
            prefetch
            scroll={false}
            className={`flex flex-1 items-center justify-center whitespace-nowrap px-3 py-2 font-sans text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
              isActive
                ? "rounded-full bg-surface-1 text-text-1 shadow-sm"
                : "rounded-[10px] bg-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
