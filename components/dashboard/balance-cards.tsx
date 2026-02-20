"use client"

import { TrendingDown, TrendingUp, Wallet, Clock, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { DashboardSummary, ViewMode } from "@/lib/supabase/queries/transactions"

type BalanceCardsProps = {
  current: DashboardSummary
  ytdUscite?: number
  viewMode: ViewMode
}

function HealthBadge({ entrate, uscite }: { entrate: number; uscite: number }) {
  if (entrate === 0) return null
  const rate = (entrate - uscite) / entrate

  let label: string
  let className: string
  if (rate >= 0.2) {
    label = "Ottimo"
    className = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
  } else if (rate >= 0.1) {
    label = "Buono"
    className = "bg-sky-500/15 text-sky-400 border-sky-500/30"
  } else if (rate >= 0) {
    label = "Attenzione"
    className = "bg-amber-500/15 text-amber-400 border-amber-500/30"
  } else {
    label = "In deficit"
    className = "bg-rose-500/15 text-rose-400 border-rose-500/30"
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}>
      {label}
    </span>
  )
}

export function BalanceCards({ current, ytdUscite, viewMode }: BalanceCardsProps) {
  if (viewMode === "family") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Uscite questo mese */}
        <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Spese questo mese</p>
              <p className="text-2xl font-semibold tracking-tight text-rose-400">
                {formatCurrency(current.uscite)}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
              <TrendingDown className="h-5 w-5 text-rose-400" />
            </div>
          </div>
        </Card>

        {/* Uscite da gennaio */}
        <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Spese da gennaio</p>
              <p className="text-2xl font-semibold tracking-tight text-rose-400">
                {formatCurrency(ytdUscite ?? 0)}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
          </div>
        </Card>

        {/* Da confermare */}
        {current.pending > 0 && (
          <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Da confermare</p>
                <p className="text-2xl font-semibold tracking-tight text-amber-400">
                  {formatCurrency(current.pending)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Entrate */}
      <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-zinc-400">Entrate mese</p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-400">
              {formatCurrency(current.entrate)}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </Card>

      {/* Uscite */}
      <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-zinc-400">Uscite mese</p>
            <p className="text-2xl font-semibold tracking-tight text-rose-400">
              {formatCurrency(current.uscite)}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
            <TrendingDown className="h-5 w-5 text-rose-400" />
          </div>
        </div>
      </Card>

      {/* Netto + health badge */}
      <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm text-zinc-400">Netto mese</p>
            <p className={`text-2xl font-semibold tracking-tight ${current.netto >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(current.netto)}
            </p>
            <HealthBadge entrate={current.entrate} uscite={current.uscite} />
          </div>
          <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
            <Wallet className="h-5 w-5 text-sky-400" />
          </div>
        </div>
      </Card>

      {/* Quota in comune oppure Pending */}
      {current.spese_comuni > 0 ? (
        <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Spese in comune</p>
              <p className="text-2xl font-semibold tracking-tight text-violet-400">
                {formatCurrency(current.spese_comuni / 2)}
              </p>
              <span className="text-[10px] text-zinc-500">
                La mia quota (50%) · Totale {formatCurrency(current.spese_comuni)}
              </span>
            </div>
            <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
          </div>
        </Card>
      ) : (
        current.pending > 0 && (
          <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Da confermare</p>
                <p className="text-2xl font-semibold tracking-tight text-amber-400">
                  {formatCurrency(current.pending)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
