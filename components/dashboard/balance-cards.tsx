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
    className = "bg-income-subtle text-income-fg border-income/30"
  } else if (rate >= 0.1) {
    label = "Buono"
    className = "bg-info-subtle text-info border-info/30"
  } else if (rate >= 0) {
    label = "Attenzione"
    className = "bg-pending-subtle text-pending-fg border-pending/30"
  } else {
    label = "In deficit"
    className = "bg-expense-subtle text-expense-fg border-expense/30"
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
        <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-text-2">Spese questo mese</p>
              <p className="text-2xl font-semibold tracking-tight text-expense-fg">
                {formatCurrency(current.uscite)}
              </p>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
              <TrendingDown className="h-5 w-5 text-expense-fg" />
            </div>
          </div>
        </Card>

        {/* Uscite da gennaio */}
        <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-text-2">Spese da gennaio</p>
              <p className="text-2xl font-semibold tracking-tight text-expense-fg">
                {formatCurrency(ytdUscite ?? 0)}
              </p>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
              <Users className="h-5 w-5 text-shared" />
            </div>
          </div>
        </Card>

        {/* Da confermare */}
        {current.pending > 0 && (
          <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-text-2">Da confermare</p>
                <p className="text-2xl font-semibold tracking-tight text-pending-fg">
                  {formatCurrency(current.pending)}
                </p>
              </div>
              <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
                <Clock className="h-5 w-5 text-pending-fg" />
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
      <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-text-2">Entrate mese</p>
            <p className="text-2xl font-semibold tracking-tight text-income-fg">
              {formatCurrency(current.entrate + current.entrate_provvisorie)}
            </p>
            {current.entrate_provvisorie > 0 && (
              <p className="text-[11px] text-text-3">
                di cui ~{formatCurrency(current.entrate_provvisorie)} provvisori
              </p>
            )}
          </div>
          <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
            <TrendingUp className="h-5 w-5 text-income-fg" />
          </div>
        </div>
      </Card>

      {/* Uscite */}
      <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-text-2">Uscite mese</p>
            <p className="text-2xl font-semibold tracking-tight text-expense-fg">
              {formatCurrency(current.uscite)}
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
            <TrendingDown className="h-5 w-5 text-expense-fg" />
          </div>
        </div>
      </Card>

      {/* Netto + health badge */}
      <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm text-text-2">Netto mese</p>
            <p className="text-2xl font-semibold tracking-tight text-info">
              {formatCurrency(current.netto + current.entrate_provvisorie)}
            </p>
            <HealthBadge
              entrate={current.entrate + current.entrate_provvisorie}
              uscite={current.uscite}
            />
          </div>
          <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
            <Wallet className="h-5 w-5 text-info" />
          </div>
        </div>
      </Card>

      {/* Quota in comune oppure Pending */}
      {current.spese_comuni > 0 ? (
        <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-text-2">Spese in comune</p>
              <p className="text-2xl font-semibold tracking-tight text-shared">
                {formatCurrency(current.spese_comuni / 2)}
              </p>
              <span className="text-[10px] text-text-3">
                La mia quota (50%) · Totale {formatCurrency(current.spese_comuni)}
              </span>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
              <Users className="h-5 w-5 text-shared" />
            </div>
          </div>
        </Card>
      ) : (
        current.pending > 0 && (
          <Card className="border-border-subtle bg-surface-1/50 p-5 text-text-1 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-text-2">Da confermare</p>
                <p className="text-2xl font-semibold tracking-tight text-pending-fg">
                  {formatCurrency(current.pending)}
                </p>
              </div>
              <div className="rounded-md border border-border-subtle bg-surface-0/30 p-2">
                <Clock className="h-5 w-5 text-pending-fg" />
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
