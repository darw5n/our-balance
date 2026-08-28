-- Fase 3 — Ricorrenze complete
-- Aggiunge: stato (active/paused/ended) + data di fine alle ricorrenze,
-- e un legame esplicito transazione ↔ ricorrenza (transactions.recurring_id).
--
-- Le RLS policy esistono già su entrambe le tabelle come ALL con
-- (auth.uid() = user_id) — le nuove colonne sono coperte automaticamente.

-- ─────────────────────────────────────────────────────────────────────
-- recurring_transactions: status
-- ─────────────────────────────────────────────────────────────────────
alter table public.recurring_transactions
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recurring_transactions_status_check'
      and conrelid = 'public.recurring_transactions'::regclass
  ) then
    alter table public.recurring_transactions
      add constraint recurring_transactions_status_check
      check (status in ('active', 'paused', 'ended'));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- recurring_transactions: end_date (inclusiva, opzionale)
-- ─────────────────────────────────────────────────────────────────────
alter table public.recurring_transactions
  add column if not exists end_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recurring_transactions_end_after_start'
      and conrelid = 'public.recurring_transactions'::regclass
  ) then
    alter table public.recurring_transactions
      add constraint recurring_transactions_end_after_start
      check (end_date is null or end_date >= start_date);
  end if;
end $$;

-- Indice per la query del processor (ricorrenze attive scadute).
create index if not exists recurring_transactions_process_idx
  on public.recurring_transactions (user_id, next_due_date)
  where is_active and status = 'active';

-- ─────────────────────────────────────────────────────────────────────
-- transactions: recurring_id (legame esplicito al ciclo di ricorrenza)
-- ─────────────────────────────────────────────────────────────────────
alter table public.transactions
  add column if not exists recurring_id uuid
  references public.recurring_transactions(id) on delete set null;

create index if not exists transactions_recurring_id_idx
  on public.transactions (recurring_id);

-- Indice generale su (user_id, date): mancava del tutto, usato da
-- dashboard / transazioni / report a ogni caricamento.
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- Backfill: collega le transazioni storiche alla ricorrenza SOLO quando
-- il match è univoco — una sola ricorrenza compatibile per (user, type,
-- scope, amount, description) E una sola transazione compatibile per data.
-- I casi ambigui (es. duplicati creati dal vecchio bug) restano scollegati
-- e continuano a usare il match euristico come prima.
update public.transactions t
set recurring_id = r.id
from public.recurring_transactions r
where t.recurring_id is null
  and t.user_id = r.user_id
  and t.type = r.type
  and t.scope = r.scope
  and t.amount = r.amount
  and t.description is not distinct from r.description
  and (
    select count(*) from public.recurring_transactions r2
    where r2.user_id = t.user_id and r2.type = t.type and r2.scope = t.scope
      and r2.amount = t.amount and r2.description is not distinct from t.description
  ) = 1
  and (
    select count(*) from public.transactions t2
    where t2.user_id = t.user_id and t2.type = t.type and t2.scope = t.scope
      and t2.amount = t.amount and t2.description is not distinct from t.description
      and t2.date = t.date
  ) = 1;

-- Una sola transazione per ciclo (data) di ogni ricorrenza.
create unique index if not exists transactions_recurring_cycle_idx
  on public.transactions (recurring_id, date)
  where recurring_id is not null;
