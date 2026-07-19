# Nastavení Admin Role v Supabase

## Aktuální stav
- ✅ Frontend připraven: Admin panel link se zobrazí pouze uživatelům s admin rolí
- ✅ Backend ochrana: admin-guard.js blokuje přístup neautorizovaným uživatelům
- ⏳ **POTŘEBA**: Nastavit admin roli v Supabase databázi

## Jak nastavit admin roli

### 1. Přihlásit se do Supabase Dashboard
```
https://app.supabase.com
```

### 2. Otevřít SQL Editor
- V levém menu klikni na **SQL Editor**
- Klikni na **New Query**

### 3. Spustit SQL příkaz

Pro `michalsurmanek@seznam.cz`:
```sql
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'michalsurmanek@seznam.cz';
```

### 4. Odhlásit se a znovu přihlásit
Po spuštění SQL příkazu:
1. Odhlásit se z GURMAO.cz
2. Přihlásit se znovu
3. Kliknout na jméno v pravém horním rohu
4. Měl by se zobrazit odkaz: **🔒 Admin Panel**

## Přidání dalších adminů

Pro přidání dalšího admin uživatele:
```sql
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'novy-admin@example.com';
```

## Odebrání admin role

```sql
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE email = 'uzivatel@example.com';
```

## Kontrola admin role

Pro ověření, že je role správně nastavená:
```sql
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'michalsurmanek@seznam.cz';
```

Očekávaný výsledek:
```
email                      | role
---------------------------+-------
michalsurmanek@seznam.cz  | admin
```

## Technické detaily

### Jak to funguje:
1. **auth-ui.js** kontroluje ověřeného uživatele a `app_metadata.role === 'admin'`
2. Pokud je admin, odstraní `hidden` třídu z `[data-admin-only]` odkazů
3. **admin-guard.js** brání přímému přístupu na admin.html bez admin role
4. `localStorage` ani e-mail ve frontendu neposkytují admin oprávnění

### Soubory v projektu:
- `auth-ui.js` - kontrola admin role a zobrazení linků
- `admin-guard.js` - ochrana admin.html před neautorizovaným přístupem
- `index.html`, `feed.html`, `mapa.html` - obsahují admin panel odkazy

---

**Po nastavení admin role v Supabase bude vše fungovat automaticky!** ✅
