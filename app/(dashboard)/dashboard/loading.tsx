import { DashboardDetailsSkeleton, DashboardTopSkeleton } from "./dashboard-skeletons"

export default function Loading() {
  return (
    <div className="space-y-3" role="status" aria-label="Caricamento dashboard">
      <DashboardTopSkeleton />
      <DashboardDetailsSkeleton />
    </div>
  )
}
