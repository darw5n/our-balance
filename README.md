# OurBalance

**OurBalance** è un'app di gestione delle finanze personali e di coppia, pensata per tracciare entrate, uscite e risparmi in modo semplice ed efficace.

Progettata per chi vuole avere una visione chiara del proprio bilancio mensile — sia individuale che condiviso con il partner — senza la complessità di tool aziendali o fogli di calcolo.

## Funzionalità

- **Dashboard** — panoramica di entrate, uscite e netto del mese corrente, con budget e transazioni ricorrenti in scadenza
- **Transazioni** — lista completa con filtri per data, categoria e descrizione; supporto per spese personali e in comune
- **Report** — analisi annuale con grafici cashflow, confronto anni, suddivisione macro-categorie (necessità / svago / risparmi) e tabella mensile per categoria
- **Budget** — definizione di limiti di spesa per categoria con avvisi visivi al superamento
- **Programmati** — gestione di transazioni ricorrenti (settimanali, mensili, annuali) con conferma o skip al momento della scadenza
- **Categorie** — categorie personalizzabili con colori e macro-categoria (necessità, svago, investimenti)
- **Vista famiglia** — modalità dedicata alle spese condivise, con calcolo automatico della quota al 50%
- **Integrazione Claude MCP** — aggiunta di transazioni direttamente dalla chat di Claude, caricando la foto di uno scontrino

## Tech stack

- [Next.js 16](https://nextjs.org) — App Router, Server Components, Server Actions
- [Supabase](https://supabase.com) — database PostgreSQL, autenticazione OAuth
- [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org) — grafici
- [Lucide React](https://lucide.dev) — icone

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### Variabili d'ambiente

Crea un file `.env.local` nella root con:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Integrazione Claude MCP

OurBalance espone un server MCP compatibile con Claude.ai che permette di creare transazioni direttamente dalla chat.

1. Vai su `/settings` nell'app e genera il tuo token personale
2. In Claude.ai → Impostazioni → Integrazioni → Aggiungi connettore personalizzato
3. Incolla l'URL MCP personale (include il token)
4. Carica la foto di uno scontrino in chat e scrivi: *"Aggiungi questa spesa a OurBalance"*

## Deploy

L'app è ottimizzata per il deploy su [Vercel](https://vercel.com). È sufficiente collegare il repository e aggiungere le variabili d'ambiente nel pannello del progetto.
