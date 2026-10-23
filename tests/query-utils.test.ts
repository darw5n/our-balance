import { describe, expect, it } from "vitest"
import {
  applyScope,
  getYearRange,
  ilikeContainsLiteral,
  parseMonthParam,
  pendingTransactionDate,
  rewindDate,
  toNumber,
} from "@/lib/supabase/query-utils"

describe("applyScope", () => {
  it("dimezza le spese in comune nella vista personale", () => {
    expect(applyScope(100, "family", "personal")).toBe(50)
  })

  it("lascia intere le spese personali e la vista in comune", () => {
    expect(applyScope(100, "personal", "personal")).toBe(100)
    expect(applyScope(100, null, "personal")).toBe(100)
    expect(applyScope(100, "family", "family")).toBe(100)
  })
})

describe("toNumber", () => {
  it("accetta numeri e stringhe con la virgola", () => {
    expect(toNumber(12.5)).toBe(12.5)
    expect(toNumber("12,5")).toBe(12.5)
  })

  it("restituisce 0 per valori non validi", () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber("abc")).toBe(0)
    expect(toNumber(Number.NaN)).toBe(0)
  })
})

describe("ilikeContainsLiteral", () => {
  it("racchiude il testo tra virgolette e jolly", () => {
    expect(ilikeContainsLiteral("spesa")).toBe('"%spesa%"')
  })

  it("virgole e parentesi restano dentro le virgolette", () => {
    expect(ilikeContainsLiteral("lago, offerta (+ luter)")).toBe('"%lago, offerta (+ luter)%"')
  })

  it("% e _ cercati alla lettera, non come jolly", () => {
    expect(ilikeContainsLiteral("50%_off")).toBe('"%50\\\\%\\\\_off%"')
  })

  it("protegge virgolette e barre rovesciate", () => {
    expect(ilikeContainsLiteral('a"b')).toBe('"%a\\"b%"')
    expect(ilikeContainsLiteral("a\\b")).toBe('"%a\\\\\\\\b%"')
  })
})

describe("date", () => {
  it("getYearRange copre l'anno intero in UTC", () => {
    expect(getYearRange(2025)).toEqual({
      startISO: "2025-01-01T00:00:00.000Z",
      endISO: "2026-01-01T00:00:00.000Z",
    })
  })

  it("parseMonthParam accetta solo AAAA-MM", () => {
    expect(parseMonthParam("2026-03")?.toISOString()).toBe("2026-03-01T00:00:00.000Z")
    expect(parseMonthParam("2026-3")).toBeUndefined()
    expect(parseMonthParam(undefined)).toBeUndefined()
  })

  it("rewindDate torna indietro di un ciclo", () => {
    expect(rewindDate("2026-03-10", "weekly")).toBe("2026-03-03")
    expect(rewindDate("2026-03-10", "monthly")).toBe("2026-02-10")
    expect(rewindDate("2025-06-15", "yearly")).toBe("2024-06-15")
  })

  it("pendingTransactionDate: entrate al primo del mese, uscite alla scadenza", () => {
    expect(pendingTransactionDate("2026-10-15", "income")).toBe("2026-10-01")
    expect(pendingTransactionDate("2026-10-15", "expense")).toBe("2026-10-15")
  })
})
