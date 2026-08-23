#!/usr/bin/env bash
set -euo pipefail

printf 'GURMAO.cz – kontrola projektu\n'
printf '===========================\n\n'

required_files=(
  index.html
  restaurace.html
  restaurant.html
  mapa.html
  feed.html
  collections.html
  profile.html
  kontakt.html
  supabase-client.js
  app.js
  restaurace.js
  mapa.js
  feed-page.js
  collections-page.js
  restaurant-detail-page.js
  scripts/runtime-quality.test.mjs
  supabase/config.toml
)

missing=0
printf 'Klíčové soubory:\n'
for file in "${required_files[@]}"; do
  if [[ -f "$file" ]]; then
    printf '  OK  %s\n' "$file"
  else
    printf '  CHYBÍ  %s\n' "$file"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  printf '\nProjekt nemá všechny povinné soubory.\n' >&2
  exit 1
fi

printf '\nKontrola retired runtime souborů:\n'
retired_files=(
  runtime-guard.js
  hide-price-level.js
  restaurant-card-status.js
  restaurant-card-actions.js
  restaurace-detail.js
  rating.js
  map-footer-search.js
  footer-search.js
  daily-menu-ui.js
  restaurace-redirect.js
  supabase-edge-function-example.ts
)
for file in "${retired_files[@]}"; do
  if [[ -e "$file" ]]; then
    printf '  NÁVRAT STARÉ VRSTVY  %s\n' "$file" >&2
    exit 1
  fi
  printf '  OK  %s není přítomen\n' "$file"
done

printf '\nAutomatické testy:\n'
npm test

printf '\nVýsledek: projekt prošel lokální strukturální a regresní kontrolou.\n'
printf 'Poznámka: tento skript neověřuje živé produkční RLS ani Supabase secrets.\n'
