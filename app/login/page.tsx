"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email o password non corretti.",
  "Email not confirmed": "Conferma la tua email prima di accedere.",
  "Too many requests": "Troppi tentativi. Riprova tra qualche minuto.",
  "User not found": "Nessun account trovato con questa email.",
}

function translateError(message: string): string {
  return AUTH_ERRORS[message] ?? message
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(translateError(error.message))
        return
      }

      if (data.session) {
        window.location.href = "/dashboard"
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Wallet className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Bentornato</h1>
            <p className="mt-1 text-sm text-zinc-400">Accedi al tuo account OurBalance</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@esempio.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              disabled={submitting}
            >
              {submitting ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Non hai un account?{" "}
          <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline">
            Registrati gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
