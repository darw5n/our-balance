import { TransitionProvider } from "@/components/landing/transition-provider"

// Landing, login e registrazione condividono la dissolvenza tra pagine.
// Sta qui e non nel layout principale, così l'app autenticata non scarica `motion`.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <TransitionProvider>{children}</TransitionProvider>
}
