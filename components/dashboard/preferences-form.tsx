"use client"

import { useState, useTransition } from "react"
import { Sun, Moon, Monitor, User, Users } from "lucide-react"
import { updateUserSettings } from "@/app/actions/user-settings"
import type { Theme, UserSettings } from "@/lib/supabase/queries/user-settings"
import { useToast } from "@/components/ui/toast-provider"

const THEME_OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Chiaro", Icon: Sun },
  { value: "dark", label: "Scuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
]

const VIEW_OPTIONS: { value: "personal" | "family"; label: string; Icon: typeof User }[] = [
  { value: "personal", label: "Personale", Icon: User },
  { value: "family", label: "In comune", Icon: Users },
]

function applyThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function PreferencesForm({ settings }: { settings: UserSettings }) {
  const toast = useToast()
  const [theme, setTheme] = useState<Theme>(settings.theme)
  const [defaultView, setDefaultView] = useState(settings.defaultView)
  const [isPending, startTransition] = useTransition()

  function save(patch: Parameters<typeof updateUserSettings>[0]) {
    startTransition(async () => {
      const result = await updateUserSettings(patch)
      if (!result.success) toast(result.error ?? "Errore nel salvataggio.", "error")
    })
  }

  function selectTheme(next: Theme) {
    setTheme(next)
    applyThemeCookie(next)
    save({ theme: next })
  }

  function selectView(next: "personal" | "family") {
    setDefaultView(next)
    save({ default_view: next })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-2">
          <Monitor className="h-4 w-4 text-text-2" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-text-1">Preferenze</h2>
          <p className="mt-0.5 text-xs text-text-2">Aspetto e vista predefinita dell&apos;app.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-2">Tema</p>
        <div role="radiogroup" aria-label="Tema" className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => selectTheme(value)}
                disabled={isPending}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent-brand bg-accent-brand-bg text-accent-brand"
                    : "border-border-subtle bg-transparent text-text-2 hover:text-text-1"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-2">Vista predefinita</p>
        <div role="radiogroup" aria-label="Vista predefinita" className="flex gap-2">
          {VIEW_OPTIONS.map(({ value, label, Icon }) => {
            const active = defaultView === value
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => selectView(value)}
                disabled={isPending}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent-brand bg-accent-brand-bg text-accent-brand"
                    : "border-border-subtle bg-transparent text-text-2 hover:text-text-1"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-text-3">
          Dashboard e report si aprono in questa vista quando non è specificata nell&apos;URL.
        </p>
      </div>
    </div>
  )
}
