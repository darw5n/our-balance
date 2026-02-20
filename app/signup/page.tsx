"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Eye, EyeOff, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const AUTH_ERRORS: Record<string, string> = {
  "User already registered": "Esiste già un account con questa email.",
  "Password should be at least 6 characters": "La password deve essere di almeno 6 caratteri.",
  "Unable to validate email address: invalid format": "Formato email non valido.",
  "Too many requests": "Troppi tentativi. Riprova tra qualche minuto.",
}

function translateError(message: string): string {
  return AUTH_ERRORS[message] ?? message
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Le password non coincidono.")
      return
    }

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri.")
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setError(translateError(error.message))
        return
      }

      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-4">
              <Mail className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Controlla la email</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Abbiamo inviato un link di conferma a{" "}
                <span className="font-medium text-zinc-200">{email}</span>.
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Clicca il link per attivare il tuo account.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-6 py-4 text-xs text-zinc-400">
            Non trovi la email? Controlla la cartella spam o{" "}
            <button
              className="text-emerald-400 hover:text-emerald-300"
              onClick={() => setSuccess(false)}
            >
              riprova con un altro indirizzo
            </button>
            .
          </div>
          <Link href="/login" className="inline-block text-xs text-zinc-400 hover:text-zinc-200">
            ← Torna al login
          </Link>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Crea account</h1>
            <p className="mt-1 text-sm text-zinc-400">Inizia a gestire le tue finanze gratis</p>
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
                  placeholder="Minimo 6 caratteri"
                  required
                  autoComplete="new-password"
                  minLength={6}
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300" htmlFor="confirm-password">
                Conferma password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  required
                  autoComplete="new-password"
                  className={`pr-10 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-rose-500/50 focus-visible:ring-rose-500/30"
                      : confirmPassword && confirmPassword === password
                        ? "border-emerald-500/50 focus-visible:ring-emerald-500/30"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  aria-label={showConfirm ? "Nascondi password" : "Mostra password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-rose-400">Le password non coincidono</p>
              )}
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
              {submitting ? "Creazione account..." : "Crea account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Hai già un account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
