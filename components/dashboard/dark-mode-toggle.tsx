"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

export function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Attiva tema chiaro" : "Attiva tema scuro"}
      className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-border-subtle bg-surface-1 transition-colors hover:bg-surface-2"
    >
      {dark ? (
        <Sun className="h-4 w-4 text-pending-fg" />
      ) : (
        <Moon className="h-4 w-4 text-text-3" />
      )}
    </button>
  )
}
