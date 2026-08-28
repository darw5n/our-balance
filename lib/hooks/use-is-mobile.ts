"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(max-width: 639px)"

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * `true` sotto i 640px di larghezza (breakpoint `sm` di Tailwind).
 * Basato su `useSyncExternalStore` per stare in sync senza cascading render.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
