import { formatCurrency } from "@/lib/utils"

type Props = {
  income: number
  expense: number
  count: number
}

export function TransactionsSummary({ income, expense, count }: Props) {
  const net = income - expense
  const netColorClass = net > 0 ? "text-income-fg" : net < 0 ? "text-expense-fg" : "text-text-2"
  const netFormatted = (net >= 0 ? "+" : "") + formatCurrency(net)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="text-text-3">Entrate</span>
        <span className="font-semibold tabular-nums text-income-fg">+{formatCurrency(income)}</span>
      </span>
      <span className="text-text-3">·</span>
      <span className="flex items-center gap-1.5">
        <span className="text-text-3">Uscite</span>
        <span className="font-semibold tabular-nums text-expense-fg">-{formatCurrency(expense)}</span>
      </span>
      <span className="text-text-3">·</span>
      <span className="flex items-center gap-1.5">
        <span className="text-text-3">Netto</span>
        <span className={`font-semibold tabular-nums ${netColorClass}`}>{netFormatted}</span>
      </span>
      <span className="text-text-3">·</span>
      <span className="text-text-3">{count} {count === 1 ? "transazione" : "transazioni"}</span>
    </div>
  )
}
