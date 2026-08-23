# GURMAO.cz – Quick Start

Tento projekt už není demo s několika hardcoded restauracemi. Nepoužívej staré návody pro vytvoření nového Supabase projektu nebo ruční přepis credentials.

## Lokální kontrola repozitáře

```bash
npm ci
npm test
./check-project.sh
```

## Hlavní produkční vrstvy

- veřejný frontend: statické HTML + modulární JavaScript,
- databáze/Auth: existující Gurmao Supabase projekt,
- katalog: `restaurace.html` + `restaurace.js`,
- canonical detail: `restaurant.html?slug=<slug>`,
- mapa: `mapa.html` + `mapa.js`,
- feed: `feed.html` + `feed-page.js`,
- uložené restaurace: `GurmaoCollections` v `app.js`,
- doporučení: `ai-recommendations.js`,
- admin autorizace: `app_metadata.role === 'admin'`,
- automatizace: `.github/workflows/`.

## Supabase

Nevytvářej nový projekt podle tohoto dokumentu. Nejdřív ověř, že pracuješ se správným existujícím Gurmao projektem.

Před schema změnami:

```bash
supabase login
supabase link --project-ref <SPRAVNY_GURMAO_PROJECT_REF>
supabase db pull
```

Pak spusť read-only audit `supabase/rls-audit.sql`, porovnej skutečné schéma/RLS a teprve potom vytvářej migraci.

`service_role`, databázové heslo ani jiné secrets nikdy nepatří do browserového JavaScriptu nebo Git repozitáře.

## Nasazení

Změny frontendového repozitáře se publikují z `main` podle nastaveného GitHub Pages/deployment procesu. Edge Functions nasazují dedikované workflows a vyžadují repository secrets pro správný Supabase projekt.

Před nasazením musí projít Quality Check a `npm test`.

## Zdroj pravdy

- `PROJEKT_STATUS.md`
- `SUPABASE_SETUP.md`
- `ADMIN_SETUP.md`
- `scripts/runtime-quality.test.mjs`
- `.github/workflows/quality-check.yml`
