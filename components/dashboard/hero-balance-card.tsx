import { formatCurrency } from "@/lib/utils"
import type { DashboardSummary } from "@/lib/supabase/queries/transactions"

type Props = {
  summary: DashboardSummary
  monthLabel: string  // e.g. "Mag 2026"
  viewMode?: "personal" | "family"
}

export function HeroBalanceCard({ summary, monthLabel, viewMode = "personal" }: Props) {
  const entrateTotale = summary.entrate + summary.entrate_provvisorie
  const net = entrateTotale - summary.uscite
  const netSign = net < 0 ? "-" : ""
  const savingsRate = entrateTotale > 0
    ? Math.round((net / entrateTotale) * 100)
    : 0

  // Split intero + decimali per typography scale
  const netStr = formatCurrency(Math.abs(net)) // e.g. "2.847,50"
  const commaIdx = netStr.lastIndexOf(",")
  const intPart = commaIdx >= 0 ? netStr.slice(0, commaIdx) : netStr
  const decPart = commaIdx >= 0 ? netStr.slice(commaIdx) : ""

  return (
    <div
      className="overflow-hidden rounded-[22px] px-5 pt-5 pb-5"
      style={{ background: `linear-gradient(135deg, var(--hero-start), var(--hero-end))` }}
    >
      {/* Top row: label + month badge */}
      <div className="mb-2 flex items-start justify-between">
        <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-hero-text/40">
          Saldo disponibile · {new Date().toLocaleDateString("it-IT", { month: "long" })}
        </p>
        <span className="rounded-[8px] bg-hero-text/10 px-2.5 py-0.5 font-sans text-[11px] font-medium text-hero-text/60">
          {monthLabel}
        </span>
      </div>

      {/* Net amount */}
      <p className="font-serif font-bold leading-none text-hero-text mb-6" style={{ fontSize: 38 }}>
        {netSign}
        {intPart}
        {decPart && <span style={{ fontSize: 24 }}>{decPart}</span>}
      </p>

      {/* Footer: 2 colonne in vista famiglia, 3 altrimenti */}
      <div
        className={`grid gap-2 border-t pt-4 ${viewMode === "family" ? "grid-cols-2" : "grid-cols-3"}`}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div>
          <p className="font-sans text-[10px] text-hero-text/40 mb-0.5">Entrate</p>
          <p className="font-sans text-sm font-semibold text-hero-income">
            +{formatCurrency(entrateTotale)}
          </p>
        </div>
        <div className={viewMode !== "family" ? "border-x px-2" : "pl-2"} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="font-sans text-[10px] text-hero-text/40 mb-0.5">Uscite</p>
          <p className="font-sans text-sm font-semibold text-hero-expense">
            -{formatCurrency(summary.uscite)}
          </p>
        </div>
        {viewMode !== "family" && (
          <div className="pl-2">
            <p className="font-sans text-[10px] text-hero-text/40 mb-0.5">Risparmio</p>
            <p className="font-sans text-sm font-semibold text-hero-text/70">
              {entrateTotale > 0 ? `${savingsRate}%` : "—"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
