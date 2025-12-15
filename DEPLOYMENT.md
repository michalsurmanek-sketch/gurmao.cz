# Deployment Guide - GURMAO.cz

## 📦 Pre-deployment Checklist

- [x] Favicon přidán do všech stránek
- [x] Meta tagy (OG, Twitter Card) ve všech HTML
- [x] robots.txt vytvořen
- [x] sitemap.xml vytvořen
- [x] 404.html stránka vytvořena
- [x] Mobile menu funguje na všech stránkách
- [x] Save funkcionalita propojená s collections
- [x] Responsive design otestován
- [x] localStorage funguje správně

## 🚀 GitHub Pages Deployment

### Automatický deployment

1. **Push do main branch:**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **GitHub automaticky deployuje** na:
   - `https://michalsurmanek-sketch.github.io/gurmao.cz`
   - Nebo vlastní doména z CNAME souboru

### Nastavení GitHub Pages

1. Jdi na repository → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `root`
4. Uložit

### Vlastní doména

CNAME soubor už existuje. Pro aktivaci:

1. V GitHub Settings → Pages → Custom domain
2. Zadej doménu z CNAME souboru
3. V DNS providera přidej:
   ```
   Type: CNAME
   Name: www (nebo @)
   Value: michalsurmanek-sketch.github.io
   ```
4. Počkej na DNS propagaci (5-60 minut)

## 🔧 Další hosting možnosti

### Netlify

1. Drag & drop celou složku do Netlify
2. Nebo připoj GitHub repo
3. Build settings: 
   - Build command: (žádný)
   - Publish directory: `.`

### Vercel

```bash
vercel --prod
```

### Cloudflare Pages

1. Připoj GitHub repo
2. Build settings: žádné (statický web)
3. Deploy

## 🎯 Post-deployment checky

- [ ] Všechny stránky se načítají správně
- [ ] Favicon se zobrazuje
- [ ] Mobile menu funguje
- [ ] Save funkcionalita funguje
- [ ] Links mezi stránkami fungují
- [ ] Obrázky se načítají
- [ ] 404 stránka se zobrazuje při neplatné URL

## 📊 Analytics Setup (volitelné)

### Google Analytics 4

Přidej tento kód před `</head>` ve všech HTML souborech:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible Analytics (lightweight)

```html
<script defer data-domain="gurmao.cz" src="https://plausible.io/js/script.js"></script>
```

## 🔍 SEO Post-launch

1. **Google Search Console**
   - Přidej web
   - Odešli sitemap.xml
   - Url: `https://gurmao.cz/sitemap.xml`

2. **Bing Webmaster Tools**
   - Přidej web  
   - Odešli sitemap.xml

3. **Social media preview**
   - Testuj OG tagy: https://www.opengraph.xyz/
   - Twitter Card validator: https://cards-dev.twitter.com/validator

## 🚨 Troubleshooting

### Stránky se nenačítají
- Zkontroluj GitHub Pages je enabled
- Zkontroluj branch je `main`
- Počkej 2-3 minuty na propagaci

### 404 při navigaci
- Ujisti se, že všechny linky jsou relativní (bez `/`)
- Zkontroluj názvy souborů (case sensitive!)

### CNAME nefunguje
- Zkontroluj DNS nastavení
- Zkontroluj CNAME soubor obsahuje správnou doménu
- Počkej na DNS propagaci

### localStorage nefunguje
- Zkontroluj HTTPS (localStorage vyžaduje secure context)
- Zkontroluj browser console pro chyby

## 📈 Performance Tips

### Pro produkci (budoucí):

1. **Minifikovat Tailwind**
   - Použít build process místo CDN
   
2. **Optimalizovat obrázky**
   - Konvertovat na WebP
   - Přidat lazy loading
   
3. **CDN pro assets**
   - Cloudflare
   - CloudImage
   
4. **Add Service Worker**
   - Offline podpora
   - Rychlejší načítání

## ✅ Production Ready!

Web je připraven k nasazení. Všechny základní funkce jsou implementované a otestované.

**Příští kroky:**
1. Deploy na GitHub Pages
2. Nastavit vlastní doménu
3. Přidat analytics
4. Odeslat sitemap do Search Console
5. Share na social media! 🎉
