# OurBalance

App per tracciare cashflow personale condiviso
(entrate e uscite tra me e partner).

Stack: Next.js 15 App Router, TypeScript,
Tailwind CSS v4, shadcn/ui, Supabase, Vercel.

## Struttura

```
/app
  /(dashboard)/         → pagine autenticate (layout con shell)
    dashboard/          → home con grafici cashflow
    transactions/       → lista e filtri transazioni
    reports/            → report annuali e categorie
    budget/             → gestione budget per categoria
    categories/         → gestione categorie
    scheduled/          → transazioni ricorrenti
  /api/mcp/[token]/     → server MCP HTTP (JSON-RPC)
  /auth/callback/       → callback OAuth Supabase
  /login/               → login email + Google OAuth
  /signup/              → registrazione email + Google OAuth
  /page.tsx             → landing page (marketing)
  /layout.tsx           → root layout con provider globali

/components
  /ui/                  → componenti base shadcn/ui
  /dashboard/           → shell, header, nav, grafici
  /landing/             → landing-page.tsx, transition-provider.tsx

/lib                    → utility, tipi TypeScript, helpers
/middleware.ts          → autenticazione e redirect
```

## Regole di progetto

- Usa i componenti shadcn/ui esistenti prima di crearne di nuovi
- I file in /components/ui sono base shadcn — modificali solo per
  sostituire colori hardcodati con token semantici del progetto,
  mai per aggiungere logica o varianti nuove
- Nuovi componenti riusabili → /components
- Componenti specifici di una pagina → vicino alla pagina in /app

## Design tokens

I colori sono token semantici definiti in `app/styles/_tokens.css`.
- Mai classi `dark:` — il tema è gestito con `class="dark"` sull'`<html>`
- Mai colori hardcodati come `zinc-900`, `gray-200` — usa i token
- Tailwind v4 non supporta `theme()` nei CSS custom — usa `var(--token)`

## Autenticazione

Gestita con Supabase Auth.
- Email + password: `supabase.auth.signUp()` / `signInWithPassword()`
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: "google" })`
- Callback OAuth: `/auth/callback/route.ts` (scambia code per sessione)
- Middleware protegge tutte le route `/(dashboard)/`
- Site URL su Supabase deve puntare al dominio di produzione (non localhost)
  per evitare che i link di conferma email non funzionino

## MCP Server

Esposto su `/app/api/mcp/[token]/route.ts`.
- Protocollo: JSON-RPC 2.0 over HTTP POST (standard MCP)
- Auth: token personale salvato nella tabella `api_tokens` su Supabase
- Tools disponibili: `create_transaction`, `get_categories`
- Compatibile con Claude Desktop e potenzialmente altri client MCP (es. Perplexity)
- Per aggiungere tool: aggiungere in `TOOLS[]` e aggiungere handler nel blocco `tools/call`

## Transizioni pagina

`TransitionProvider` in `components/landing/transition-provider.tsx`
è wrappato nel root layout e fornisce `usePageTransition()` a tutti i componenti.
- Usa `navigate(href)` al posto di `<Link>` o `router.push()` quando
  si vuole la transizione animata tra pagine
- La transizione attuale è una dissolvenza in nero (zinc-950)

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
