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
