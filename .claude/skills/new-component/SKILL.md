---
name: new-component
description: Scaffolda un nuovo componente React seguendo
le convenzioni del progetto. Attivare quando si crea
un nuovo componente UI da zero.
---

## Checklist pre-creazione

1. Esiste già un componente shadcn/ui che fa questo?
   → Se sì, usalo o estendilo invece di crearne uno nuovo
2. Il componente è specifico di una pagina o riusabile?
   → Specifico: mettilo vicino alla pagina in /app
   → Riusabile: mettilo in /components o /components/dashboard

## Struttura del file

```tsx
// /components/NomeComponente.tsx
"use client" // solo se usa hook o event handler

interface NomeComponenteProps {
  // props tipizzate
}

export function NomeComponente({ ... }: NomeComponenteProps) {
  return (
    // markup
  )
}
```

## Token e stili

- Usa sempre i token semantici del progetto (definiti in app/styles/_tokens.css)
- Mai classi `dark:` — il tema è gestito con `class="dark"` sull'`<html>`
- Mai colori hardcodati (zinc-xxx, gray-xxx, emerald-xxx) — sempre token semantici
- Tailwind v4: usa `var(--token)` nei CSS custom, non `theme()`

## Navigazione

- Se serve navigare tra pagine con transizione animata:
  usa `usePageTransition()` da `components/landing/transition-provider`
  e chiama `navigate(href)` invece di `<Link>` o `router.push()`
- Per link semplici senza transizione: usa `<Link>` di Next.js

## Checklist post-creazione

- [ ] Props tipizzate con interface
- [ ] Export named (non default)
- [ ] Niente logica di fetch dentro il componente — i dati arrivano come props
- [ ] Stati gestiti: loading, empty, error dove necessario
- [ ] Accessibilità: aria-label su elementi interattivi senza testo visibile
- [ ] Touch target ≥ 44x44px su elementi cliccabili
