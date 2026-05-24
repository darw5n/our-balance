# Totale importi transazioni filtrate

**Data:** 2026-05-24
**Stato:** Approvato

## Problema

La pagina `/transactions` mostra le transazioni filtrate ma non fornisce nessun riepilogo numerico. L'utente non sa quanto speso (o guadagnato) nel periodo/categoria selezionata senza sommare manualmente.

## Soluzione

Aggiungere un banner di riepilogo tra i filtri e la tabella, visibile solo quando almeno un filtro è attivo, che mostra il totale netto delle transazioni filtrate.

## Comportamento

- **Visibilità:** solo quando almeno uno tra `q`, `from`, `to`, `category` è presente nell'URL
- **Calcolo:** somma tutti gli importi filtrati (confirmed + pending); income = +amount, expense = -amount
- **Formato:** `+1.250,00 €` (verde se positivo), `-340,00 €` (rosso se negativo), `0,00 €` (neutro)
- **Contesto:** mostra anche il numero di transazioni incluse nel calcolo (`su N transazioni`)

## Architettura

Il calcolo avviene in `app/(dashboard)/transactions/page.tsx`, server-side, sulle transazioni già fetchate — nessuna query aggiuntiva.

```
transactions[] (già disponibili in page.tsx)
    ↓
filteredTotal = Σ (income ? +amount : -amount)
    ↓
<TransactionsSummary total={filteredTotal} count={transactions.length} />
    ↓
Render sopra <TransactionsTable />
```

## Componente `TransactionsSummary`

Nuovo componente server (no `"use client"`) in `components/dashboard/transactions-summary.tsx`.

**Props:**
```typescript
type Props = {
  total: number   // importo netto pre-calcolato
  count: number   // numero di transazioni
}
```

**Aspetto:** riga orizzontale compatta con testo `Totale: +1.250,00 €  ·  su 12 transazioni`, colorata in base al segno del totale.

## File coinvolti

- `app/(dashboard)/transactions/page.tsx` — aggiunge calcolo totale e render condizionale
- `components/dashboard/transactions-summary.tsx` — nuovo componente (da creare)
