"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"

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

  const navigate = useCallback(
    async (href: string) => {
      if (busy.current) return
      busy.current = true
      setPhase("drawing")
      await sleep(400)        // fade-in completato
      router.push(href)
      await sleep(150)        // buffer mount nuova pagina
      setPhase("idle")        // fade-out
      await sleep(500)
      busy.current = false
    },
    [router]
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
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
    </TransitionCtx.Provider>
  )
}

export function usePageTransition() {
  return useContext(TransitionCtx)
}
