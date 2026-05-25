import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { TopCategory } from "@/lib/supabase/queries/transactions"
import { getCategoryIcon } from "@/lib/category-icons"

type Props = {
  categories: TopCategory[]
  month: string // e.g. "Maggio 2026"
}

export function CategorySpendingCard({ categories, month }: Props) {
  if (categories.length === 0) return null

  const max = Math.max(...categories.map((c) => c.amount))

  return (
    <Card className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Dove vanno i soldi</h2>
        <Link href="/transactions" className="font-sans text-xs text-accent-brand hover:underline">
          Vedi tutto ›
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const pct = max > 0 ? Math.round((cat.amount / max) * 100) : 0
          const CatIcon = getCategoryIcon(cat.name)
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {cat.emoji
                    ? <span className="text-base leading-none">{cat.emoji}</span>
                    : <CatIcon className="h-4 w-4 text-text-3 flex-shrink-0" />
                  }
                  <span className="font-sans text-sm text-text-1">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[11px] text-text-3">{pct}%</span>
                  <span className="font-sans text-sm font-semibold text-text-1">{formatCurrency(cat.amount)}</span>
                </div>
              </div>
              <div className="h-[5px] rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat.color ?? "var(--accent-brand)",
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
