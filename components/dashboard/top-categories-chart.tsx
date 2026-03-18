"use client"

import type { TopCategory } from "@/lib/supabase/queries/transactions"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type TopCategoriesChartProps = {
  data: TopCategory[]
}

export function TopCategoriesChart({ data }: TopCategoriesChartProps) {
  const hasData = data.length > 0

  return (
    <Card className="border-border-subtle bg-surface-1 p-5 backdrop-blur">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-medium text-text-1">Top categorie spesa</h2>
        <p className="text-xs text-text-2">
          {hasData ? "Mese corrente, maggiori categorie di uscita." : "Nessuna spesa registrata per il mese corrente."}
        </p>
      </div>

      {hasData ? (
        <div className="space-y-3">
          {data.map((cat) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-text-1">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-1">{formatCurrency(cat.amount)}</span>
                  <span className="text-text-3">{cat.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, Math.min(cat.percentage, 100))}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center text-xs text-text-3">
          Nessun dato da visualizzare.
        </div>
      )}
    </Card>
  )
}
