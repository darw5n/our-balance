"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

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
 * `true` se l'utente ha chiesto meno movimento nelle impostazioni di sistema.
 * Stesso schema di `useIsMobile`: niente render a cascata.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
