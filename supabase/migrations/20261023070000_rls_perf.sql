-- Prestazioni RLS e indici sulle foreign key (advisor Supabase: auth_rls_initplan,
-- multiple_permissive_policies, unindexed_foreign_keys).
--
-- Le regole di accesso NON cambiano: `auth.uid()` diventa `(select auth.uid())`, così
-- Postgres lo calcola una volta per query invece che per ogni riga.

-- ── Policy: stesso significato, auth.uid() valutato una volta ──
alter policy "Users own transactions" on public.transactions
  using ((select auth.uid()) = user_id);

alter policy "Users own categories" on public.categories
  using (((select auth.uid()) = user_id) or (is_default = true));

alter policy "Users own recurring transactions" on public.recurring_transactions
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users manage own tokens" on public.api_tokens
  using ((select auth.uid()) = user_id);

-- budgets aveva due policy equivalenti: ne resta una, con lo stesso controllo su lettura e scrittura.
drop policy if exists "Users can manage their own budgets" on public.budgets;
alter policy "Users own budgets" on public.budgets
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── Indici sulle foreign key (join e cancellazioni a cascata) ──
create index if not exists api_tokens_user_id_idx on public.api_tokens (user_id);
create index if not exists budgets_category_id_idx on public.budgets (category_id);
create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists mcp_request_log_created_transaction_id_idx on public.mcp_request_log (created_transaction_id);
create index if not exists mcp_request_log_token_id_idx on public.mcp_request_log (token_id);
create index if not exists recurring_transactions_category_id_idx on public.recurring_transactions (category_id);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
