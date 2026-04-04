---
name: git-flow
description: Sequenza completa per commit, push, PR, merge e
creazione nuovo branch. Attivare quando si vuole salvare
e pubblicare le modifiche correnti.
---

Segui sempre questa sequenza nell'ordine esatto.

## 1. Commit

Aggiungi solo i file modificati (mai `git add -A` o `git add .`):

```bash
git add <file1> <file2>
git commit -m "tipo(scope): descrizione breve in italiano"
```

Tipi: `feat` `fix` `style` `refactor` `chore`
Scope: `auth` `dashboard` `transactions` `components` `db` `config` `mcp`

## 2. Push

Prima volta su un branch nuovo:
```bash
git push -u origin features/<nome-branch>
```

## 3. Pull Request

```bash
gh pr create --title "tipo: titolo" --body "$(cat <<'EOF'
## Summary
- punto 1
- punto 2

## Test plan
- [ ] cosa testare

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 4. Merge

**NON usare `--delete-branch`** — i branch si tengono sempre.
```bash
gh pr merge <numero> --merge
```

## 5. Nuovo branch

Subito dopo il merge, mai lavorare su main:
```bash
git checkout main && git pull origin main && git checkout -b features/<nome>
```

## Regole

- Main branch: `main`
- Branch naming: `features/<nome-descrittivo>`
- Non committare mai direttamente su main
- Non fare force push su main
