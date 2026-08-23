#!/usr/bin/env bash
set -euo pipefail

printf 'GURMAO.cz – pre-deploy verification\n'
printf '==================================\n\n'

required=(
  index.html
  feed.html
  restaurace.html
  restaurant.html
  mapa.html
  ai.html
  collections.html
  login.html
  profile.html
  kontakt.html
  legal.html
  admin.html
  app.js
  supabase-client.js
  auth-ui.js
  auth-guard.js
  admin-guard.js
  login-page.js
  header-search.js
  homepage-runtime.js
  admin-dashboard-runtime.js
  feed-page.js
  restaurace.js
  restaurant-detail-page.js
  collections-page.js
  mapa.js
  ai-recommendations.js
  service-worker.js
  robots.txt
  sitemap.xml
  CNAME
)

for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'CHYBÍ: %s\n' "$file" >&2
    exit 1
  fi
done

retired=(
  rating.js
  onboarding.js
  ga.js
  runtime-guard.js
  hide-price-level.js
  restaurant-card-status.js
  restaurant-card-actions.js
  restaurace-detail.js
  map-footer-search.js
  footer-search.js
  daily-menu-ui.js
  restaurace-redirect.js
  supabase-edge-function-example.ts
)

for file in "${retired[@]}"; do
  if [[ -e "$file" ]]; then
    printf 'Retired soubor se vrátil: %s\n' "$file" >&2
    exit 1
  fi
done

if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Repozitář obsahuje necommitnuté změny. Před deployem je zkontroluj a commitni.\n' >&2
  git status --short
  exit 1
fi

printf 'Spouštím automatické kontroly…\n'
npm ci
npm test
./check-project.sh

printf '\nPre-deploy kontrola prošla.\n'
printf 'Tento skript záměrně NEprovádí git add/commit/push a nemění Supabase.\n'
printf 'Před produkčním DB zásahem navíc proveď read-only supabase/rls-audit.sql na správném Gurmao projektu.\n'
