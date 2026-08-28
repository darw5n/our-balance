"use client"

import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { updateUserSettings } from "@/app/actions/user-settings"
import type { Theme } from "@/lib/supabase/queries/user-settings"

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60

/** Applica la classe .dark risolvendo 'system', e persiste la scelta nel cookie. */
function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
  document.cookie = `theme=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Chiaro", Icon: Sun },
  { value: "dark", label: "Scuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
]

export function DarkModeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Segue il tema di sistema quando la preferenza è 'system'.
  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => document.documentElement.classList.toggle("dark", mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  function selectTheme(next: Theme) {
    setTheme(next)
    applyTheme(next)
    void updateUserSettings({ theme: next })
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface-1 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => selectTheme(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
