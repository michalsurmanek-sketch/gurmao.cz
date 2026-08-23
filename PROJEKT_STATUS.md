# GURMAO.cz – aktuální technický stav

**Aktualizováno:** 23. srpna 2026

Tento soubor je stručný zdroj pravdy pro současnou architekturu repozitáře. Nejde o potvrzení stavu živé produkční databáze; Gurmao Supabase projekt není v aktuálním připojeném nástroji dostupný pro přímou inspekci.

## Produkční směr

GURMAO je vyhledávač a doporučovací vrstva restaurací podle chuti, lokality, hodnocení a atmosféry. Veřejný web používá Supabase/Postgres jako datovou vrstvu a statický frontend s modulárním JavaScriptem.

## Aktuální Supabase klient

Browser používá jedinou konfiguraci v `supabase-client.js`. Starý projektový ref byl z aktivního JavaScriptu odstraněn. Publishable klíč může být v browseru; `service_role` klíč do browseru ani repozitáře nepatří.

## Restaurace

- katalog: `restaurace.html` + `restaurace.js`,
- canonical detail: `restaurant.html?slug=<slug>`,
- mapa: `mapa.html` + `mapa.js`,
- feed: `feed.html` + `feed-page.js`,
- globální vyhledávání: `header-search.js`.

Běžný katalog je stránkovaný na serveru. Mapa používá GeoJSON clustering. Aktivní veřejné komponenty nesmí generovat staré `restaurace-<slug>.html` ani `restaurace-detail.html?id=...` odkazy.

## Uložené restaurace

`app.js` poskytuje `GurmaoCollections`:

- host: lokální `localStorage`,
- přihlášený uživatel: Supabase `saved_restaurants`,
- lokální položky se po přihlášení pokusí synchronizovat do cloudu,
- při selhání cloudového zápisu se nesmí zobrazit falešný úspěch.

`collections.html` je dostupná i bez přihlášení a zobrazuje lokálně uložené restaurace. `profile.html` zůstává chráněná autentizací.

## AI / doporučení

`ai-recommendations.js` nepoužívá demo restaurace ani náhodné skóre. Kandidáti jsou předfiltrováni v Supabase a lokálně doskórováni podle zadaných kritérií a dostupných dat. Jde o deterministický recommender, ne o placené pořadí.

## Hodnocení

Aktuální veřejný detail zobrazuje Google rating a počet Google hodnocení. Starý browserový `rating.js` byl odstraněn, protože už nebyl aktivní součástí produktu. Referenční SQL pro případnou budoucí vlastní rating vrstvu používá sloupec `stars` a UUID restaurace.

## Kontakt

Veřejný kontakt nikdy nezapisuje přímo do `contact_messages`:

`kontakt.html` → `contact-form-runtime.js` → Edge Function `submit-contact` → serverový zápis.

Přímý browserový `INSERT` do `contact_messages` nemá být povolen RLS/granty.

## Edge Functions

JWT politika je explicitní v `supabase/config.toml`:

- `submit-contact`: veřejná, vlastní ochrana,
- `google-place-photo`: veřejná, ale obslouží jen photo ID uložená v databázi Gurmao,
- `delete-account`: JWT,
- `discover-menu`: JWT + admin role,
- `sync-opening-hours`: JWT + admin role.

Admin role se bere z `user.app_metadata.role === 'admin'`, nikoliv z e-mailu nebo uživatelsky editovatelných metadata.

## Service worker

`service-worker.js` už nepřepisuje HTML a neinjektuje opravné skripty. Poskytuje pouze síťové navigace a offline fallback.

## SEO

- canonical restaurant URL: `restaurant.html?slug=...`,
- sitemapu generuje `scripts/generate-sitemap.mjs`,
- automatizace `.github/workflows/build-sitemap.yml` ji pravidelně regeneruje,
- statické `lastmod` vychází z posledního Git commitu příslušného souboru,
- dynamické restaurace používají dostupné `updated_at`.

Dlouhodobý SEO cíl zůstává build-time/prerendered detail pro každou restauraci, aby metadata a Restaurant JSON-LD nebyly závislé pouze na klientském JavaScriptu.

## CI a regresní ochrana

`npm test` spouští import testy, chef testy a `scripts/runtime-quality.test.mjs`. GitHub Actions `quality-check.yml` navíc kontroluje syntaxi klíčových runtime souborů.

Regresní testy hlídají například:

- zákaz starých restaurant rout,
- jedinou chráněnou contact cestu,
- explicitní JWT režim Edge Functions,
- admin kontrolu funkcí se service-role přístupem,
- zákaz návratu runtime patch souborů,
- zákaz monkey-patche `Element.prototype.innerHTML`,
- guest režim Můj výběr,
- zákaz retired Supabase projektu v aktivním runtime.

## Databázové migrace – otevřený dluh

`supabase/migrations/` stále neobsahuje úplný baseline produkčního schématu. Bez přímého přístupu k živému Gurmao Supabase projektu se úplný baseline nesmí domýšlet.

Bezpečný postup je:

1. připojit správný Gurmao projekt,
2. provést `supabase db pull`,
3. porovnat skutečné RLS, tabulky, views, funkce a triggery,
4. vytvořit reprodukovatelný baseline,
5. ověřit `supabase db reset` lokálně,
6. až potom aplikovat nové schema migrace.

## Známé zbývající priority

1. odstranit poslední retired Supabase preconnect z `index.html`,
2. dokončit audit všech starých dokumentů a utility skriptů,
3. po zpřístupnění Gurmao Supabase udělat skutečný DB/RLS diff,
4. serverově vyřešit geografické řazení „nejblíž“ v katalogu,
5. připravit prerender/static SEO detailové stránky,
6. přidat browser E2E + accessibility testy.

## Lokální kontrola

```bash
npm ci
npm test
./check-project.sh
```

`check-project.sh` ověřuje strukturu a regresní testy, ale nenahrazuje kontrolu živého Supabase projektu.
