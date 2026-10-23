# OurBalance

App per tracciare cashflow personale condiviso
(entrate e uscite tra me e partner).

Stack: Next.js 16 App Router, React 19, TypeScript,
Tailwind CSS v4, shadcn/ui, Supabase, Vercel.

## Struttura

```
/app
  /(dashboard)/         → pagine autenticate (layout con shell)
    dashboard/          → home con grafici cashflow
    transactions/       → lista, filtri, confronto categorie
    reports/            → report annuali e categorie
    budgets/            → gestione budget per categoria
    categories/         → gestione categorie
    recurring/          → transazioni ricorrenti
    settings/           → token API per il server MCP
  /actions/             → Server Actions (mutazioni + revalidatePath)
  /api/mcp/[token]/     → server MCP HTTP (JSON-RPC)
  /auth/callback/       → callback OAuth Supabase
  /(public)/            → layout con TransitionProvider (dissolvenza tra pagine)
    login/ signup/      → auth email + Google OAuth
    page.tsx            → landing page (marketing)
  /layout.tsx           → root layout con provider globali

/components
  /ui/                  → componenti base shadcn/ui
  /dashboard/           → shell, header, nav, grafici, dialog
  /landing/             → landing-page.tsx, transition-provider.tsx

/lib
  supabase-server.ts    → client SSR + getServerUser() (cache)
  supabase-admin.ts     → client service-role (solo server, bypassa RLS)
  supabase/queries/     → query read per i Server Component (in cache())
  supabase/query-utils.ts → helper condivisi (range date, applyScope, ...)
  utils.ts              → formattazione valute/date italiane

/proxy.ts               → middleware Next 16: refresh sessione + protezione route
```

## Regole di progetto

- Usa i componenti shadcn/ui esistenti prima di crearne di nuovi
- I file in /components/ui sono base shadcn — modificali solo per
  sostituire colori hardcodati con token semantici del progetto,
  mai per aggiungere logica o varianti nuove
- Nuovi componenti riusabili → /components
- Componenti specifici di una pagina → vicino alla pagina in /app

## Dati e query

- I Server Component leggono tramite le funzioni in `lib/supabase/queries/*`,
  avvolte in `cache()` di React per deduplicare le chiamate nella stessa richiesta.
- Le mutazioni sono Server Actions in `app/actions/*`, che chiamano `revalidatePath`.
- Helper condivisi (range mese/anno, parsing param, join) in `lib/supabase/query-utils.ts`.
- Gli importi sono salvati come `float`. In vista "personale" le spese con
  `scope = "family"` vengono dimezzate al 50% tramite l'helper `applyScope()` —
  usalo sempre, non riscrivere il calcolo a mano.
- `processRecurringTransactions()` gira **solo** dalla pagina dashboard, **dopo la risposta**
  dentro `after()` (elabora le ricorrenze scadute; ha già la logica di recupero per i cicli arretrati).
  In `after()` non si possono leggere i cookie: il client va creato prima con
  `createSupabaseClientForAfter()` e passato alla funzione.

## Migration

File in `supabase/migrations/AAAAMMGGhhmmss_nome.sql`, con le RLS policy nello stesso file.
Le scritture sul database dall'agente sono bloccate: Darwin applica la migration dal SQL Editor.
Prepara l'SQL con `scripts/migration-sql.sh <file>` (applica e registra nello storico in una
transazione, copia negli appunti), poi verifica con `list_migrations` e una SELECT di sola lettura.

## Design tokens

I colori sono token semantici definiti inline in `app/globals.css`
(blocchi `:root` per il tema chiaro, `.dark` per lo scuro).
- Mai classi `dark:` — il tema è gestito con `class="dark"` sull'`<html>`
- Mai colori hardcodati come `zinc-900`, `gray-200` — usa i token
- Tailwind v4 non supporta `theme()` nei CSS custom — usa `var(--token)`

## Autenticazione

Gestita con Supabase Auth.
- Email + password: `supabase.auth.signUp()` / `signInWithPassword()`
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: "google" })`
- Callback OAuth: `/auth/callback/route.ts` (scambia code per sessione)
- `proxy.ts` fa il refresh della sessione a ogni request e reindirizza a
  `/login` se un utente non autenticato apre una route protetta
  (`/dashboard`, `/transactions`, `/reports`, `/recurring`, `/budgets`,
  `/categories`, `/settings`). Il layout `(dashboard)` ripete il controllo
  come doppia difesa.
- Site URL su Supabase deve puntare al dominio di produzione (non localhost)
  per evitare che i link di conferma email non funzionino

## Sviluppo locale

- `npm run dev` — richiede `.env.local` con le chiavi Supabase
- Errore `PGRST303 "JWT issued at future"`: l'orologio del Mac è fuori sync.
  Risincronizza l'ora di sistema (o rifai il login) e ricarica.
- Prove automatiche con Vitest in `tests/` (`npm test`): helper di `query-utils` e lettura a blocchi
  di `transaction-list` con un finto client Supabase. Validazione completa: `npm test`, `npx tsc --noEmit`, `npm run build`.

## MCP Server

Esposto su `/app/api/mcp/[token]/route.ts`.
- Protocollo: JSON-RPC 2.0 over HTTP POST (standard MCP)
- Auth: token personale salvato nella tabella `api_tokens` su Supabase
- Tools disponibili: `create_transaction`, `get_categories`
- Compatibile con Claude Desktop e potenzialmente altri client MCP (es. Perplexity)
- Per aggiungere tool: aggiungere in `TOOLS[]` e aggiungere handler nel blocco `tools/call`

## Transizioni pagina

`TransitionProvider` in `components/landing/transition-provider.tsx`
è wrappato solo nel layout `app/(public)/` (landing, login, signup): l'app autenticata
non scarica `motion`. `usePageTransition()` funziona solo dentro quelle pagine.
- Usa `navigate(href)` al posto di `<Link>` o `router.push()` quando
  si vuole la transizione animata tra pagine pubbliche
- La transizione attuale è una dissolvenza in nero (token `page-transition`), ~200 ms per lato
- Nell'app autenticata le transizioni sono in CSS: `app/(dashboard)/template.tsx` (`.route-fade`)

## Grafici

I grafici recharts si importano da `components/dashboard/charts/lazy-charts.tsx`
(`next/dynamic`, solo browser, segnaposto alto come il grafico), non dai file originali.

## Skill disponibili

Le skill sono in `.claude/skills/` — sono template riutilizzabili
per task ricorrenti. Leggile prima di iniziare il task relativo.

- `git-flow/` → commit, push, PR, merge, nuovo branch
- `commit/` → formato Conventional Commits
- `new-component/` → scaffold componente React
- `think/` → analisi e pianificazione pre-implementazione
- `ux-review/` → review UX e accessibilità

Regola: crea una nuova skill solo quando Claude fa errori ripetuti
su un argomento specifico, o quando devi spiegare le stesse cose
ogni sessione. Non pianificarle in anticipo.
