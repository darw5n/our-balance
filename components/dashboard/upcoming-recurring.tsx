import Link from "next/link"
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

const LIMIT = 4

export function UpcomingRecurring({ items }: Props) {
  if (items.length === 0) return null

  const displayed = items.slice(0, LIMIT)
  const hasMore = items.length > LIMIT

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-pending-fg" />
        <h2 className="text-sm font-medium text-text-1">In scadenza</h2>
        <span className="ml-auto text-xs text-text-3">prossimi 14 giorni</span>
      </div>
      <ul className="space-y-2">
        {displayed.map((item) => {
          const days = daysUntil(item.next_due_date)
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.category?.color ?? "#71717a" }}
              />
              <span className="flex-1 truncate text-xs text-text-2">
                {item.description ?? item.category?.name ?? "—"}
              </span>
              <span className="shrink-0 text-xs text-text-3">{FREQ_LABEL[item.frequency]}</span>
              <span className={`shrink-0 text-xs font-medium ${item.type === "expense" ? "text-expense-fg" : "text-income-fg"}`}>
                {formatCurrency(item.amount)}
              </span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                days <= 3
                  ? "bg-expense-subtle text-expense-fg"
                  : days <= 7
                  ? "bg-pending-subtle text-pending-fg"
                  : "bg-surface-3 text-text-2"
              }`}>
                {days === 0 ? "oggi" : days === 1 ? "domani" : `${days}g`}
              </span>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <Link
          href="/recurring"
          className="mt-3 block text-center text-xs text-text-3 hover:text-text-2 transition-colors"
        >
          Vedi tutti ({items.length}) →
        </Link>
      )}
    </div>
  )
}
