import { Card } from "@/components/ui/card"

// Segnaposto con le stesse proporzioni della dashboard vera, così quando
// arrivano i dati la pagina non salta.

function ListCardSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="space-y-3.5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 shrink-0 !rounded-[10px]" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-2/5" />
              <div className="skeleton h-2.5 w-1/4" />
            </div>
            <div className="skeleton h-3.5 w-16" />
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Grafico cashflow + "Dove vanno i soldi" + "Movimenti recenti". */
export function DashboardDetailsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Card className="p-5">
        <div className="space-y-2">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-3 w-56" />
        </div>
        <div className="skeleton mt-4 h-72 w-full !rounded-lg" />
      </Card>
      <ListCardSkeleton rows={3} />
      <ListCardSkeleton rows={5} />
    </div>
  )
}

/** Intestazione, selettore di vista e card hero. */
export function DashboardTopSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="pt-1 pb-2">
        <div className="skeleton h-8 w-36" />
        <div className="skeleton mt-2 mb-4 h-3 w-64" />
        <div className="skeleton h-11 w-full !rounded-[14px]" />
      </div>
      <div className="skeleton mt-3 h-[196px] w-full !rounded-[22px]" />
    </div>
  )
}
