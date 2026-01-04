# 🔒 Admin Role Setup Guide

## Jak nastavit admin uživatele v Supabase

### Metoda 1: Přes Supabase Dashboard (Doporučeno)

1. **Přihlaš se do Supabase Dashboard**
   - Jdi na https://supabase.com
   - Otevři svůj projekt

2. **Najdi uživatele v Authentication**
   - V levém menu klikni na **Authentication** → **Users**
   - Najdi uživatele, kterého chceš udělat adminem

3. **Přidej admin role do User Metadata**
   - Klikni na uživatele
   - V sekci **User Metadata** klikni na **Edit**
   - Přidej následující JSON:
   ```json
   {
     "role": "admin"
   }
   ```
   - Uložit změny

### Metoda 2: Přes SQL Editor

1. **Otevři SQL Editor**
   - V Supabase Dashboard jdi na **SQL Editor**

2. **Spusť tento SQL příkaz**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'michalsurmanek@seznam.cz';
   ```

### Metoda 3: Při registraci (Pro development)

Upravit sign-up funkci v `supabase-client.js`:

```javascript
export async function signUpAdmin(email, password, displayName = null) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
        role: 'admin'  // ← Přidej tuto řádku
      }
    }
  });
  
  if (error) throw error;
  return data;
}
```

## Jak to funguje

### Ochrana Admin Panelu

Soubor `admin-guard.js` kontroluje:

1. ✅ Je uživatel přihlášený?
2. ✅ Má uživatel `role: "admin"` v metadatech?
3. ✅ Nebo je to email `admin@gurmao.cz`?

Pokud ne → přesměrování na hlavní stránku + chybová hláška

### Bezpečnostní tipy

⚠️ **DŮLEŽITÉ:**
- Admin role je uložena v `user_metadata`, což je upravitelné pouze ze serveru
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
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
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
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'michalsurmanek@seznam.cz';
```

### Zobrazit všechny adminy
```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

## Automatické nastavení prvního admina

Pro první setup můžeš vytvořit Database Function:

```sql
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Pokud je to první uživatel, udělej ho adminem
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || '{"role": "admin"}'::jsonb;
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
