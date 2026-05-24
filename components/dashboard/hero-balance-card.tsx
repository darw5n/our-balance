import { formatCurrency } from "@/lib/utils"
import type { DashboardSummary } from "@/lib/supabase/queries/transactions"

export function HeroBalanceCard({ summary }: { summary: DashboardSummary }) {
  const net = summary.entrate - summary.uscite
  const netSign = net >= 0 ? "+" : ""

  return (
    <div
      className="rounded-[22px] overflow-hidden px-5 pt-6 pb-5"
      style={{ background: `linear-gradient(135deg, var(--hero-start), var(--hero-end))` }}
    >
      {/* Saldo netto hero */}
      <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/40 mb-1">
        Saldo netto del mese
      </p>
      <p className="font-serif text-[38px] font-bold leading-none text-[#F0EDE8] mb-6">
        {netSign}{formatCurrency(net)}
      </p>

      {/* 3-column footer */}
      <div className="grid grid-cols-3 gap-2 border-t border-white/8 pt-4">
        <div>
          <p className="font-sans text-[10px] text-white/40 mb-0.5">Entrate</p>
          <p className="font-sans text-sm font-semibold text-[#5DC98E]">+{formatCurrency(summary.entrate)}</p>
        </div>
        <div className="border-x border-white/8 px-2">
          <p className="font-sans text-[10px] text-white/40 mb-0.5">Uscite</p>
          <p className="font-sans text-sm font-semibold text-[#E07B6A]">-{formatCurrency(summary.uscite)}</p>
        </div>
        <div className="pl-2">
          <p className="font-sans text-[10px] text-white/40 mb-0.5">Risparmio</p>
          <p className="font-sans text-sm font-semibold" style={{ color: "rgba(240,237,232,0.7)" }}>
            {summary.entrate > 0
              ? Math.round(((summary.entrate - summary.uscite) / summary.entrate) * 100) + "%"
              : "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
