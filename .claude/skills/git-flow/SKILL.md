---
name: git-flow
description: Sequenza completa per commit, push, PR, merge e
creazione nuovo branch. Attivare quando si vuole salvare
e pubblicare le modifiche correnti.
---

Segui sempre questa sequenza nell'ordine esatto.

## 1. Commit

Aggiungi solo i file modificati (mai `git add -A`):

```bash
git add <file1> <file2>
git commit -m "tipo(scope): descrizione breve in italiano"
```

Tipi: `feat` `fix` `style` `refactor` `chore`
Scope: `auth` `dashboard` `transactions` `components` `db` `config`

## 2. Push

Prima volta su un branch nuovo:
```bash
git push -u origin features/<nome-branch>
```

## 3. Pull Request

```bash
gh pr create --title "tipo: titolo" --body "$(cat <<'EOF'
## Modifiche
- punto 1
- punto 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 4. Merge

**NON usare `--delete-branch`** — i branch si tengono sempre.
```bash
gh pr merge --merge
```

## 5. Nuovo branch

Subito dopo il merge, mai lavorare su main:
```bash
git checkout main && git pull origin main && git checkout -b features/<nome>
```

Per iterazioni UI successive usare `features/minor-improvements-N`
incrementando il numero.
