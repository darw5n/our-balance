import { getCategoryMonthlyBreakdown } from "@/lib/supabase/queries/analytics"
import type { ViewMode } from "@/lib/supabase/queries/transactions"
import type { Category } from "@/lib/supabase/queries/categories"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ComparisonControls } from "@/components/dashboard/comparison-controls"
import { CategoryComparisonChart } from "@/components/dashboard/category-comparison-chart"

type Props = {
  userId: string
  viewMode: ViewMode
  categories: Category[]
  cat: string
  y1: number
  y2: number
  availableYears: number[]
}

function emptyMonths(): number[] {
  return Array.from({ length: 12 }, () => 0)
}

export async function CategoryComparisonView({
  userId,
  viewMode,
  categories,
  cat,
  y1,
  y2,
  availableYears,
}: Props) {
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const controls = (
    <ComparisonControls
      categories={expenseCategories as CategoryOption[]}
      cat={cat}
      y1={y1}
      y2={y2}
      viewMode={viewMode}
      availableYears={availableYears}
    />
  )

  // Stato: nessuna categoria di spesa
  if (expenseCategories.length === 0) {
    return (
      <div className="space-y-4">
        {controls}
        <Card className="p-8 text-center">
          <p className="font-sans text-sm text-text-3">
            Crea prima qualche categoria di spesa per poter fare un confronto.
          </p>
        </Card>
      </div>
    )
  }

  // Stato: categoria non ancora scelta
  if (!cat) {
    return (
      <div className="space-y-4">
        {controls}
        <Card className="p-8 text-center">
          <p className="font-sans text-sm text-text-3">
            Scegli una categoria per confrontare quanto hai speso tra due anni, mese per mese.
          </p>
        </Card>
      </div>
    )
  }

  const [rowsA, rowsB] = await Promise.all([
    getCategoryMonthlyBreakdown(userId, viewMode, y1),
    getCategoryMonthlyBreakdown(userId, viewMode, y2),
  ])

  const rowA = rowsA.find((r) => r.id === cat)
  const rowB = rowsB.find((r) => r.id === cat)
  const monthsA = rowA?.months ?? emptyMonths()
  const monthsB = rowB?.months ?? emptyMonths()

  // Confronto equo: se uno dei due è l'anno in corso, i totali considerano solo
  // i mesi trascorsi (gen → mese corrente) per entrambi. Altrimenti i 12 mesi.
  const now = new Date()
  const involvesCurrentYear = y1 === now.getUTCFullYear() || y2 === now.getUTCFullYear()
  const monthLimit = involvesCurrentYear ? now.getUTCMonth() + 1 : 12
  const sumMonths = (m: number[]) => m.slice(0, monthLimit).reduce((s, v) => s + v, 0)
  const totalA = sumMonths(monthsA)
  const totalB = sumMonths(monthsB)
  const periodNote = involvesCurrentYear
    ? `Confronto sui primi ${monthLimit} mesi dell'anno (anno in corso).`
    : null

  const selected = categories.find((c) => c.id === cat)
  const categoryName = selected?.name ?? "questa categoria"

  // Stato: nessun dato in entrambi gli anni
  if (totalA === 0 && totalB === 0) {
    return (
      <div className="space-y-4">
        {controls}
        <Card className="p-8 text-center">
          <p className="font-sans text-sm text-text-3">
            Nessun movimento per <span className="font-medium text-text-1">{categoryName}</span> nel {y1} o nel {y2}.
          </p>
        </Card>
      </div>
    )
  }

  const delta = totalB - totalA
  const spentLess = delta < 0
  const deltaColor = delta === 0 ? "var(--text-2)" : spentLess ? "var(--income-fg)" : "var(--expense-fg)"
  const pct = totalA > 0 ? Math.round((delta / totalA) * 100) : null

  return (
    <div className="space-y-4">
      {controls}

      {/* Headline: la differenza in una frase */}
      <Card className="p-5">
        {delta === 0 ? (
          <p className="font-sans text-sm text-text-2">
            Nel <strong className="text-text-1">{y2}</strong> hai speso come nel {y1} su{" "}
            <strong className="text-text-1">{categoryName}</strong>.
          </p>
        ) : (
          <p className="font-sans text-sm text-text-2">
            Nel <strong className="text-text-1">{y2}</strong> hai speso{" "}
            <strong style={{ color: deltaColor }}>
              {formatCurrency(Math.abs(delta))} in {spentLess ? "meno" : "più"}
            </strong>{" "}
            rispetto al {y1} su <strong className="text-text-1">{categoryName}</strong>
            {pct !== null && (
              <span style={{ color: deltaColor }}>
                {" "}({delta > 0 ? "+" : "−"}{Math.abs(pct)}%)
              </span>
            )}
            .
          </p>
        )}
      </Card>

      {/* Totali per anno */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-4">
          <span className="font-sans text-[10px] text-text-3">Totale {y1}</span>
          <p className="mt-1 font-serif text-xl font-semibold text-text-1">{formatCurrency(totalA)}</p>
        </Card>
        <Card className="p-4">
          <span className="font-sans text-[10px] text-text-3">Totale {y2}</span>
          <p className="mt-1 font-serif text-xl font-semibold text-text-1">{formatCurrency(totalB)}</p>
        </Card>
      </div>

      {periodNote && <p className="font-sans text-xs text-text-3">{periodNote}</p>}

      {/* Grafico mese per mese */}
      <Card className="p-5">
        <h2 className="font-serif text-[18px] font-semibold text-text-1">Andamento mensile</h2>
        <p className="mt-0.5 font-sans text-xs text-text-3">Spesa per {categoryName}, mese per mese.</p>
        <div className="mt-4">
          <CategoryComparisonChart
            monthsA={monthsA}
            monthsB={monthsB}
            labelA={String(y1)}
            labelB={String(y2)}
          />
        </div>
      </Card>
    </div>
  )
}
