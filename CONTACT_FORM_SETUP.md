# Kontaktní formulář – aktuální produkční cesta

Tento dokument nahrazuje starý návod s přímým anonymním `INSERT` do `contact_messages`.

## Aktuální tok

1. `kontakt.html` obsahuje pouze formulář.
2. `contact-form-runtime.js` validuje základní vstup a volá Supabase Edge Function `submit-contact`.
3. `submit-contact` ověřuje povolený origin, honeypot, čas vyplnění, formát vstupu a rate limit.
4. Edge Function zapisuje do `contact_messages` pomocí serverového `service_role`.
5. Browser nemá přímé právo zapisovat do `contact_messages`.
6. Čtení a změny stavu zpráv patří pouze adminovi podle `auth.jwt()->'app_metadata'->>'role'`.

## Důležité soubory

- `kontakt.html`
- `contact-form-runtime.js`
- `supabase/functions/submit-contact/index.ts`
- `create-contact-messages-table.sql`
- `security-hardening.sql`
- `supabase/config.toml`
- `SUPABASE_SETUP.md`

## Nasazení

Používej pouze správný Gurmao Supabase projekt propojený přes repository secrets `SUPABASE_ACCESS_TOKEN` a `SUPABASE_PROJECT_REF`. Projektový ref ani service-role klíč nehardcoduj do dokumentace nebo browserového JavaScriptu.

## Produkční ověření

- anonymní Data API token nesmí vložit řádek přímo do `contact_messages`,
- `submit-contact` musí přijmout požadavek z `https://gurmao.cz` a `https://www.gurmao.cz`,
- nepovolený origin musí dostat 403,
- spamovací/invalidní payload musí být odmítnut,
- admin smí zprávy číst a měnit stav,
- běžný přihlášený uživatel zprávy číst nesmí.

Další obecná pravidla jsou v `SUPABASE_SETUP.md`.
