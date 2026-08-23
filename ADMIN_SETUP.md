# Admin setup – GURMAO.cz

Tento dokument nahrazuje historický návod navázaný na konkrétní e-mail a automatické udělení role prvnímu účtu.

## Aktuální bezpečnostní model

- Admin oprávnění je serverově spravovaná hodnota `auth.users.raw_app_meta_data.role = 'admin'`.
- Frontend kontroluje pouze ověřeného uživatele ze Supabase Auth.
- `admin-guard.js` vyžaduje `user.app_metadata?.role === 'admin'`.
- Edge Functions s administrátorským přístupem kontrolují stejnou roli před vytvořením service-role klienta.
- RLS musí admin zápisy autorizovat přes `auth.jwt()->'app_metadata'->>'role'`.
- E-mail, `localStorage` ani `user_metadata` nesmí samy udělovat admin oprávnění.

## Nastavení nebo odebrání role

Správce Supabase může cílovému uživateli změnit `raw_app_meta_data` v SQL Editoru nebo přes důvěryhodný serverový Admin API proces. Nepoužívej v repozitáři hardcoded osobní e-mail; vždy nejdřív jednoznačně identifikuj konkrétní účet v aktuálním projektu.

Příklad principu podle UUID uživatele:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE id = '<AUTH_USER_UUID>'::uuid;
```

Odebrání:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role'
WHERE id = '<AUTH_USER_UUID>'::uuid;
```

Po změně role uživatel musí získat nový access token, typicky odhlášením a novým přihlášením.

## Co je zakázané

- trigger typu „první registrovaný uživatel se automaticky stane adminem“,
- role v `user_metadata`,
- admin rozhodnutí podle e-mailu ve frontendu,
- admin rozhodnutí podle `localStorage`,
- service-role klíč v browseru.

## Ověření

1. Běžný uživatel nesmí otevřít `admin.html`.
2. Běžný JWT nesmí projít admin Edge Function.
3. Admin s aktuálním tokenem projde `admin-guard.js` i backend kontrolou.
4. Po odebrání role a obnovení tokenu přístup zmizí.
5. Skutečné RLS ověř pomocí `supabase/rls-audit.sql`.

Další aktuální dokumentace: `SUPABASE_SETUP.md` a `PROJEKT_STATUS.md`.
