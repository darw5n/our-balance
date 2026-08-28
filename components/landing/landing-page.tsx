"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  motion,
  MotionConfig,
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
  Repeat,
  ShieldCheck,
  Heart,
  Banknote,
  Building2,
  Wifi,
  TrendingDown,
} from "lucide-react"

/* Palette — allineata ai token dark dell'app (terracotta, superfici calde). */
const C = {
  bg: "#141210",
  surface1: "#1E1A17",
  surface2: "#272320",
  border: "rgba(255,255,255,0.08)",
  text1: "#F0EDE8",
  text2: "#9A8D85",
  text3: "#6B5F57",
  accent: "#D9674A",
  income: "#4BAA7E",
  expense: "#E05C6A",
  heroA: "#2A1F1A",
  heroB: "#3D2E28",
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   CONTATORE ANIMATO — formato valuta IT dell'app
───────────────────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 55, damping: 18 })
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState("0,00 €")

  useEffect(() => {
    const unsub = spring.on("change", (v) =>
      setDisplay(`${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)
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
   MINI CASHFLOW — stile grafico "Netto" dell'app
───────────────────────────────────────── */
const NET_LINE = "M0,44 C10,42 16,30 26,26 C36,22 42,32 54,24 C66,16 72,30 84,22 C96,14 102,6 114,10 C126,14 132,22 144,16 C156,10 164,14 176,8 C188,2 194,8 200,6"

function CashflowMock() {
  const [drawn, setDrawn] = useState(false)
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setDrawn(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="rounded-[14px] p-4" style={{ background: C.surface2 }}>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>
        Netto · ultimi 12 mesi
      </p>
      <svg ref={ref} viewBox="0 0 200 56" className="w-full overflow-visible">
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
          <clipPath id="netClip">
            <motion.rect
              x="0" y="0" height="56"
              initial={{ width: 0 }}
              animate={{ width: drawn ? 200 : 0 }}
              transition={{ duration: 1.1, ease: EASE }}
            />
          </clipPath>
        </defs>
        <path d={`${NET_LINE} L200,56 L0,56 Z`} fill="url(#netGrad)" clipPath="url(#netClip)" />
        <motion.path
          d={NET_LINE}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        {drawn && (
          <motion.circle
            cx="200" cy="6" r="3" fill={C.accent}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />
        )}
      </svg>
      <div className="mt-1 flex justify-between">
        {["Set", "Nov", "Gen", "Mar", "Mag", "Ago"].map((m) => (
          <span key={m} className="font-mono text-[8px]" style={{ color: C.text3 }}>{m}</span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MOCK APP — ricalca la dashboard attuale
───────────────────────────────────────── */
const MOCK_ROWS = [
  { label: "Stipendio",       meta: "Entrate · 1 ago",       amount: "+2.400,00 €", income: true,  Icon: Banknote },
  { label: "Affitto",         meta: "Casa · 3 ago · comune", amount: "-425,00 €",   income: false, Icon: Building2 },
  { label: "Internet",        meta: "Utenze · 5 ago",        amount: "-25,00 €",    income: false, Icon: Wifi },
  { label: "Spesa + farmacia", meta: "Alimentari · 8 ago",   amount: "-72,40 €",    income: false, Icon: TrendingDown },
]

function MockApp() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="w-full max-w-[440px] overflow-hidden rounded-[24px] border shadow-2xl"
        style={{ borderColor: C.border, background: C.surface1, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)" }}
      >
        {/* Barra finestra */}
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: C.border, background: C.surface2 }}>
          <span className="font-serif text-sm font-semibold" style={{ color: C.text1 }}>OurBalance</span>
          <span className="font-mono text-[10px]" style={{ color: C.text3 }}>Personale</span>
        </div>

        <div className="space-y-4 p-5">
          {/* Hero balance card — come nell'app */}
          <div className="rounded-[18px] px-5 py-4" style={{ background: `linear-gradient(135deg, ${C.heroA}, ${C.heroB})` }}>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.45)" }}>
              Saldo disponibile · agosto
            </p>
            <p className="font-serif text-3xl font-bold leading-none" style={{ color: C.text1 }}>
              <AnimatedCounter value={1877.60} />
            </p>
            <div className="mt-4 flex gap-6 border-t pt-3" style={{ borderColor: "rgba(240,237,232,0.1)" }}>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(240,237,232,0.45)" }}>Entrate</p>
                <p className="text-sm font-semibold" style={{ color: "#5DC98E" }}>+3.000,00 €</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(240,237,232,0.45)" }}>Uscite</p>
                <p className="text-sm font-semibold" style={{ color: "#E07B6A" }}>-1.122,40 €</p>
              </div>
            </div>
          </div>

          <CashflowMock />

          {/* Movimenti recenti */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>
              Movimenti recenti
            </p>
            <div className="space-y-1">
              {MOCK_ROWS.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.09, duration: 0.4, ease: EASE }}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2"
                  style={{ background: C.surface2 }}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: C.surface1 }}>
                    <r.Icon className="h-4 w-4" style={{ color: C.text3 }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" style={{ color: C.text1 }}>{r.label}</p>
                    <p className="text-[10px]" style={{ color: C.text3 }}>{r.meta}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold" style={{ color: r.income ? C.income : C.text1 }}>
                    {r.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   FUNZIONALITÀ
───────────────────────────────────────── */
const FEATURES = [
  { Icon: ArrowLeftRight, title: "Transazioni in un tap",     description: "Registra entrate e uscite in pochi secondi. Categorizza, filtra e cerca per descrizione o categoria." },
  { Icon: BarChart2,      title: "Cashflow a colpo d'occhio", description: "Grafici mensili e annuali che mostrano dove vanno i soldi. Senza fogli Excel." },
  { Icon: Users,          title: "Spese di coppia",           description: "Segna una spesa come condivisa: conta al 50% sul tuo personale, senza confondere i conti." },
  { Icon: Repeat,         title: "Ricorrenze",                description: "Affitto, stipendio, abbonamenti: si registrano da soli. Metti in pausa o imposta una data di fine." },
  { Icon: Wallet,         title: "Budget per categoria",      description: "Imposta un limite mensile e vedi in tempo reale quanto ti resta." },
  { Icon: ShieldCheck,    title: "I tuoi dati, al sicuro",    description: "Accesso con email o Google. Nessuna banca collegata, nessun dato sensibile." },
]

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export function LandingPage() {
  const { navigate } = usePageTransition()
  const { scrollY } = useScroll()

  const heroTextY = useTransform(scrollY, [0, 500], [0, -50])
  const glowY     = useTransform(scrollY, [0, 600], [0, -80])
  const mockY     = useTransform(scrollY, [0, 500], [0, -20])

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen" style={{ background: C.bg, color: C.text1 }}>
      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24">
        <motion.div
          style={{ y: glowY, background: C.accent }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute left-1/2 top-1/3 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
        />

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-14 lg:flex-row lg:gap-16">
          {/* Testo */}
          <motion.div
            style={{ y: heroTextY }}
            className="flex w-full flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${C.accent}33`, background: `${C.accent}1a`, color: C.accent }}
            >
              <motion.span
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: C.accent }}
              />
              Finanze personali, finalmente semplici
            </motion.div>

            <h1 className="font-serif text-5xl font-semibold italic leading-[1.08] tracking-tight sm:text-[64px]">
              {["Tieni sotto controllo", "ogni euro."].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  style={i === 1 ? { color: C.accent } : undefined}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE }}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              className="mt-6 max-w-md text-lg leading-relaxed"
              style={{ color: C.text2 }}
            >
              OurBalance traccia entrate e uscite, ti fa capire dove finiscono i soldi
              e tiene separate le spese personali da quelle di coppia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.52, ease: EASE }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: C.accent }}
              >
                Inizia gratis <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: C.border, color: C.text1 }}
              >
                Accedi
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Mock */}
          <motion.div style={{ y: mockY }} className="flex w-full justify-center lg:flex-1 lg:justify-end">
            <MockApp />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-8 w-5 items-start justify-center rounded-full border pt-1.5"
            style={{ borderColor: C.border }}
          >
            <div className="h-1.5 w-1 rounded-full" style={{ background: C.text3 }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FUNZIONALITÀ ── */}
      <section className="px-4 py-28">
        <div className="mx-auto max-w-5xl">
          <FadeUp className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: C.accent }}>
              Funzionalità
            </p>
            <h2 className="font-serif text-3xl font-semibold italic tracking-tight sm:text-4xl">
              Tutto quello che ti serve,{" "}
              <span style={{ color: C.text2 }}>niente di più.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full rounded-[18px] border p-6"
                  style={{ borderColor: C.border, background: C.surface1 }}
                >
                  <div className="mb-4 inline-flex rounded-[12px] p-2.5" style={{ background: `${C.accent}1a` }}>
                    <f.Icon className="h-5 w-5" style={{ color: C.accent }} />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: C.text1 }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.text2 }}>{f.description}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ── */}
      <section className="px-4 pb-28 pt-4">
        <FadeUp>
          <div
            className="mx-auto max-w-2xl rounded-[24px] border px-8 py-16 text-center"
            style={{ borderColor: `${C.accent}33`, background: `${C.accent}0d` }}
          >
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: C.accent }}>
              Inizia oggi
            </p>
            <h2 className="mb-4 font-serif text-3xl font-semibold italic tracking-tight sm:text-4xl">
              Pronto a prendere il controllo?
            </h2>
            <p className="mb-8" style={{ color: C.text2 }}>Gratuito, senza carta di credito, senza sorprese.</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: C.accent }}
            >
              Crea il tuo account <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t px-4 py-8" style={{ borderColor: C.border }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs sm:flex-row" style={{ color: C.text3 }}>
          <span className="font-serif font-semibold" style={{ color: C.text2 }}>OurBalance</span>
          <span className="flex items-center gap-1.5">
            2026 — Fatto con{" "}
            <Heart className="inline h-3 w-3" style={{ fill: C.accent, color: C.accent }} />{" "}
            da{" "}
            <a
              href="https://github.com/darw5n"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 transition-colors hover:underline"
              style={{ color: C.text2 }}
            >
              Darwin
            </a>
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:opacity-70">Privacy</Link>
            <Link href="/cookies" className="transition-colors hover:opacity-70">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  )
}
