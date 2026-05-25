import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { RecurringTransaction } from "@/lib/supabase/queries/recurring"

function getDaysUntil(nextDueDateISO: string): number {
  const now = new Date()
  const due = new Date(nextDueDateISO)
  const diffMs = due.getTime() - now.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function UpcomingCard({ upcoming }: { upcoming: RecurringTransaction[] }) {
  if (upcoming.length === 0) return null

  return (
    <Card className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-pending-fg" />
          <span className="font-sans text-sm font-semibold text-text-1">In scadenza</span>
        </div>
        <span className="font-sans text-[11px] text-text-3">prossimi 14 giorni</span>
      </div>

      {/* Items */}
      <div className="flex flex-col">
        {upcoming.map((item, i) => {
          const amount = Math.abs(Number(item.amount) || 0)
          const isExpense = item.type === "expense"
          const daysUntil = getDaysUntil(item.next_due_date)

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 py-2.5 ${i < upcoming.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              {/* Color dot */}
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: item.category?.color ?? "var(--accent-brand)" }}
              />
              {/* Name + frequency */}
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-text-1 truncate">
                  {item.description ?? item.category?.name ?? "Ricorrente"}
                </p>
                <p className="font-sans text-[11px] text-text-3">{item.frequency}</p>
              </div>
              {/* Amount */}
              <p
                className={`font-sans text-sm font-semibold flex-shrink-0 ${
                  amount > 100 ? "text-pending-fg" : "text-accent-brand"
                }`}
              >
                {isExpense ? "-" : "+"}{formatCurrency(amount)}
              </p>
              {/* Days badge */}
              <div className="rounded-[8px] bg-surface-2 px-2 py-0.5">
                <span className="font-sans text-[10px] font-medium text-text-2">
                  {daysUntil === 0 ? "oggi" : daysUntil === 1 ? "domani" : `${daysUntil}g`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
