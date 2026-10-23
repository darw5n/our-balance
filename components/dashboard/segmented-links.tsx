"use client"

import { useState } from "react"
import Link from "next/link"

type Segment = { value: string; label: string; href: string }

type SegmentedLinksProps = {
  segments: Segment[]
  active: string
  /** Con un nome, il gruppo diventa un tablist (role="tab" + aria-selected). */
  tabsLabel?: string
  replace?: boolean
}

/**
 * Controllo a segmenti fatto di link (lo stato vive nell'URL).
 * L'indicatore scorre sul segmento scelto appena lo tocchi, senza aspettare
 * la risposta del server: il feedback è immediato anche se i dati arrivano dopo.
 */
export function SegmentedLinks({ segments, active, tabsLabel, replace }: SegmentedLinksProps) {
  // Scelta "in volo": vale solo finché l'URL non è cambiato davvero.
  const [pending, setPending] = useState<{ from: string; value: string } | null>(null)
  const shown = pending && pending.from === active ? pending.value : active
  const shownIndex = Math.max(0, segments.findIndex((s) => s.value === shown))

  return (
    <div
      role={tabsLabel ? "tablist" : undefined}
      aria-label={tabsLabel}
      className="relative flex w-full rounded-[14px] border border-border-subtle bg-surface-2 p-[3px]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-[3px] left-[3px] rounded-full bg-surface-1 transition-transform duration-[var(--t-ui)] ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{
          width: `calc((100% - 6px) / ${segments.length})`,
          transform: `translateX(${shownIndex * 100}%)`,
        }}
      />
      {segments.map(({ value, label, href }) => {
        const isShown = value === shown
        return (
          <Link
            key={value}
            href={href}
            replace={replace}
            scroll={false}
            role={tabsLabel ? "tab" : undefined}
            aria-selected={tabsLabel ? isShown : undefined}
            aria-current={!tabsLabel && isShown ? "page" : undefined}
            onClick={() => setPending({ from: active, value })}
            className={`relative z-10 flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full px-3 py-2 font-sans text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isShown ? "text-text-1" : "text-text-3 hover:text-text-2"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
