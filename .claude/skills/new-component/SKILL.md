---
name: new-component
description: Scaffolda un nuovo componente React seguendo 
le convenzioni del progetto. Attivare quando si crea 
un nuovo componente UI da zero.
---

Per creare un nuovo componente in our-balance:

## Checklist pre-creazione

1. Esiste già un componente shadcn/ui che fa questo?
   → Se sì, usalo o estendilo invece di crearne uno nuovo
2. Il componente è specifico di una pagina o riusabile?
   → Specifico: mettilo vicino alla pagina in /app
   → Riusabile: mettilo in /components

## Struttura del file

```tsx
// /components/NomeComponente.tsx

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

- Usa sempre i token semantici del progetto
- Mai classi `dark:` — il tema è gestito con `class="dark"` sull'`<html>`
- Mai colori hardcodati (zinc-xxx, gray-xxx) — sempre token semantici

## Checklist post-creazione

- [ ] Props tipizzate con interface
- [ ] Export named (non default)
- [ ] Niente logica di fetch dentro il componente — i dati arrivano come props
- [ ] Stati gestiti: loading, empty, error dove necessario
