-- Fase 5 — Preferenze utente
-- La tabella public.profiles esiste già (id → auth.users, default_view,
-- monthly_income_estimate). Aggiungiamo solo la preferenza tema.
-- RLS già attiva: policy "Users own profile" ALL con (auth.uid() = id).

alter table public.profiles
  add column if not exists theme text not null default 'system';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_theme_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_check check (theme in ('light', 'dark', 'system'));
  end if;
end $$;
