import { formatCurrency } from "@/lib/utils"

type Props = {
  total: number
  count: number
}

export function TransactionsSummary({ total, count }: Props) {
  const colorClass =
    total > 0
      ? "text-income-fg"
      : total < 0
        ? "text-expense-fg"
        : "text-text-2"

  const formatted = (total >= 0 ? "+" : "") + formatCurrency(total)

  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-xs">
      <span className="text-text-2">Totale filtrato:</span>
      <span className={`font-semibold tabular-nums ${colorClass}`}>{formatted}</span>
      <span className="text-text-3">·</span>
      <span className="text-text-3">{count} {count === 1 ? "transazione" : "transazioni"}</span>
    </div>
  )
}
