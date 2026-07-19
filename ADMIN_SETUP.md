# 🔒 Admin Role Setup Guide

## Jak nastavit admin uživatele v Supabase

### Přes SQL Editor (doporučeno)

1. **Otevři SQL Editor**
   - V Supabase Dashboard jdi na **SQL Editor**

2. **Spusť tento SQL příkaz**
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
   WHERE email = 'michalsurmanek@seznam.cz';
   ```

Admin roli nikdy nenastavuj při registraci ani přes klientská `user_metadata`.

## Jak to funguje

### Ochrana Admin Panelu

Soubor `admin-guard.js` kontroluje:

1. ✅ Je uživatel přihlášený?
2. ✅ Má uživatel `role: "admin"` v serverových `app_metadata`?

Pokud ne → přesměrování na hlavní stránku + chybová hláška

### Bezpečnostní tipy

⚠️ **DŮLEŽITÉ:**
- Admin role je uložena v serverově spravovaných `app_metadata`
- Nikdy nepoužívej pouze localStorage pro ověření admin práv
- Vždy kontroluj oprávnění i na backend straně (Supabase RLS policies)

### Nastavení Row Level Security (RLS) v Supabase

Pro maximální bezpečnost nastav RLS policies:

```sql
-- Povolit čtení restaurací všem
CREATE POLICY "Anyone can read restaurants"
ON restaurants FOR SELECT
TO public
USING (true);

-- Povolit zápis pouze adminům
CREATE POLICY "Only admins can insert/update/delete restaurants"
ON restaurants FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
```

## Testování

1. Přihlaš se jako admin uživatel
2. Otevři https://gurmao.cz/admin.html
3. Měl bys vidět admin panel
4. Zkus se přihlásit jako běžný uživatel → měl bys být přesměrován

## Správa admin uživatelů

### Odebrat admin práva
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE email = 'michalsurmanek@seznam.cz';
```

### Zobrazit všechny adminy
```sql
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'admin';
```

## Automatické nastavení prvního admina

Pro první setup můžeš vytvořit Database Function:

```sql
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Pokud je to první uživatel, udělej ho adminem
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_first_user_as_admin
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();
```

---

**📝 Poznámka:** Po každé změně user metadata je třeba uživatele odhlásit a znovu přihlásit, aby se změny projevily.
