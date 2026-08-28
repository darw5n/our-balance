-- Pulizia schema: rimozione di colonne legacy inutilizzate.
-- Verificato prima della migration: 0 righe con valori non-default e nessun
-- riferimento nel codice applicativo. DROP COLUMN rimuove automaticamente
-- indici e vincoli che coinvolgono solo quelle colonne.

-- api_tokens: il token in chiaro non serve più (auth via token_hash dalla Fase 4)
alter table public.api_tokens drop column if exists token;

-- transactions: residui di un vecchio modello di ricorrenza inline,
-- sostituito dalla tabella recurring_transactions
alter table public.transactions drop column if exists is_recurring;
alter table public.transactions drop column if exists recurrence_interval;
alter table public.transactions drop column if exists parent_transaction_id;

-- budgets: solo amount_limit per (user_id, category_id) è usato
alter table public.budgets drop column if exists period;
alter table public.budgets drop column if exists year;
alter table public.budgets drop column if exists month;

-- categories: le icone sono risolte da emoji + nome, non da questa colonna
alter table public.categories drop column if exists icon;
