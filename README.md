# GURMAO.cz

**Nejez. Prožij.**

GURMAO je česká platforma pro hledání restaurací podle chuti, kuchyně, města, nálady a atmosféry. Projekt používá reálnou datovou vrstvu v Supabase/PostgreSQL; nejde už o původní mock/MVP katalog.

## Hlavní veřejné části

- `index.html` – homepage a vstup do hledání,
- `restaurace.html` + `restaurace.js` – katalog a filtry,
- `restaurant.html?slug=<slug>` + `restaurant-detail-page.js` – jediný canonical detail restaurace,
- `mapa.html` + `mapa.js` – mapa s GeoJSON clusteringem,
- `feed.html` + `feed-page.js` – stránkovaný feed,
- `ai.html` + `ai-recommendations.js` – deterministická doporučení nad aktuálními daty,
- `collections.html` + `collections-page.js` – Můj výběr pro hosta i přihlášeného uživatele,
- `profile.html` + `profile-page.js` – profil a správa účtu,
- `kontakt.html` + `contact-form-runtime.js` – chráněný kontaktní formulář.

## Technologie

- statický frontend HTML/CSS/vanilla JavaScript,
- Tailwind CSS build,
- Supabase Auth + Postgres + Edge Functions,
- GitHub Actions pro kontrolu, sitemapu, importy a datové automatizace,
- MapLibre/Mapbox-compatible mapová vrstva nad OpenFreeMap stylem,
- Google Places enrichment na serverové/automatizační vrstvě.

## Architektonická pravidla

### Restaurace

Veřejné odkazy používají pouze:

```text
restaurant.html?slug=<slug>
```

Staré `restaurace-<slug>.html` a `restaurace-detail.html?id=...` jsou retired/legacy cesty a aktivní runtime je nesmí generovat.

### Uložené restaurace

`window.GurmaoCollections` v `app.js` je jediná sdílená logika:

- host → `localStorage`,
- přihlášený uživatel → `saved_restaurants`,
- po přihlášení se lokální slugy pokusí synchronizovat do cloudu,
- interní DB vazba používá UUID restaurace, veřejné URL/save atributy používají slug.

### Auth a admin

- zdroj pravdy je `supabase.auth.getUser()`, ne `localStorage`,
- admin role je pouze `user.app_metadata.role === 'admin'`,
- e-mail ani `user_metadata` neudělují admin oprávnění,
- login return URL musí zůstat same-origin,
- admin Edge Functions ověřují JWT i admin roli před použitím service-role klienta.

### Kontakt

Browser nikdy nezapisuje přímo do `contact_messages`.

```text
kontakt.html
  → contact-form-runtime.js
  → Edge Function submit-contact
  → validace/rate limit
  → service-role INSERT
```

### Service worker

`service-worker.js` nepřepisuje HTML a neinjektuje opravné runtime skripty. Slouží jen pro síťovou navigaci a offline fallback.

## Vibe systém

- 🍷 LUXE
- 🔥 DRAMA
- 🌮 CHAOS
- 🌿 PURE
- 🖤 DARK
- 🌊 CALM

Vibe je doplňkový signál pro hledání a doporučení; primární produktový vstup zůstává chuť/kuchyně/lokalita.

## Lokální kontrola

Po checkoutu:

```bash
npm ci
npm test
./check-project.sh
```

`npm test` zahrnuje importní testy, chef testy a `scripts/runtime-quality.test.mjs`.

GitHub Actions `quality-check.yml` navíc kontroluje syntaxi klíčových runtime modulů.

## Pre-deploy kontrola

```bash
./deploy.sh
```

Skript je pouze verifier. Záměrně neprovádí `git add`, commit, push ani změny Supabase.

## Supabase

Nepřipojuj náhodně nový projekt a nepřepisuj browser konfiguraci podle historických návodů.

Před schema změnami:

```bash
supabase login
supabase link --project-ref <SPRAVNY_GURMAO_PROJECT_REF>
supabase db pull
```

Pak spusť read-only audit:

```text
supabase/rls-audit.sql
```

Teprve podle skutečného produkčního schématu vytvoř chybějící migration baseline. Současný adresář `supabase/migrations/` zatím nepředstavuje kompletní reprodukovatelný obraz celé produkční DB.

## Bezpečnost

- `service_role` nikdy do browseru ani Git repozitáře,
- veřejné klientské klíče nesmí být zaměňovány za serverové secrets,
- uživatelské tabulky mají mít RLS,
- `saved_restaurants` pouze vlastní řádky,
- `profiles` pouze vlastní profil,
- `contact_messages` bez anon/authenticated INSERT,
- admin zápisy chránit backendem/RLS, ne jen UI,
- dynamická DB data renderovat přes bezpečný DOM nebo escapovat.

## SEO

- `robots.txt` odkazuje na `sitemap.xml`,
- sitemapu generuje `scripts/generate-sitemap.mjs`,
- workflow ji pravidelně aktualizuje,
- restaurant sitemap URL používají canonical route,
- statické `lastmod` se odvozuje z poslední Git změny příslušného souboru.

Dlouhodobý otevřený úkol: prerender/static detail restaurace, aby title, description, OG a Restaurant JSON-LD nebyly závislé pouze na klientském JavaScriptu.

## Stav projektu a další zdroje pravdy

- `PROJEKT_STATUS.md`
- `PRODUCTION_CHECKLIST.md`
- `SUPABASE_SETUP.md`
- `ADMIN_SETUP.md`
- `EDGE_FUNCTION_SETUP.md`
- `scripts/runtime-quality.test.mjs`

## Známé otevřené technické body

- dokončit skutečný DB/RLS diff po zpřístupnění Gurmao Supabase,
- vytvořit reprodukovatelný migration baseline,
- doplnit browser E2E testy,
- doplnit automatizovaný accessibility audit,
- prerenderovat SEO detailové stránky,
- případně nahradit bounding-box nearest search PostGIS/RPC dotazem.

© 2026 GURMAO.cz
