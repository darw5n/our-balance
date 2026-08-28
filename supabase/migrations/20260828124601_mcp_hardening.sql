-- Fase 4 — Hardening endpoint MCP
-- Token API salvato come hash sha-256 (non più in chiaro), tracciamento
-- ultimo utilizzo, e log delle richieste per idempotenza + rate limit.

-- ─────────────────────────────────────────────────────────────────────
-- api_tokens: hash a riposo + last_used_at
-- ─────────────────────────────────────────────────────────────────────
alter table public.api_tokens add column if not exists token_hash  text;
alter table public.api_tokens add column if not exists last_used_at timestamptz;

-- Backfill: hash dei token in chiaro esistenti.
update public.api_tokens
set token_hash = encode(digest(token, 'sha256'), 'hex')
where token_hash is null and token is not null;

alter table public.api_tokens alter column token_hash set not null;

-- Il token in chiaro non viene più scritto né letto; resta nullable per
-- non rompere il codice ancora in produzione tra migration e deploy.
-- Verrà rimosso in una migration successiva.
alter table public.api_tokens alter column token drop not null;

create unique index if not exists api_tokens_token_hash_key
  on public.api_tokens (token_hash);

-- ─────────────────────────────────────────────────────────────────────
-- mcp_request_log: idempotenza + rate limit + audit
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.mcp_request_log (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  token_id               uuid references public.api_tokens(id) on delete set null,
  method                 text,
  tool_name              text,
  request_id             text,
  idempotency_key        text,
  response_text          text,
  created_transaction_id uuid references public.transactions(id) on delete set null,
  is_error               boolean not null default false,
  created_at             timestamptz not null default now()
);

create index if not exists mcp_request_log_user_created_idx
  on public.mcp_request_log (user_id, created_at desc);

create unique index if not exists mcp_request_log_idem_idx
  on public.mcp_request_log (user_id, idempotency_key)
  where idempotency_key is not null;

-- RLS (l'endpoint usa la service-role key e bypassa comunque le policy —
-- queste sono difesa in profondità e coerenza con le altre tabelle).
alter table public.mcp_request_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mcp_request_log'
      and policyname = 'Users own mcp log'
  ) then
    create policy "Users own mcp log" on public.mcp_request_log
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;
