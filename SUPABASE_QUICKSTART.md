# 🚀 Supabase Quick Start - GURMAO.cz

## ⚡ 5 Minute Setup

### Krok 1: Vytvoř Supabase projekt (2 min)

```bash
1. Jdi na: https://supabase.com
2. Sign up / Login (doporučeno GitHub)
3. New Project:
   Name: gurmao-cz
   Database password: [vytvoř silné heslo]
   Region: Europe (Frankfurt nebo Amsterdam)
   → Create project
4. Počkej ~2 minuty na setup
```

### Krok 2: Zkopíruj credentials (1 min)

```bash
V Supabase Dashboard:
→ Settings → API

Zkopíruj:
✅ Project URL: https://xxxxx.supabase.co
✅ anon/public key: eyJhbGc...
```

### Krok 3: Nakonfiguruj projekt (1 min)

**Automaticky:**
```bash
./configure-supabase.sh
# Zadej URL a key když se zeptá
```

**Manuálně:**
Edituj `supabase-client.js`:
```javascript
const SUPABASE_URL = 'https://tvuj-projekt.supabase.co';
const SUPABASE_ANON_KEY = 'tvuj-anon-key';
```

### Krok 4: Setup databáze (1 min)

```bash
1. V Supabase Dashboard → SQL Editor
2. New query
3. Copy-paste celý obsah z SUPABASE_SETUP.md (SQL sekce)
4. Run
5. ✅ Hotovo!
```

---

## 🧪 Test

```bash
# Spusť lokální server
python3 -m http.server 3000

# Otevři v prohlížeči
http://localhost:3000/login.html

# Zaregistruj se
→ Email: test@gurmao.cz
→ Heslo: TestHeslo123
→ Submit

# Zkontroluj v Supabase Dashboard
→ Authentication → Users
→ Měl by tam být tvůj user!
```

---

## 📊 Co teď funguje:

✅ **Registrace** - email/password signup  
✅ **Přihlášení** - login s ověřením  
✅ **Google OAuth** - ready (potřeba nastavit v Supabase)  
✅ **Session management** - auto refresh tokens  
✅ **Databáze** - PostgreSQL s RLS  
✅ **Real-time** - live synchronizace dat  

---

## 🔧 Google OAuth (volitelné)

### V Supabase:
```
Authentication → Providers → Google
→ Enable
→ Copy Redirect URL
```

### V Google Cloud Console:
```
1. https://console.cloud.google.com/
2. New Project: "GURMAO"
3. APIs & Services → Credentials
4. OAuth Client ID:
   - Type: Web application
   - Authorized redirect URIs: 
     [vlož URL ze Supabase]
5. Copy Client ID & Secret
6. Paste do Supabase
7. Save
```

---

## 📝 Co dál?

### Ihned dostupné:
- ✅ Registrace/Login funguje
- ✅ Collections budou ukládat do Supabase
- ✅ Synchronizace mezi zařízeními
- ✅ Reset hesla (email automaticky)

### Potřeba dokončit:
- [ ] Migrace existujících localStorage dat
- [ ] User menu v headeru
- [ ] Protected routes (redirect na login)
- [ ] Profile stránka
- [ ] Review systém

---

## 💾 Migrace localStorage → Supabase

Pro uživatele, kteří už mají data v localStorage:

```javascript
import { migrateLocalStorageToSupabase } from './supabase-client.js';

// Po přihlášení
const user = await getCurrentUser();
await migrateLocalStorageToSupabase(user.id);
```

Tohle automaticky přenese všechny uložené restaurace do cloudu.

---

## 🔒 Security (už implementováno)

✅ Row Level Security policies  
✅ Auth token auto-refresh  
✅ Secure session storage  
✅ SQL injection prevence  
✅ XSS protection  

---

## 💰 Costs

```
Free tier (Supabase):
✅ 500 MB database
✅ 1 GB file storage
✅ 2 GB bandwidth
✅ Unlimited API requests
✅ 50k monthly active users

→ Pro GURMAO startup: ZDARMA!
```

Paid tier (pokud překročíš):
- Pro: $25/měsíc
- Unlimited všechno

---

## 🆘 Troubleshooting

### "Invalid API key"
→ Zkontroluj že jsi správně zkopíroval anon key  
→ Ujisti se že je to **anon** key, ne service_role key

### "Row Level Security policy violation"
→ Ujisti se že jsi spustil všechny SQL příkazy  
→ Zkontroluj v Table Editor → policies

### "Email not confirmed"
→ V dev režimu: Settings → Auth → Disable email confirmation  
→ Nebo zkontroluj email inbox

### Google OAuth nefunguje
→ Zkontroluj redirect URL v Google Console  
→ Ujisti se že je Google provider enabled v Supabase

---

## 📚 Další dokumentace

- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Kompletní setup
- [`supabase-client.js`](supabase-client.js) - API reference
- [`AUTHENTICATION.md`](AUTHENTICATION.md) - Auth architektura
- [Supabase Docs](https://supabase.com/docs) - Oficiální docs

---

## ✅ Checklist

- [ ] Vytvořen Supabase projekt
- [ ] Credentials zkopírovány do `supabase-client.js`
- [ ] SQL schema spuštěno
- [ ] Test registrace funguje
- [ ] Test přihlášení funguje
- [ ] Data viditelná v Supabase Dashboard
- [ ] (Volitelné) Google OAuth nakonfigurován

---

**Status:** 🟢 Supabase ready to use!  
**Další krok:** Začni používat Supabase authentication! 🎉

## 🎯 Pro start:

```bash
# 1. Nakonfiguruj
./configure-supabase.sh

# 2. Otevři login
open http://localhost:3000/login.html

# 3. Zaregistruj se a testuj!
```

**Nejez. Prožij.** 🍷
