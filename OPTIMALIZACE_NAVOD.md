# 🚀 GURMAO.cz - Quick Start Guide pro optimalizaci

## 📋 Přehled optimalizací

Tento projekt byl analyzován a připraveno je několik optimalizačních skriptů pro okamžité zlepšení výkonu.

---

## ⚡ RYCHLÝ START (5 minut)

### 1. Spusťte optimalizační skript
```bash
chmod +x optimize.sh
./optimize.sh
```

Tento skript automaticky:
- ✅ Nainstaluje Tailwind CSS CLI
- ✅ Nastaví build proces
- ✅ Vygeneruje optimalizované CSS
- ✅ Připraví projekt structure

### 2. Přidejte lazy loading obrázků
```html
<!-- Do každého HTML souboru před </body>: -->
<script src="lazy-loading.js"></script>
```

### 3. Nahraďte Tailwind CDN
```html
<!-- PŘED (SMAZAT): -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- PO (PŘIDAT): -->
<link rel="stylesheet" href="/dist/css/output.css">
```

### 4. Spusťte Supabase optimalizace
```bash
# Zkopírujte obsah db-optimization.sql do Supabase SQL Editor a spusťte
```

---

## 📊 OČEKÁVANÉ VÝSLEDKY

Po implementaci Fáze 1:
- ⚡ **2-3 sekundy** rychlejší načítání
- 📉 **40-60%** menší initial load
- 🚀 **~65 → ~85** Lighthouse score

---

## 🔧 DEVELOPMENT WORKFLOW

### Development (s hot reload):
```bash
npm run dev
```

### Production build:
```bash
npm run build
```

### Deploy na GitHub Pages:
```bash
git add .
git commit -m "feat: performance optimizations"
git push origin main
```

---

## 📱 PWA SETUP (Volitelné)

### 1. Přidat manifest do HTML:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#d4af37">
```

### 2. Registrovat service worker:
```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('SW registered', reg))
    .catch(err => console.log('SW failed', err));
}
</script>
```

### 3. Vygenerovat app icons:
```bash
# Použijte online nástroj: https://realfavicongenerator.net/
# Nebo PWA Builder: https://www.pwabuilder.com/
```

---

## 🗄️ DATABÁZOVÉ OPTIMALIZACE

### Spuštění v Supabase:
1. Přihlaste se do Supabase Dashboard
2. Otevřete SQL Editor
3. Zkopírujte obsah `db-optimization.sql`
4. Spusťte query

### Co to udělá:
- ✅ Vytvoří indexy pro rychlejší filtrování
- ✅ Nastaví full-text search
- ✅ Přidá geografické vyhledávání
- ✅ Vytvoří materialized views pro statistiky

---

## 🎯 CHECKLIST - CO IMPLEMENTOVAT

### ✅ FÁZE 1 (Kritické - 3-5 dnů):
- [ ] Spustit `optimize.sh`
- [ ] Nahradit Tailwind CDN za lokální CSS ve všech HTML
- [ ] Přidat `lazy-loading.js` do všech stránek
- [ ] Spustit `db-optimization.sql` v Supabase
- [ ] Odstranit všechny `console.log()` z produkce
- [ ] Přidat preconnect tagy do `<head>`

### 🟡 FÁZE 2 (Vysoká priorita - 1 týden):
- [ ] Implementovat service worker
- [ ] Přidat PWA manifest
- [ ] Self-host Google Fonts
- [ ] Minifikovat JavaScript soubory
- [ ] Implementovat image optimization

### 🟢 FÁZE 3 (Střední priorita - 2 týdny):
- [ ] Refactor na komponenty (header/footer)
- [ ] Přidat error handling
- [ ] Implementovat skeleton screens
- [ ] Accessibility audit (ARIA labels)

---

## 📈 MONITORING

### Změřit výkon před a po:
```bash
# Použijte Lighthouse v Chrome DevTools
# Nebo online: https://pagespeed.web.dev/

# Kontrola:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
```

---

## 🐛 TROUBLESHOOTING

### Tailwind CSS nefunguje:
```bash
# Zkontrolujte, zda byl CSS vygenerován:
ls -lh dist/css/output.css

# Manuální build:
npx tailwindcss -i ./src/css/input.css -o ./dist/css/output.css
```

### Service Worker se neregistruje:
```javascript
// Zkontrolujte konzoli pro chyby
// Musí být servováno přes HTTPS nebo localhost
```

### Build selhává:
```bash
# Smazat node_modules a zkusit znovu:
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 DALŠÍ ZDROJE

- [Kompletní analýza](KOMPLETNI_ANALYZA.md) - Detailní technická analýza
- [Tailwind Docs](https://tailwindcss.com/docs)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 💡 TIPS

1. **Používejte GitHub Actions** pro automatický build při push
2. **Monitoring** - Nastavte Google Analytics a měřte real-user metrics
3. **Testing** - Testujte na skutečných mobilních zařízeních, ne jen emulátorech
4. **CDN** - Zvažte Cloudflare pro rychlejší delivery

---

## 🎉 HOTOVO?

Po implementaci všech optimalizací:
1. Změřte výkon (Lighthouse score)
2. Porovnejte s původním stavem
3. Oslavte 🎊 - váš web je teď výrazně rychlejší!

---

**Potřebujete pomoc?** Otevřete issue nebo kontaktujte support.

**Happy optimizing! 🚀**
