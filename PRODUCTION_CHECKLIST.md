# GURMAO.cz – Production Checklist

**Aktualizováno:** 23. srpna 2026

Tento checklist neprohlašuje projekt za production-ready jen podle přítomnosti souborů. Každý bod musí být ověřen proti aktuálnímu repozitáři a tam, kde je to potřeba, proti skutečnému Gurmao Supabase projektu.

## Automatická kontrola repozitáře

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `./check-project.sh`
- [ ] GitHub Actions `Quality check` je zelený na aktuálním `main`
- [ ] `scripts/runtime-quality.test.mjs` nehlásí návrat retired runtime vrstev

## Veřejný web

- [ ] homepage načítá aktuální `app.js` pouze jednou
- [ ] desktop i mobilní vyhledávání používají stejný `header-search.js`
- [ ] homepage neobsahuje retired Supabase project ref
- [ ] počet restaurací není hardcoded jako zastaralé číslo
- [ ] katalog používá serverové stránkování
- [ ] řazení „nejblíž“ nepřetahuje celou databázi
- [ ] všechny aktivní odkazy na detail používají `restaurant.html?slug=...`
- [ ] mapa používá GeoJSON clustering a bezpečný DOM popup
- [ ] Feed používá bezpečný DOM a stránkování
- [ ] AI recommender pracuje s aktuální databází, ne s mock daty nebo náhodným skóre

## Můj výběr

- [ ] host může ukládat a otevřít `collections.html` přes lokální storage
- [ ] přihlášený uživatel používá `saved_restaurants`
- [ ] lokální položky se po přihlášení bezpečně synchronizují
- [ ] chyba cloud syncu není prezentována jako úspěch
- [ ] běžné načtení saved state netahá `restaurants(*)`

## Auth

- [ ] login ověřuje skutečnou Supabase session, ne `localStorage`
- [ ] `?return=` přijímá jen same-origin cíl
- [ ] návrat do admin části je povolen jen ověřenému adminovi
- [ ] Google OAuth se vrací přes bezpečný login callback
- [ ] heslo má konzistentní minimální délku 10 znaků
- [ ] profil zobrazuje skutečný stav ověření e-mailu
- [ ] mazání účtu probíhá přes JWT chráněnou Edge Function

## Admin

- [ ] `admin-guard.js` kontroluje `user.app_metadata.role === 'admin'`
- [ ] admin Edge Functions kontrolují ověřeného uživatele i admin roli
- [ ] žádný frontend rozhoduje admin práva podle e-mailu, `user_metadata` nebo `localStorage`
- [ ] dokumentace neobsahuje hardcoded osobní admin účet

## Kontakt

- [ ] browser nemá přímý `INSERT` do `contact_messages`
- [ ] formulář volá `submit-contact`
- [ ] origin allowlist funguje
- [ ] honeypot/timing/rate limit fungují
- [ ] běžný přihlášený uživatel nemůže číst admin kontaktní zprávy

## Edge Functions

- [ ] `supabase/config.toml` explicitně deklaruje JWT režim funkcí
- [ ] `submit-contact` je veřejný jen s vlastní validací
- [ ] `google-place-photo` obslouží jen photo ID uložená u restaurací Gurmao
- [ ] `delete-account` vyžaduje JWT
- [ ] `discover-menu` a `sync-opening-hours` vyžadují JWT + admin role
- [ ] deployment používá správný `SUPABASE_PROJECT_REF`

## Databáze / RLS – nutno ověřit proti živému projektu

- [ ] proveden `supabase db pull` ze správného Gurmao projektu
- [ ] spuštěn read-only `supabase/rls-audit.sql`
- [ ] `profiles` neodhaluje veřejně citlivá uživatelská data
- [ ] `saved_restaurants` dovoluje uživateli jen vlastní řádky
- [ ] `ratings/reviews` mají vlastníkově omezené zápisy
- [ ] `contact_messages` nemá anon/authenticated INSERT
- [ ] veřejné `restaurants` nemají browser write oprávnění
- [ ] zkontrolovány všechny `SECURITY DEFINER` funkce a jejich `search_path`
- [ ] zkontrolovány views a storage policies
- [ ] vytvořen skutečný reprodukovatelný migration baseline
- [ ] `supabase db reset` projde na čisté lokální databázi

## SEO

- [ ] sitemap obsahuje canonical restaurant URL
- [ ] statické `lastmod` odpovídá skutečné Git změně
- [ ] dynamické `lastmod` používá dostupné `updated_at`
- [ ] robots.txt odkazuje na sitemap
- [ ] canonical detail má title/description/OG/Restaurant JSON-LD
- [ ] dlouhodobě doplněn prerender/static detail, aby metadata nebyla závislá jen na JS

## Accessibility / browser QA

- [ ] desktop keyboard flow
- [ ] mobilní menu focus trap + Escape
- [ ] login/registrace klávesnicí
- [ ] search klávesnicí na desktopu i mobilu
- [ ] mapa má použitelnou alternativu/list pro keyboard-only uživatele
- [ ] axe audit bez kritických chyb
- [ ] test na úzkém mobilu i desktopu

## Analytics / cookies / legal

- [ ] veřejné právní informace obsahují skutečné údaje provozovatele
- [ ] popis zpracování dat odpovídá skutečně používaným službám
- [ ] analytika se nenačítá před potřebným souhlasem
- [ ] nejsou dokumentovány neaktivní trackery jako aktivní

## Stav

Repozitář je výrazně čistší než původní audit, ale **plné production-ready potvrzení je možné až po přímém DB/RLS auditu Gurmao Supabase a browser E2E/accessibility ověření**.
