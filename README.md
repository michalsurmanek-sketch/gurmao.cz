# GURMAO.cz

**Nejez. Prožij.**

Kurátorovaná platforma pro gastronomii s filozofií zaměřenou na zážitky, ne jen jídlo.

## 🎨 Koncept

GURMAO je minimalistická dark-mode platforma pro objevování vybraných restaurací, kuchařů a gastro zážitků. Není to katalog všech restaurací - pouze těch, které mají důvod existovat.

### Klíčové funkce

- **Vibe systém** - kategorizace podle atmosféry a nálady
- **AI doporučení** - jedno místo podle aktuální nálady, bez scrollování
- **Můj výběr** - osobní chuťová paměť uložených míst
- **Feed** - kurátorovaný obsah s mobile-first přístupem
- **Gear** - vybavení doporučené profesionály

## 🚀 Technologie

- **Tailwind CSS** (CDN) - utility-first CSS framework
- **Vanilla JavaScript** - žádné frameworky, čistý JS
- **localStorage** - ukládání dat (MVP režim)
- **Google Fonts** - Playfair Display + Inter

## 🎨 Design systém

### Barevná paleta

```css
gurmaoblack: #0b0b0d  /* Tmavé pozadí */
gurmaogold: #d4af37    /* Zlatá - hlavní akcent */
gurmaored: #8b1d18     /* Červená - minimálně použito */
```

### Vizuální prvky

- Dark mode s minimalistickým designem
- Zlaté akcenty pro CTA a důležité prvky
- Glow efekty (`shadow-glow`)
- Backdrop blur pro layery
- Rounded-3xl pro karty (24px radius)

### Typography

- **Headings**: Playfair Display (serif, elegantní)
- **Body**: Inter (sans-serif, čitelný)

## 📁 Struktura projektu

```
├── index.html                    # Landing page
├── feed.html                     # Feed s restauracemi
├── restaurace.html               # Seznam restaurací
├── kuchar.html                   # Seznam kuchařů
├── gear.html                     # Vybavení
├── ai.html                       # AI doporučení
├── collections.html              # Můj výběr
├── onboarding.html               # Registrační formulář
├── restaurace-noir-table.html    # Detail restaurace
├── kuchar-adam-noir.html         # Profil kuchaře
├── app.js                        # Sdílený JavaScript
└── CNAME                         # GitHub Pages konfigurace
```

## 🎯 Vibe systém

Restaurace jsou kategorizovány podle "vibes" - atmosféry a pocitu:

- 🔥 **DRAMA** - intenzivní zážitky, dramatická atmosféra
- 🖤 **DARK** - elegantní fine dining, tmavá estetika
- 🌿 **PURE** - čisté chutě, minimalismus
- 🍷 **LUXE** - luxusní prostředí, premium service
- 🌮 **CHAOS** - street food, živá atmosféra
- 🌊 **CALM** - klidná, relaxační atmosféra

## 💾 Lokální úložiště

Data jsou ukládána v `localStorage`:

### Save funkcionalita

```javascript
// Klíč pro uložené restaurace
const SAVED_KEY = 'gurmao_saved';

// Uložit restauraci
GurmaoApp.toggleSave('noir-table');

// Získat všechny uložené
const saved = GurmaoApp.getSaved();
```

### Data struktura

```javascript
// Restaurace
{
  id: 'noir-table',
  vibe: '🍷 LUXE',
  name: 'Noir Table',
  city: 'Praha',
  tag: 'fine dining',
  href: 'restaurace-noir-table.html',
  img: 'https://...'
}
```

## 🔧 Jak spustit

### 1. Lokální vývoj

Jednoduše otevřete `index.html` v prohlížeči. Nebo použijte lokální server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# VS Code Live Server
# Klikněte pravým na index.html -> Open with Live Server
```

### 2. GitHub Pages

Projekt je nakonfigurován pro GitHub Pages:

1. Push do `main` branch
2. GitHub automaticky deployuje
3. Dostupné na: `https://username.github.io/gurmao.cz`

CNAME soubor obsahuje vlastní doménu.

## 📱 Mobilní menu

Hamburger menu je implementováno ve všech stránkách:

- Automaticky se zavře při kliknutí na odkaz
- Podporuje Escape klávesou
- Backdrop overlay pro lepší UX
- Responsive breakpoint: `md:` (768px)

## 🎨 Přidání nové restaurace

### 1. Přidat do seznamu (restaurace.html)

```html
<a href="restaurace-nazev.html" class="group rounded-3xl bg-white/5 hover:bg-white/10 transition overflow-hidden">
  <div class="aspect-[3/4] bg-[url('obrazek.jpg')] bg-cover bg-center"></div>
  <div class="p-6">
    <div class="text-sm text-gurmaogold mb-1">🍷 LUXE</div>
    <h3 class="text-xl font-semibold">Název</h3>
    <p class="text-white/60 text-sm mt-1">Město · typ</p>
  </div>
</a>
```

### 2. Přidat do katalogu (collections.html)

```javascript
const catalog = [
  {
    id: 'nazev-restaurace',
    vibe: '🍷 LUXE',
    name: 'Název',
    city: 'Město',
    tag: 'typ',
    href: 'restaurace-nazev.html',
    img: 'url_obrazku'
  }
];
```

### 3. Vytvořit detailní stránku

Použijte `restaurace-noir-table.html` jako šablonu.

## 🔍 SEO

Všechny stránky obsahují:

- Meta description
- Open Graph tagy pro social sharing
- Twitter Card tagy
- Správné semantic HTML

## 🚧 MVP poznámky

Aktuální verze je MVP (Minimum Viable Product):

- ✅ Design a UX kompletní
- ✅ Mobile responsive
- ✅ localStorage pro ukládání
- ⚠️ Mock data (v produkci připojit k DB)
- ⚠️ Onboarding formulář neposílá data
- ⚠️ Chybí real-time aktualizace

## 🎯 Roadmap

### Fáze 1 - Backend (budoucí)
- [ ] Databáze (Supabase/Firebase)
- [ ] Autentizace uživatelů
- [ ] Real-time aktualizace
- [ ] API endpointy

### Fáze 2 - Funkce
- [ ] Vyhledávání
- [ ] Filtry na feed
- [ ] Review systém
- [ ] Rezervace

### Fáze 3 - Komunitní
- [ ] Uživatelské profily
- [ ] Komentáře
- [ ] Sdílení sbírek
- [ ] Following systém

## 🤝 Přispívání

Pro MVP není potřeba složitý setup:

1. Fork repozitář
2. Vytvoř feature branch
3. Commituj změny
4. Push a vytvoř Pull Request

### Coding style

- Používej Tailwind utility classes
- Konzistentní mezery (2 spaces)
- Komentuj složitější logiku
- Testuj na mobile i desktop

## 📄 Licence

© 2025 GURMAO.cz · Všechna práva vyhrazena

## 💬 Kontakt

Pro otázky a návrhy: [Sem přidat kontakt]

---

**Nejez. Prožij.** 🍷
