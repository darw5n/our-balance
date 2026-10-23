-- Categorie: ognuno legge e scrive solo le proprie.
--
-- Prima la policy era `auth.uid() = user_id OR is_default = true` senza WITH CHECK, quindi la
-- stessa condizione valeva anche in scrittura: chiunque poteva creare una categoria con
-- is_default = true e user_id di un altro utente (che la vedeva nella sua lista), o una
-- categoria "predefinita" leggibile da tutti. Le categorie predefinite non esistono nel
-- database e l'app non usa is_default (le categorie iniziali si creano per utente), quindi
-- la condizione si toglie.
alter policy "Users own categories" on public.categories
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
