import { beforeEach, describe, expect, it, vi } from "vitest"

// Finto client Supabase: tiene `rows` in memoria e, come il vero, restituisce
// al massimo 1.000 righe per richiesta. Registra i blocchi chiesti con range().
let rows: { id: string; amount: number; type: string; scope: string | null }[] = []
let ranges: [number, number][] = []
let failAtStart: number | null = null

function fakeQuery() {
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    lte: () => query,
    or: () => query,
    order: () => query,
    range: async (start: number, end: number) => {
      ranges.push([start, end])
      if (start === failAtStart) return { data: null, error: { message: "timeout" }, count: null }
      const last = Math.min(end, start + 999)
      return { data: rows.slice(start, last + 1), error: null, count: rows.length }
    },
  }
  return query
}

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({ from: () => fakeQuery() }),
}))
vi.mock("@/lib/supabase/queries/categories", () => ({ getCategories: async () => [] }))

const { getAllTransactions, getTransactionList, getTransactionTotals, sumTotals } = await import(
  "@/lib/supabase/queries/transaction-list"
)

function makeRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    amount: 10,
    type: i % 2 ? "income" : "expense",
    scope: i % 4 === 0 ? "family" : "personal",
  }))
}

beforeEach(() => {
  ranges = []
  failAtStart = null
})

describe("lettura a blocchi oltre le 1.000 righe", () => {
  it("l'export legge tutte le 2.500 righe in tre blocchi", async () => {
    rows = makeRows(2500)
    const all = await getAllTransactions("u1", {})
    expect(all).toHaveLength(2500)
    expect(ranges.length).toBe(3)
  })

  it("la lista si ferma al limite chiesto e riporta il totale vero", async () => {
    rows = makeRows(1240)
    const { transactions, total } = await getTransactionList("u1", {}, 1100)
    expect(transactions).toHaveLength(1100)
    expect(total).toBe(1240)
    expect(ranges).toEqual([[0, 999], [1000, 1099]])
  })

  it("con meno righe del limite basta una richiesta", async () => {
    rows = makeRows(424)
    const { transactions, total } = await getTransactionList("u1", {}, 100)
    expect(transactions).toHaveLength(100)
    expect(total).toBe(424)
    expect(ranges.length).toBe(1)
  })

  it("se un blocco fallisce l'export restituisce null, non un file a metà", async () => {
    rows = makeRows(2500)
    failAtStart = 1000
    expect(await getAllTransactions("u1", {})).toBeNull()
  })

  it("i totali contano tutte le righe, non solo le prime 1.000", async () => {
    rows = makeRows(2000)
    const totals = await getTransactionTotals("u1", {})
    expect(totals).toEqual(sumTotals(rows))
    expect(totals.income + totals.expense).toBeGreaterThan(10_000)
  })
})

describe("sumTotals", () => {
  it("in vista personale le spese in comune contano a metà", () => {
    expect(
      sumTotals([
        { amount: 100, type: "expense", scope: "family" },
        { amount: -40, type: "expense", scope: "personal" },
        { amount: 1500, type: "income", scope: null },
      ])
    ).toEqual({ income: 1500, expense: 90 })
  })
})
