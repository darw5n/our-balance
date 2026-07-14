import type { ViewMode } from "./queries/transactions"

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export function getYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export function applyScope(amount: number, scope: string | null | undefined, viewMode: ViewMode): number {
  if (viewMode === "personal" && scope === "family") return amount * 0.5
  return amount
}

export function resolveJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export type Frequency = "weekly" | "monthly" | "yearly"

export function firstDayOfMonth(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z")
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`
}

export function rewindDate(dateStr: string, frequency: Frequency): string {
  const date = new Date(dateStr + "T00:00:00Z")
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() - 7)
  else if (frequency === "monthly") date.setUTCMonth(date.getUTCMonth() - 1)
  else date.setUTCFullYear(date.getUTCFullYear() - 1)
  return date.toISOString().split("T")[0]
}

/**
 * Date the provisional transaction for a recurring cycle was created at.
 * Income provisionals are anchored to the 1st of the due month; expense
 * provisionals sit on the exact due date. Both call sites that locate a
 * cycle's transaction (confirm, skip) must use this — a mismatch means the
 * lookup misses the real row and silently creates a duplicate instead.
 */
export function pendingTransactionDate(dueDate: string, type: string): string {
  return type === "income" ? firstDayOfMonth(dueDate) : dueDate
}
