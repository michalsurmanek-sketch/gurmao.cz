# 🍽️ GURMAO.cz - Stav projektu

## ✅ Databáze - Aktuální stav (211 restaurací)

### Distribuce po městech:
- **Praha**: 100 restaurací
- **Zlínský kraj**: 50 restaurací  
- **Brno**: 20 restaurací
- **Olomouc**: 20 restaurací
- **Ostrava**: 16 restaurací
- **Uherské Hradiště**: 5 restaurací

**CELKEM: 211 restaurací**

---

## 🎨 Vibe systém (5 kategorií)

✅ Podporované vibes:
- 🍷 **LUXE** - Elegantní zážitek, důraz na detail, klidná atmosféra
- 🔥 **DRAMA** - Výrazné chutě, silná osobnost, nezapomenutelné kombinace  
- 🌮 **CHAOS** - Uvolněný styl, pestrost, radost z jídla bez pravidel
- 🌿 **PURE** - Čisté suroviny, jednoduchost, chuť v hlavní roli
- 🖤 **DARK** - Intimní atmosféra, večerní vibe, tlumené světlo

❌ Nepodporováno (automaticky převedeno):
- 🌊 **CALM** → převedeno na PURE nebo LUXE

---

## 📁 Struktura databáze

### Tabulka: `restaurants`

Sloupce:
- `id` (UUID, primary key)
- `slug` (text, unique) - URL-friendly identifikátor
- `name` (text) - Název restaurace
- `city` (text) - Město
- `vibe` (text) - Kategorie atmosféry (🍷🔥🌮🌿🖤)
- `tag` (text) - Typ kuchyně / kategorie
- `description` (text) - Popis restaurace
- `latitude` (numeric) - GPS souřadnice - šířka
- `longitude` (numeric) - GPS souřadnice - délka
- `image_url` (text) - URL obrázku (Unsplash placeholders)
- `created_at` (timestamp) - Datum vytvoření záznamu

---

## 🔧 Funkční komponenty

### ✅ Funguje:
1. **Supabase připojení** - Opravené API klíče
2. **Načítání restaurací** - `/restaurace.html`
3. **Mapa** - `/mapa.html` s Mapbox GL + GPS značky
4. **Rating systém** - Připravený
5. **Vibe filtry** - Funkční
6. **Sdílení** - Social share tlačítka

### 📋 HTML stránky:
- ✅ `index.html` - Homepage
- ✅ `restaurace.html` - Seznam všech restaurací
- ✅ `mapa.html` - Interaktivní mapa
- ✅ `feed.html` - Feed view
- ✅ `login.html` - Přihlášení
- ✅ `profile.html` - Profil uživatele
- ✅ `admin.html` - Admin panel
- ✅ `test-db.html` - **Test databázového připojení**

---

## 🚀 Jak projekt používat

### 1. Test databázového připojení
```bash
# Spusť lokální server
python3 -m http.server 8000

# Otevři v prohlížeči
http://localhost:8000/test-db.html
```

### 2. Zobrazení restaurací
```bash
# Seznam restaurací
http://localhost:8000/restaurace.html

# Mapa
http://localhost:8000/mapa.html
```

### 3. Import dalších restaurací
SQL soubory jsou připravené v batches po 10 restauracích:
- Zkopíruj SQL do Supabase → SQL Editor
- Spusť query
- Refresh stránku

---

## 📊 Kvalita dat

### GPS souřadnice:
- ✅ **Všech 211 restaurací** má GPS souřadnice
- Přesnost: Přibližné souřadnice měst/adres

### Obrázky:
- ✅ **Všech 211 restaurací** má `image_url`
- Zdroj: Unsplash placeholders (800x800px)
- Kvalita: HD stock fotografie

### Vibes distribuce:
- 🌿 **PURE**: ~35% (čisté, jednoduché restaurace)
- 🌮 **CHAOS**: ~30% (živé, neformální)
- 🍷 **LUXE**: ~20% (elegantní, fine dining)
- 🔥 **DRAMA**: ~10% (výrazné, masové)
- 🖤 **DARK**: ~5% (intimní, speciální)

---

## 🔐 Autentizace

### Supabase Auth:
- Email/Password login ✅
- User profiles ✅
- Protected routes ✅
- Admin role ✅

---

## 🗺️ Mapbox integrace

### Funkce:
- Interaktivní mapa ČR
- 211 GPS značek
- Popup s info o restauraci
- Navigace + Geolokace
- Vibe filtrování na mapě

### Konfigurace:
```javascript
mapboxgl.accessToken = 'pk.eyJ1...' // Veřejný token
center: [15.5, 49.8] // Střed ČR
zoom: 7.2
```

---

## 📱 Responsive design

- ✅ Mobile-first approach
- ✅ Tailwind CSS
- ✅ Adaptivní grid (1-3 sloupce)
- ✅ Touch-friendly prvky

---

## 🎯 Další kroky

### Doporučené akce:
1. ✅ **Test databáze** - Otevři `test-db.html`
2. ✅ **Zkontroluj mapu** - Otevři `mapa.html`
3. ✅ **Zkontroluj seznam** - Otevři `restaurace.html`
4. 🔄 **Nahraď Unsplash** - Použij reálné fotky restaurací
5. 🔄 **Přesné GPS** - Uprav souřadnice na přesné adresy
6. 🔄 **SEO optimalizace** - Meta tags, sitemap
7. 🔄 **Analytics** - Google Analytics integrace

---

## 💾 Backup a export

### Export dat z Supabase:
```sql
-- Export všech restaurací
COPY (SELECT * FROM restaurants ORDER BY city, name) 
TO '/tmp/gurmao-restaurants.csv' 
WITH CSV HEADER;
```

### CSV formát:
```csv
slug,name,city,vibe,tag,description,latitude,longitude,image_url
field-prague,Field,Praha,🍷 LUXE,fine dining,...,50.0875,14.4213,https://...
```

---

## 📞 Kontakty a podpora

- **Supabase URL**: https://txfuxrezyrgybjvjnhom.supabase.co
- **Projekt**: GURMAO.cz
- **Verze**: 1.0.0
- **Datum**: 5. ledna 2026

---

**Status**: ✅ **PRODUKČNĚ PŘIPRAVENO**

Všechny základní funkce fungují, data jsou v databázi, frontend je připojený.
