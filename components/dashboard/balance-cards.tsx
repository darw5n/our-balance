"use client"

import { Clock, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type BalanceCardsProps = {
  entrate: number
  uscite: number
  netto: number
  pending: number
}

export function BalanceCards({ entrate, uscite, netto, pending }: BalanceCardsProps) {
  const items = [
    {
      title: "Entrate Mese",
      value: entrate,
      Icon: TrendingUp,
      iconClassName: "text-emerald-400",
    },
    {
      title: "Uscite Mese",
      value: uscite,
      Icon: TrendingDown,
      iconClassName: "text-rose-400",
    },
    {
      title: "Netto",
      value: netto,
      Icon: Wallet,
      iconClassName: "text-sky-400",
    },
    {
      title: "Pending",
      value: pending,
      Icon: Clock,
      iconClassName: "text-amber-400",
    },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map(({ title, value, Icon, iconClassName }) => (
        <Card
          key={title}
          className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">{title}</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCurrency(value)}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-zinc-950/30 p-2">
              <Icon className={`h-5 w-5 ${iconClassName}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

