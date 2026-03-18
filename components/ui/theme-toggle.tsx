"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8" />

  function cycleTheme() {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <button
      onClick={cycleTheme}
      aria-label="Cambia tema"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--subtle-text)] transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
