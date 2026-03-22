# OurBalance

App per tracciare cashflow personale condiviso 
(entrate e uscite tra me e partner).

Stack: Next.js 15 App Router, TypeScript, 
Tailwind CSS, shadcn/ui, Supabase.

## Struttura
- /app → pagine e route (Next.js App Router)
- /components → componenti React riusabili
- /lib → utility, tipi TypeScript, helpers
- /middleware.ts → gestione autenticazione e redirect
- components.json → configurazione shadcn/ui


## Regole di progetto
- Usa i componenti shadcn/ui esistenti prima di crearne di nuovi
- I file in /components/ui sono base shadcn — modificali solo per
  sostituire colori hardcodati con token semantici del progetto,
  mai per aggiungere logica o varianti nuove
- Nuovi componenti riusabili → /components
- Componenti specifici di una pagina → vicino alla pagina in /app

## Context aggiuntivo
I file in .claude/agent_docs/ contengono istruzioni specifiche su
argomenti dove Claude ha fatto errori ripetuti. Leggili sempre prima
di iniziare task correlati (quando presenti).
