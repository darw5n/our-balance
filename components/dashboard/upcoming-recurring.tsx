import { CalendarClock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"

type Props = {
  items: RecurringTransaction[]
}

const FREQ_LABEL: Record<string, string> = {
  weekly: "Sett.",
  monthly: "Mens.",
  yearly: "Ann.",
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const due = new Date(dateStr)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function UpcomingRecurring({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-100">In scadenza</h2>
        <span className="ml-auto text-xs text-zinc-500">prossimi 14 giorni</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const days = daysUntil(item.next_due_date)
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.category?.color ?? "#71717a" }}
              />
              <span className="flex-1 truncate text-xs text-zinc-300">
                {item.description ?? item.category?.name ?? "—"}
              </span>
              <span className="shrink-0 text-xs text-zinc-500">{FREQ_LABEL[item.frequency]}</span>
              <span className={`shrink-0 text-xs font-medium ${item.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>
                {formatCurrency(item.amount)}
              </span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                days <= 3
                  ? "bg-rose-500/20 text-rose-400"
                  : days <= 7
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}>
                {days === 0 ? "oggi" : days === 1 ? "domani" : `${days}g`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
