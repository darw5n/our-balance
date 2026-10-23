# Coding standards — review

Regole per chi fa la review di un diff. Coprono i casi di giudizio: quelli meccanici li controllano
già lint (colori fissi, `dark:`), tipi e prove (`tests/`, contrasto dei token compreso).
Ogni regola nasce da un errore trovato in questo repo.

## Dati

- **Limite delle 1.000 righe.** Supabase restituisce al massimo 1.000 righe per richiesta, senza errore.
  Ogni query che legge una lista è limitata da un intervallo che resta piccolo per costruzione
  (un mese, un anno: ~400 righe) oppure legge a blocchi con `range()` e ordine stabile
  (`date`, `created_at`, `id`), come `fetchInBatches` in `lib/supabase/queries/transaction-list.ts`.
  La lista transazioni era troncata a 1.000 su 1.240.
- **Builder "thenable".** Una query Supabase restituita da una funzione `async` parte subito: le funzioni
  che costruiscono query da completare dopo (`.range()`, `.order()`) sono sincrone.
- **Dati incompleti mai presentati come completi.** Se una lettura a blocchi si interrompe, il chiamante
  lo sa e lo dice all'utente (l'export CSV restituisce un errore, non un file a metà).
- **Spese in comune** sempre con `applyScope()`.

## Database

- **RLS completa.** Ogni policy ha `using` e `with check`, entrambe `(select auth.uid()) = user_id`.
  Una condizione in `OR` (es. `or is_default = true`) allarga anche la scrittura: la policy delle
  categorie permetteva di scrivere righe con lo `user_id` di un altro utente.
- Nuove foreign key con il loro indice.

## Interfaccia

- **Testo piccolo solo con i token di `TEXT_TOKENS`** (`tests/contrast.test.ts`). Un nuovo colore da testo
  entra in quella lista, così la prova ne controlla il contrasto. I token pieni (`income`, `expense`,
  `accent-brand`) servono per riempimenti, grafici e icone.
- **Date e ore con fuso esplicito** `Europe/Rome`: server (UTC) e browser devono produrre lo stesso testo,
  altrimenti React segnala un errore di idratazione.
- **Movimento** con alternativa per `prefers-reduced-motion`, anche nelle transizioni tra pagine.
- Stati completi per ogni azione: in corso (pulsante disattivato, testo che cambia), errore in italiano
  che dice cosa fare, successo.
