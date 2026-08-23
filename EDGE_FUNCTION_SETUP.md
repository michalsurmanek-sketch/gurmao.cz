# Supabase Edge Functions – aktuální stav GURMAO

Starý návod pro `send-contact-email` a retired Supabase projekt už neplatí.

## Nasazované funkce

- `submit-contact` – veřejný kontaktní endpoint s vlastní validací a rate limitingem,
- `google-place-photo` – veřejný proxy endpoint pouze pro Google photo ID uložená u restaurací GURMAO,
- `delete-account` – přihlášený uživatel může smazat vlastní účet,
- `discover-menu` – pouze admin,
- `sync-opening-hours` – pouze admin.

JWT režim je explicitně uvedený v `supabase/config.toml`.

## Autorizace

- `submit-contact`: `verify_jwt = false`, protože formulář je veřejný; ochranu provádí samotná funkce.
- `google-place-photo`: `verify_jwt = false`, protože URL se používá přímo v obrázcích; endpoint nejdřív ověří, že `google_photo_name` existuje u restaurace v databázi.
- `delete-account`: `verify_jwt = true` a funkce pracuje pouze s identitou z ověřeného JWT.
- `discover-menu` a `sync-opening-hours`: `verify_jwt = true` a uvnitř navíc vyžadují `user.app_metadata.role === 'admin'`.

## GitHub Actions / secrets

Repository musí mít pro deploy nastavené:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Citlivé runtime secrets patří do Supabase Edge Function secrets, například:

- `GOOGLE_PLACES_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` je poskytován Supabase runtimem; nikdy ho nedávej do browseru nebo dokumentace.

## Bezpečný postup

```bash
supabase login
supabase link --project-ref <SPRAVNY_GURMAO_PROJECT_REF>
supabase functions list
supabase functions deploy <function-name>
```

Před ručním deployem vždy ověř, že CLI ukazuje správný Gurmao projekt. Preferovaná cesta je existující GitHub Actions workflow v `.github/workflows/`.

## Ověření

Po změně Edge Function musí projít:

```bash
npm test
```

Regresní testy hlídají mimo jiné JWT konfiguraci, admin kontrolu a omezení veřejného Google photo proxy.

Další pravidla jsou v `SUPABASE_SETUP.md`.
