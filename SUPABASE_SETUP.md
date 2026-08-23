# Supabase setup — GURMAO.cz

Tento soubor popisuje **současný bezpečný způsob práce se Supabase**. Starý návod, který vytvářel demo restaurace (`Noir Table`, `Ember Steak`, `La Calle`) a veřejně čitelný profilový e-mail, byl odstraněn.

## Zásady

- Produkční databázi neměňte ručním copy/paste SQL bez kontroly aktuálního schématu.
- Nové změny schématu vytvářejte přes Supabase CLI jako migrace.
- `service_role` klíč nikdy nepatří do browserového JavaScriptu ani do GitHub repozitáře.
- Veřejný frontend používá pouze publishable/anon přístup a všechny uživatelské tabulky musí mít RLS.
- Administrátorská role se čte z `auth.jwt()->'app_metadata'->>'role'`, ne z editovatelných `user_metadata`.
- Veřejné formuláře, které musí zapisovat bez přihlášení, zapisují přes validovanou Edge Function, ne přes otevřenou RLS `INSERT` policy.

## Lokální CLI workflow

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db pull
supabase migration new <popis_zmeny>
# upravte vytvořený soubor v supabase/migrations/
supabase db reset       # lokální ověření migrací
supabase db push        # až po kontrole proti správnému projektu
```

Před `db push` vždy ověřte, že CLI ukazuje správný projekt. Nepoužívejte projektový ref z jiného webu.

## Minimální bezpečnostní kontrakt tabulek

### `restaurants`
- veřejný `SELECT` je očekávaný,
- veřejný `INSERT/UPDATE/DELETE` není očekávaný,
- slug musí být jednoznačný,
- data renderovaná do HTML musí být escapovaná nebo vložená přes bezpečný DOM.

### `saved_restaurants`
- uživatel smí číst, vložit a smazat pouze řádky, kde `user_id = auth.uid()`,
- `INSERT` musí mít `WITH CHECK (user_id = auth.uid())`,
- kombinace `(user_id, restaurant_id)` má být unikátní.

### `profiles`
- e-mail profilu nesmí být plošně veřejně čitelný,
- uživatel smí aktualizovat pouze vlastní profil,
- UPDATE policy musí obsahovat `USING` i `WITH CHECK`, pokud lze měnit vlastnický sloupec.

### `reviews`
- veřejný `SELECT` může být povolen jen pro pole určená k veřejnému zobrazení,
- uživatel smí vytvořit/upravit/smazat pouze vlastní recenzi,
- textové recenze patří do `reviews`; číselné rychlé hodnocení používá samostatnou `ratings` vrstvu.

### `contact_messages`
- **žádný přímý INSERT pro `anon` ani `authenticated`**,
- veřejný web volá Edge Function `submit-contact`,
- Edge Function validuje vstup a zapisuje serverovým `service_role`,
- čtení a změna stavu jsou jen pro admina podle `app_metadata.role`.

Aktuální referenční SQL pro tuto tabulku je v `create-contact-messages-table.sql` a dodatečné zpřísnění v `security-hardening.sql`. Před aplikací vždy porovnejte s produkčním schématem.

## Edge Functions

Konfigurace veřejných funkcí je v `supabase/config.toml`. `submit-contact` je veřejný endpoint (`verify_jwt = false`), ale s vlastní validací, origin allowlistem, honeypotem a rate limitingem.

Nasazované funkce:

- `submit-contact` — kontaktní formulář,
- `google-place-photo` — bezpečný/cachovaný proxy přístup k fotografii,
- `sync-opening-hours` — synchronizace otevírací doby,
- další administrátorské funkce se nasazují pouze pokud jejich workflow výslovně uvádí.

GitHub Actions pro datové funkce očekává repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Citlivé API klíče třetích stran nastavujte jako Supabase Edge Function secrets, nikoliv do repozitáře.

## Ověření před produkcí

1. `npm ci && npm test`
2. Spusťte JavaScript syntax checks z `.github/workflows/quality-check.yml`.
3. Ověřte RLS anonymním i přihlášeným účtem.
4. Zkuste, že cizí `user_id` nelze vložit ani změnit.
5. Zkuste, že `contact_messages` nelze vložit přímo přes veřejný Data API token.
6. Ověřte, že `submit-contact` přijímá pouze povolený origin a odmítá spamovací/invalidní payload.
7. Až potom aplikujte migraci nebo nasaďte Edge Functions na produkční projekt.

## Co sem nepatří

- hesla databáze,
- `service_role` klíče,
- Google/API secrets,
- testovací osobní účty nebo hardcoded admin e-maily,
- mock restaurace vydávané za produkční obsah.
