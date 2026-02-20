import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function Home() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // RSC: solo lettura
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se l'utente è autenticato, redirect alla dashboard
  if (user) {
    redirect("/dashboard")
  }

  // Altrimenti mostra landing page con link al login
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-4">
            <Wallet className="h-12 w-12 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            OurBalance
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-400">
            Gestisci le tue finanze personali in modo semplice e intuitivo. Traccia entrate,
            uscite e mantieni il controllo del tuo bilancio.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg" }), "bg-emerald-500 text-zinc-950 hover:bg-emerald-400")}
          >
            Accedi
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/15 bg-transparent text-zinc-50 hover:bg-white/5")}
          >
            Registrati
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Traccia le spese</h3>
            <p className="text-xs text-zinc-400">
              Registra tutte le tue transazioni in modo rapido e organizzato.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Visualizza i grafici</h3>
            <p className="text-xs text-zinc-400">
              Analizza il tuo cashflow e le categorie di spesa con grafici interattivi.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Controlla il bilancio</h3>
            <p className="text-xs text-zinc-400">
              Monitora entrate, uscite e il tuo saldo netto in tempo reale.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
