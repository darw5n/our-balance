"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { SegmentedLinks } from "@/components/dashboard/segmented-links"

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
    <SegmentedLinks
      segments={TABS.map(({ value, label }) => ({ value, label, href: hrefFor(value) }))}
      active={active}
      tabsLabel="Vista transazioni"
    />
  )
}
