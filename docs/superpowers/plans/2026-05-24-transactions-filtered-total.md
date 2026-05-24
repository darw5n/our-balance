# Totale importi transazioni filtrate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrare il totale netto degli importi filtrati (entrate positive, uscite negative) sopra la tabella transazioni, solo quando almeno un filtro è attivo.

**Architecture:** Il calcolo avviene in `page.tsx` server-side sulle transazioni già fetchate (nessuna query aggiuntiva). Il risultato viene passato come prop a un nuovo componente server `TransactionsSummary`, renderizzato condizionalmente tra i filtri e la tabella.

**Tech Stack:** Next.js 15 App Router (React Server Components), TypeScript, Tailwind CSS v4 con token semantici (`text-income-fg`, `text-expense-fg`, `text-text-2`).

---

### Task 1: Crea il componente `TransactionsSummary`

**Files:**
- Create: `components/dashboard/transactions-summary.tsx`

Il componente è un server component (nessun `"use client"`). Riceve `total` (importo netto pre-calcolato) e `count` (numero transazioni). Usa `formatCurrency` da `@/lib/utils` per il formato italiano (`1.250,00 €`).

- [ ] **Step 1: Crea il file**

```tsx
// components/dashboard/transactions-summary.tsx
import { formatCurrency } from "@/lib/utils"

type Props = {
  total: number
  count: number
}

export function TransactionsSummary({ total, count }: Props) {
  const colorClass =
    total > 0
      ? "text-income-fg"
      : total < 0
        ? "text-expense-fg"
        : "text-text-2"

  const formatted = (total >= 0 ? "+" : "") + formatCurrency(total)

  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-xs">
      <span className="text-text-2">Totale filtrato:</span>
      <span className={`font-semibold tabular-nums ${colorClass}`}>{formatted}</span>
      <span className="text-text-3">·</span>
      <span className="text-text-3">{count} {count === 1 ? "transazione" : "transazioni"}</span>
    </div>
  )
}
```

- [ ] **Step 2: Verifica che il componente compili**

```bash
npm run build
```

Atteso: `✓ Compiled successfully` senza errori TypeScript.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/transactions-summary.tsx
git commit -m "feat(transactions): aggiunge componente TransactionsSummary"
```

---

### Task 2: Integra il calcolo e il render in `page.tsx`

**Files:**
- Modify: `app/(dashboard)/transactions/page.tsx`

Aggiungere:
1. Import di `TransactionsSummary`
2. Variabile `hasFilters` (true se almeno un filtro è attivo)
3. Calcolo `filteredTotal` (somma netta: income = +amount, expense = -amount)
4. Render condizionale del componente tra filtri e tabella

- [ ] **Step 1: Aggiungi l'import**

In cima al file, dopo gli import esistenti:

```tsx
import { TransactionsSummary } from "@/components/dashboard/transactions-summary"
```

- [ ] **Step 2: Aggiungi la logica di calcolo**

Dopo la riga `const [transactions, categories] = await Promise.all([...])`, aggiungi:

```tsx
const hasFilters = !!(q || from || to || category)

const filteredTotal = transactions.reduce((sum, tx) => {
  const amount = Math.abs(Number(tx.amount) || 0)
  return sum + (tx.type === "income" ? amount : -amount)
}, 0)
```

- [ ] **Step 3: Aggiungi il render condizionale**

Nel JSX, tra il `<div>` dei filtri e il `<section>` della tabella, aggiungi:

```tsx
{hasFilters && (
  <TransactionsSummary total={filteredTotal} count={transactions.length} />
)}
```

Il risultato finale del return deve essere:

```tsx
return (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Transazioni</h1>
      <p className="text-xs text-zinc-400">
        Vista lista delle tue transazioni. Filtra per data, descrizione o categoria.
      </p>
    </div>

    <div className="flex items-start gap-3">
      <div className="flex-1">
        <TransactionsFilters
          q={q}
          from={from}
          to={to}
          category={category}
          categories={categories as CategoryOption[]}
        />
      </div>
      <ExportCsvButton transactions={transactions} categories={categories as CategoryOption[]} />
    </div>

    {hasFilters && (
      <TransactionsSummary total={filteredTotal} count={transactions.length} />
    )}

    <section>
      <TransactionsTable transactions={transactions} categories={categories as CategoryOption[]} />
    </section>
  </div>
)
```

- [ ] **Step 4: Build finale**

```bash
npm run build
```

Atteso: `✓ Compiled successfully` senza errori TypeScript.

- [ ] **Step 5: Verifica manuale**

1. Apri `/transactions` senza filtri → il banner NON appare
2. Aggiungi un filtro (es. `?from=2026-01-01`) → il banner appare con il totale corretto
3. Verifica colore: entrate nette → verde, uscite nette → rosso
4. Verifica che `formatCurrency` mostri il formato italiano (`1.250,00 €`)

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/transactions/page.tsx
git commit -m "feat(transactions): mostra totale netto importi quando i filtri sono attivi"
```
