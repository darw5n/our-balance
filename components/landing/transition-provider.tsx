"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

type Phase = "idle" | "drawing"

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

const TransitionCtx = createContext<{
  navigate: (href: string) => void
}>({ navigate: () => {} })

export function TransitionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")
  const busy = useRef(false)
  const reduceMotion = useReducedMotion()

  // Login e registrazione sono le mete di ogni dissolvenza: si preparano subito,
  // così dopo il nero la pagina nuova è già pronta.
  useEffect(() => {
    router.prefetch("/login")
    router.prefetch("/signup")
  }, [router])

  const navigate = useCallback(
    async (href: string) => {
      if (busy.current) return
      // Con "Riduci movimento" niente schermo nero: si cambia pagina e basta.
      if (reduceMotion) {
        router.push(href)
        return
      }
      busy.current = true
      setPhase("drawing")
      await sleep(200)        // fade-in completato
      router.push(href)
      await sleep(100)        // buffer mount nuova pagina
      setPhase("idle")        // fade-out
      await sleep(250)
      busy.current = false
    },
    [router, reduceMotion]
  )

  return (
    <TransitionCtx.Provider value={{ navigate }}>
      {children}

      <AnimatePresence>
        {phase === "drawing" && (
          <motion.div
            key="fade-transition"
            className="pointer-events-none fixed inset-0 z-[200] bg-zinc-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
    </TransitionCtx.Provider>
  )
}

export function usePageTransition() {
  return useContext(TransitionCtx)
}
