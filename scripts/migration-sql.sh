#!/usr/bin/env bash
# Prepara una migration da incollare nel SQL Editor di Supabase: applica il file e lo registra
# nello storico (supabase_migrations.schema_migrations) nella stessa transazione, così repo e
# database restano allineati. Copia il risultato negli appunti (macOS) e lo stampa.
#
# Uso: scripts/migration-sql.sh supabase/migrations/20261023080000_nome.sql
set -euo pipefail

file="${1:?Indica il file della migration, es. supabase/migrations/20261023080000_nome.sql}"
[[ -f "$file" ]] || { echo "File non trovato: $file" >&2; exit 1; }

base="$(basename "$file" .sql)"
version="${base%%_*}"
name="${base#*_}"
[[ "$version" =~ ^[0-9]{14}$ ]] || { echo "Il nome deve iniziare con AAAAMMGGhhmmss_: $base" >&2; exit 1; }
if grep -q '\$mig\$' "$file"; then
  echo "Il file contiene \$mig\$, che serve da delimitatore: rinominalo nello script." >&2; exit 1
fi

sql="begin;

$(cat "$file")

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('$version', '$name', array[\$mig\$$(cat "$file")\$mig\$])
on conflict (version) do nothing;

commit;"

printf '%s\n' "$sql"
if command -v pbcopy >/dev/null; then
  printf '%s\n' "$sql" | pbcopy
  echo "-- Copiato negli appunti: incollalo nel SQL Editor ed esegui." >&2
fi
