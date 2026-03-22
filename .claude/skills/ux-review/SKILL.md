---
name: ux-review
description: Analisi UX e accessibilità di un componente 
o schermata. Attivare quando si termina un componente UI 
o si chiede una review di design.
---

Analizza il componente o la schermata su questi livelli:

## Accessibilità
- [ ] Contrasto colori: 4.5:1 testo normale, 3:1 testo grande
- [ ] Focus visible presente e visibile
- [ ] Tab order logico
- [ ] aria-label su tutti gli elementi interattivi 
      senza testo visibile
- [ ] Animazioni rispettano prefers-reduced-motion
- [ ] Touch target ≥ 44x44px

## UX
- [ ] Tutti gli stati gestiti: empty, loading, error, success
- [ ] Il microcopy è descrittivo (no messaggi generici)
- [ ] L'azione principale è evidente
- [ ] Non c'è sovraccarico cognitivo (troppe info/azioni insieme)

## Coerenza con il progetto
- [ ] Usa i componenti shadcn/ui esistenti dove possibile
- [ ] Segue le convenzioni visive già presenti

## Output

Per ogni problema trovato:
🔴 Bloccante — rompe accessibilità o usabilità core
🟡 Migliorabile — impatta UX ma non bloccante
🟢 Suggerimento — best practice non applicata

Proponi il fix per ogni 🔴 e 🟡 con codice quando utile.