"use client"

import Link, { useLinkStatus } from "next/link"
import { formatAmount } from "@/lib/utils"

type Props = {
  href: string
  shown: number
  total: number
  step: number
}

function LoadMoreLabel({ next }: { next: number }) {
  const { pending } = useLinkStatus()
  return <>{pending ? "Carico…" : `Mostra altre ${next}`}</>
}

/**
 * Carica il blocco successivo della lista. È un link (lo stato vive nell'URL) che sostituisce
 * la voce di cronologia, così "indietro" non ripercorre ogni blocco caricato.
 */
export function LoadMoreLink({ href, shown, total, step }: Props) {
  const next = Math.min(step, total - shown)
  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      <p className="font-sans text-xs text-text-3" aria-live="polite">
        {formatAmount(shown, 0)} di {formatAmount(total, 0)} transazioni
      </p>
      <Link
        href={href}
        replace
        scroll={false}
        className="flex min-h-11 items-center justify-center rounded-full border border-border-subtle bg-surface-1 px-5 font-sans text-sm font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LoadMoreLabel next={next} />
      </Link>
    </div>
  )
}
