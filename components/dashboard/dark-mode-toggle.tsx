"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const html = document.documentElement

    // Sync initial state from DOM (the anti-flash script may have already applied the class)
    setIsDark(html.classList.contains("dark"))

    // Stay in sync if something external changes the class (e.g. OS preference, devtools)
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"))
    })
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  function toggle() {
    const html = document.documentElement
    // Always read current state from DOM — never rely on possibly-stale React state
    const currentlyDark = html.classList.contains("dark")
    const next = !currentlyDark

    if (next) {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }

    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch {
      // localStorage can be unavailable in some contexts
    }
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
