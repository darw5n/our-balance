import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { RecentTransaction } from "@/lib/supabase/queries/transactions"
import { getCategoryIcon } from "@/lib/category-icons"

export function RecentTransactionsCard({ transactions }: { transactions: RecentTransaction[] }) {
  if (transactions.length === 0) return null

  return (
    <Card className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Movimenti recenti</h2>
        <Link href="/transactions" className="font-sans text-xs text-accent-brand hover:underline">
          Vedi tutti ›
        </Link>
      </div>

      <div className="flex flex-col">
        {transactions.map((tx, i) => {
          const amount = Math.abs(Number(tx.amount) || 0)
          const isIncome = tx.type === "income"
          const time = tx.date
            ? new Date(tx.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
            : ""
          const hasEmoji = !!tx.category_emoji
          const CatIcon = getCategoryIcon(tx.category_name ?? "")

          return (
            <div
              key={tx.id}
              className={`flex items-center gap-3 py-2.5 ${i < transactions.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              {/* Category avatar */}
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-[19px]">
                {hasEmoji ? tx.category_emoji : <CatIcon className="h-5 w-5 text-text-3" />}
              </div>
              {/* Description + meta */}
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-text-1 truncate">
                  {tx.description || tx.category_name || "Transazione"}
                </p>
                <p className="font-sans text-[11px] text-text-3 mt-0.5">
                  {tx.category_name ?? "—"} · {time}
                </p>
              </div>
              {/* Amount */}
              <p
                className={`font-sans text-sm font-semibold flex-shrink-0 ${
                  isIncome ? "text-income-fg" : "text-text-1"
                }`}
              >
                {isIncome ? "+" : "-"}{formatCurrency(amount)}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
