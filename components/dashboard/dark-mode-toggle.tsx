"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    setIsDark(html.classList.contains("dark"))

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"))
    })
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  function toggle() {
    const html = document.documentElement
    const currentlyDark = html.classList.contains("dark")
    const next = !currentlyDark

    if (next) {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }

    // Cookie per server-side rendering (persiste su refresh, letto da layout.tsx)
    const age = 365 * 24 * 60 * 60
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=${age}; SameSite=Lax`

    setIsDark(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Attiva tema chiaro" : "Attiva tema scuro"}
      className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-border-subtle bg-surface-1 transition-colors hover:bg-surface-2"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-pending-fg" />
      ) : (
        <Moon className="h-4 w-4 text-text-3" />
      )}
    </button>
  )
}
