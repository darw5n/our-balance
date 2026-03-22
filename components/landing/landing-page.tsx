"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "motion/react"
import { usePageTransition } from "@/components/landing/transition-provider"
import {
  ArrowRight,
  Wallet,
  BarChart2,
  ArrowLeftRight,
  Users,
  TrendingUp,
  ShieldCheck,
  Heart,
  Banknote,
  Building2,
  ShoppingBasket,
  ChefHat,
  Briefcase,
} from "lucide-react"


/* ─────────────────────────────────────────
   FADE UP
───────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   COUNTER ANIMATO
───────────────────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 50, damping: 16 })
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState("+€0,00")

  useEffect(() => {
    const unsub = spring.on("change", (v) =>
      setDisplay(`+€${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    )
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) motionVal.set(value) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => { unsub(); observer.disconnect() }
  }, [motionVal, spring, value])

  return <span ref={ref}>{display}</span>
}

/* ─────────────────────────────────────────
   AREA CHART SVG (coerente con l'app)
───────────────────────────────────────── */
const AREA_LINE = "M0,48 C8,44 14,36 24,32 C34,28 40,38 52,30 C64,22 70,14 82,16 C94,18 100,28 112,22 C124,16 130,8 142,10 C154,12 160,18 172,14 C184,10 192,6 200,8"
const AREA_FILL = `${AREA_LINE} L200,60 L0,60 Z`

function AreaChartMock() {
  const [drawn, setDrawn] = useState(false)
  const ref = useRef<SVGPathElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setDrawn(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="rounded-xl bg-zinc-800/50 p-4">
      <p className="mb-3 text-[10px] font-medium text-zinc-500">Cashflow · ultimi 12 mesi</p>
      <svg viewBox="0 0 200 60" className="w-full overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="areaClip">
            <motion.rect
              x="0" y="0" height="60"
              initial={{ width: 0 }}
              animate={{ width: drawn ? 200 : 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </clipPath>
        </defs>

        {/* Area fill */}
        <path d={AREA_FILL} fill="url(#areaGrad)" clipPath="url(#areaClip)" />

        {/* Line */}
        <motion.path
          ref={ref}
          d={AREA_LINE}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Dot finale */}
        {drawn && (
          <motion.circle
            cx="200" cy="8" r="3"
            fill="#10b981"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          />
        )}
      </svg>

      {/* Labels mesi */}
      <div className="mt-1 flex justify-between px-0.5">
        {["Apr", "Giu", "Ago", "Ott", "Dic", "Mar"].map((m) => (
          <span key={m} className="text-[8px] text-zinc-600">{m}</span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MOCK DASHBOARD
───────────────────────────────────────── */
const MOCK_TRANSACTIONS = [
  { label: "Stipendio",          amount: "+€2.400,00", category: "Entrate",          color: "#10b981", icon: Banknote,       income: true  },
  { label: "Affitto / Mutuo",    amount: "-€850,00",   category: "Casa",             color: "#eab308", icon: Building2,      income: false },
  { label: "Spesa supermercato", amount: "-€94,30",    category: "Alimentari",       color: "#fb923c", icon: ShoppingBasket, income: false },
  { label: "Ristoranti & Asporto",amount: "-€38,50",   category: "Alimentari",       color: "#f97316", icon: ChefHat,        income: false },
  { label: "Freelance & Extra",  amount: "+€600,00",   category: "Entrate",          color: "#34d399", icon: Briefcase,      income: true  },
]

function MockDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 56, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl shadow-black/50 backdrop-blur"
        style={{ minWidth: 400 }}
      >
        {/* Chrome bar */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-white/5 bg-zinc-800/50 px-5 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[10px] font-medium text-zinc-500">OurBalance — Dashboard</span>
          <div className="w-12" />
        </div>

        <div className="p-5">
          {/* Saldo */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="mb-0.5 text-[10px] text-zinc-500">Saldo netto · Marzo 2026</p>
              <p className="text-4xl font-bold tracking-tight text-zinc-50">
                <AnimatedCounter value={2017.20} />
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
              +18% vs Feb
            </span>
          </div>

          {/* Area chart */}
          <div className="mb-5">
            <AreaChartMock />
          </div>

          {/* Transazioni */}
          <div className="space-y-1.5">
            <p className="mb-2 text-[10px] font-medium text-zinc-500">Ultime transazioni</p>
            {MOCK_TRANSACTIONS.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="rounded-md p-1.5"
                    style={{ backgroundColor: `${t.color}18` }}
                  >
                    <t.icon className="h-3 w-3" style={{ color: t.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{t.label}</p>
                    <p className="text-[10px] text-zinc-500">{t.category}</p>
                  </div>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: t.income ? "#10b981" : "#fb7185" }}
                >
                  {t.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   FEATURES
───────────────────────────────────────── */
const FEATURES = [
  { icon: ArrowLeftRight, title: "Transazioni in un tap",      description: "Registra entrate e uscite in pochi secondi. Categorizza, filtra e cerca tra tutte le tue transazioni." },
  { icon: BarChart2,      title: "Cashflow a colpo d'occhio",  description: "Grafici interattivi che mostrano dove vanno i tuoi soldi, mese per mese. Senza fogli Excel." },
  { icon: Users,          title: "Finanze di coppia",          description: "Tieni separati i conti personali da quelli condivisi. Perfetto per gestire le spese con il partner." },
  { icon: TrendingUp,     title: "Budget e obiettivi",         description: "Imposta budget per categoria e monitora in tempo reale quanto stai spendendo rispetto al piano." },
  { icon: ShieldCheck,    title: "I tuoi dati, al sicuro",     description: "Autenticazione sicura, dati cifrati su Supabase. Nessuna banca collegata, nessun dato sensibile." },
  { icon: Wallet,         title: "Sempre con te",              description: "Funziona come app sul telefono (PWA) senza installare nulla. Accedi da qualsiasi dispositivo." },
]

const HERO_LINES = [
  { text: "Tieni sotto", accent: false },
  { text: "controllo",   accent: true  },
  { text: "ogni euro.",  accent: false },
]

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export function LandingPage() {
  const { navigate } = usePageTransition()
  const { scrollY } = useScroll()

  const heroTextY = useTransform(scrollY, [0, 500], [0, -55])
  const glowY     = useTransform(scrollY, [0, 600], [0, -85])
  const mockY     = useTransform(scrollY, [0, 500], [0, -25])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24">
        {/* Glow */}
        <motion.div
          style={{ y: glowY }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute left-1/2 top-1/3 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[140px]"
        />

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* Testo */}
          <motion.div
            style={{ y: heroTextY }}
            className="flex max-w-lg flex-col items-center text-center lg:items-start lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
            >
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
              Finanze personali, finalmente semplici
            </motion.div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              {HERO_LINES.map(({ text, accent }, i) => (
                <motion.span
                  key={text}
                  className={`block ${accent ? "text-emerald-400" : ""}`}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {text}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg leading-relaxed text-zinc-400"
            >
              OurBalance è il modo più semplice per tracciare entrate e uscite,
              capire dove finiscono i tuoi soldi e gestire le tue finanze e di coppia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.54, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
              >
                Inizia gratis <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/5"
              >
                Accedi
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Mock */}
          <motion.div style={{ y: mockY }} className="flex w-full justify-center lg:justify-end">
            <MockDashboard />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-8 w-5 items-start justify-center rounded-full border border-white/15 pt-1.5"
          >
            <div className="h-1.5 w-1 rounded-full bg-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 py-28">
        <div className="mx-auto max-w-5xl">
          <FadeUp className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Funzionalità</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tutto quello che ti serve,
              <br /><span className="text-zinc-400">niente di più.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.22 } }}
                  className="h-full rounded-xl border border-white/5 bg-zinc-900/60 p-6 transition-colors hover:border-emerald-500/20 hover:bg-zinc-900"
                >
                  <motion.div
                    whileHover={{ scale: 1.12, transition: { duration: 0.2 } }}
                    className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-2.5"
                  >
                    <f.icon className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-100">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{f.description}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="px-4 py-28">
        <FadeUp>
          <motion.div
            whileInView={{ boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 80px rgba(52,211,153,0.07)", "0 0 0px rgba(52,211,153,0)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            viewport={{ once: false }}
            className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-8 py-16 text-center"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">Inizia oggi</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto a prendere<br />il controllo?
            </h2>
            <p className="mb-8 text-zinc-400">Gratuito, senza carta di credito, senza sorprese.</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Crea il tuo account <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-zinc-600 sm:flex-row">
          <span className="font-semibold text-zinc-500">OurBalance</span>
          <span className="flex items-center gap-1.5">
            2026 — Fatto con{" "}
            <Heart className="inline h-3 w-3 fill-rose-500 text-rose-500" />{" "}
            da{" "}
            <a
              href="https://github.com/darw5n"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
            >
              Darwin
            </a>
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-zinc-400">Privacy</Link>
            <Link href="/cookies" className="transition-colors hover:text-zinc-400">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
