---
name: commit
description: Genera un messaggio di commit seguendo 
Conventional Commits. Attivare quando si vuole 
fare commit delle modifiche correnti.
---

Guarda le modifiche correnti (git diff --staged o 
descrizione fornita) e genera un messaggio di commit 
seguendo questo formato:

## Formato Conventional Commits

tipo(scope): descrizione breve in italiano

[corpo opzionale: cosa è cambiato e perché,
non come — quello si vede dal codice]

## Tipi

- feat → nuova funzionalità
- fix → correzione bug
- style → modifiche UI/CSS senza logica
- refactor → riscrittura senza cambiare comportamento
- chore → config, dipendenze, file non-codice
- docs → documentazione

## Scope (per our-balance)

auth, dashboard, transactions, components, db, config

## Esempi

feat(transactions): aggiunge filtro per categoria
fix(auth): corregge redirect dopo login su mobile
style(dashboard): migliora spaziatura card su mobile
chore(deps): aggiorna shadcn/ui alla versione 2.1

## Regole

- Descrizione max 72 caratteri
- Imperativo presente ("aggiunge", non "aggiunto")
- Niente punto finale
- Se le modifiche riguardano più scope, 
  suggerisci di splittare il commit
