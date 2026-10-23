"use client"

import { useState, useEffect, useRef } from "react"
import { Wallet, Eye, EyeOff, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { usePageTransition } from "@/components/landing/transition-provider"

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
  const { navigate } = usePageTransition()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError("Errore durante l'accesso con Google.")
      setGoogleLoading(false)
    }
  }

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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/dashboard`,
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

  async function handleResend() {
    if (resendCooldown > 0) return
    setResendSuccess(false)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${appUrl}/dashboard` },
    })
    if (!error) {
      setResendSuccess(true)
      setResendCooldown(60)
      cooldownRef.current = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(cooldownRef.current!); return 0 }
          return s - 1
        })
      }, 1000)
    }
  }

  // cleanup interval on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full border border-accent-brand/30 bg-accent-brand-bg p-4">
              <Mail className="h-8 w-8 text-accent-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-1">Controlla la email</h1>
              <p className="mt-2 text-sm text-text-2">
                Abbiamo inviato un link di conferma a{" "}
                <span className="font-medium text-text-1">{email}</span>.
              </p>
              <p className="mt-1 text-sm text-text-2">
                Clicca il link per attivare il tuo account.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-1/60 px-6 py-4 text-xs text-text-2 space-y-3">
            <p>
              Non trovi la email? Controlla la cartella spam o{" "}
              <button
                className="text-accent-brand font-medium hover:underline"
                onClick={() => setSuccess(false)}
              >
                riprova con un altro indirizzo
              </button>
              .
            </p>
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-accent-brand font-medium hover:underline disabled:text-text-3 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendSuccess ? "Reinvia di nuovo" : "Reinvia email"}
              </button>
              {resendCooldown > 0 && (
                <p className="text-[11px] text-text-3">
                  Puoi richiedere un nuovo invio tra {resendCooldown}s
                </p>
              )}
              {resendSuccess && resendCooldown === 0 && (
                <p className="text-[11px] text-income-fg">Email inviata ✓</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="inline-block text-xs text-text-3 hover:text-text-1"
          >
            ← Torna al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full border border-accent-brand/30 bg-accent-brand-bg p-3">
            <Wallet className="h-6 w-6 text-accent-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-1">Crea account</h1>
            <p className="mt-1 text-sm text-text-2">Inizia a gestire le tue finanze gratis</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border-subtle bg-surface-1/60 p-6 backdrop-blur">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || submitting}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-1 transition-colors hover:bg-surface-3 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Reindirizzamento..." : "Continua con Google"}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-text-3">oppure</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="email">
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
              <label className="text-xs font-medium text-text-2" htmlFor="password">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-2" htmlFor="confirm-password">
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
                      ? "border-expense/50 focus-visible:ring-expense/30"
                      : confirmPassword && confirmPassword === password
                        ? "border-income/50 focus-visible:ring-income/30"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1"
                  aria-label={showConfirm ? "Nascondi password" : "Mostra password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-expense-fg">Le password non coincidono</p>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-expense/30 bg-expense-subtle px-3 py-2">
                <p className="text-xs text-expense-fg">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent-brand text-white hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Creazione account..." : "Crea account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-2">
          Hai già un account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-accent-brand font-medium underline-offset-2 hover:underline"
          >
            Accedi
          </button>
        </p>
      </div>
    </div>
  )
}
