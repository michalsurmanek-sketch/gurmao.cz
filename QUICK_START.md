# 🚀 QUICK START - GURMAO.cz

**5 minut do live webu!**

---

## ✅ Okamžitý deploy (bez Supabase)

Web funguje i bez Supabase pomocí localStorage. Pro okamžité nasazení:

```bash
# 1. Commit a push
git add .
git commit -m "Initial production deploy"
git push origin main

# 2. Počkej 2 minuty na GitHub Pages build

# 3. Otevři
https://michalsurmanek-sketch.github.io/gurmao.cz
```

**Co bude fungovat:**
- ✅ Všechny stránky a navigace
- ✅ Mobile menu
- ✅ Save funkcionalita (localStorage)
- ✅ Collections (localStorage)
- ✅ Rating (localStorage)
- ✅ AI doporučení
- ✅ Mock data (3 restaurace, 3 kuchaři)

**Co nebude fungovat:**
- ❌ Registrace/přihlášení
- ❌ Synchronizace mezi zařízeními
- ❌ Admin panel (potřebuje Supabase)

---

## 🔧 Plný setup s Supabase (40 minut)

Pro plnou funkčnost včetně přihlašování:

### 1️⃣ Vytvoř Supabase projekt (10 min)

```bash
# Jdi na: https://supabase.com
# → Sign up / Login
# → New Project
#    Name: gurmao-cz
#    Region: Europe (Frankfurt)
#    Database Password: [silné heslo - ulož si ho!]
# → Create project (počkej ~2 min)
```

### 2️⃣ Zkopíruj credentials (2 min)

```bash
# V Supabase Dashboard:
# Settings → API

# Zkopíruj:
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
```

### 3️⃣ Nastav v projektu (1 min)

Otevři `supabase-client.js` a nahraď:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';
```

### 4️⃣ Vytvoř databázi (5 min)

V Supabase → SQL Editor → New query:

Zkopíruj a spusť celý SQL z `SUPABASE_SETUP.md` (řádky 24-160)

### 5️⃣ Nastav Storage (5 min)

V Supabase → Storage → Create bucket:

```
1. Bucket name: restaurant-images
   Public: ✅ Yes
   
2. Bucket name: chef-images
   Public: ✅ Yes
   
3. Bucket name: gear-images
   Public: ✅ Yes
   
4. Bucket name: avatars
   Public: ✅ Yes
```

Spusť SQL policies z `storage-policies.sql`

### 6️⃣ Nastav admin roli (2 min)

Registruj se na webu s emailem: `michalsurmanek@seznam.cz`

V Supabase → SQL Editor:

```sql
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'michalsurmanek@seznam.cz';
```

### 7️⃣ Deploy! (5 min)

```bash
git add .
git commit -m "Production ready with Supabase"
git push origin main
```

---

## 🎯 HOTOVO!

### Zkontroluj:
- [ ] Web se načítá: https://gurmao.cz
- [ ] Můžeš se registrovat
- [ ] Můžeš se přihlásit
- [ ] Save funguje a synchronizuje
- [ ] Admin panel přístupný (jako admin)
- [ ] Mobile menu funguje

---

## 📞 Rychlá pomoc

### Supabase nefunguje?
```bash
# Zkontroluj konzoli prohlížeče (F12)
# Chyba: "Invalid API key" 
#   → Špatně zkopírovaný anon key

# Chyba: "relation does not exist"
#   → Nespustil jsi SQL schema
```

### Admin panel nepřístupný?
```bash
# 1. Jsi přihlášen jako michalsurmanek@seznam.cz?
# 2. Spustil jsi SQL pro admin role?
# 3. Odhlásil ses a přihlásil znovu?
```

### Save nefunguje?
```bash
# Bez Supabase: Funguje přes localStorage (jen lokálně)
# Se Supabase: Zkontroluj konzoli, měl by být log
```

---

## 🌐 Vlastní doména

Pokud chceš `gurmao.cz` místo GitHub URL:

### U DNS providera (Cloudflare, GoDaddy...):

```
Type: CNAME
Name: www
Value: michalsurmanek-sketch.github.io
TTL: Auto
```

Nebo A records:
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

Počkej 5-60 minut na DNS propagaci.

V GitHub → Settings → Pages → Custom domain: `gurmao.cz`

---

## 📊 Google Analytics (volitelné)

```bash
# 1. Jdi na: https://analytics.google.com
# 2. Create property: gurmao.cz
# 3. Zkopíruj Measurement ID: G-XXXXXXXXXX
# 4. V ga.js nahraď:
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

# 5. Přidej do <head> všech HTML:
<script src="ga.js"></script>
```

---

**Vše hotovo! Teď můžeš přidávat restaurace přes admin panel!** 🎉

---

**Vytvořeno:** 5. ledna 2026  
**Pro podporu:** Viz `PRODUCTION_CHECKLIST.md`
