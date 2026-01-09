#!/bin/bash

# GURMAO.cz - BEZPEČNÝ Optimalizační skript
# Verze s kontrolami a automatickým backupem

set -e  # Ukončit při chybě

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 GURMAO.cz - Bezpečný optimalizační skript"
echo "=============================================="
echo ""

# ==========================================
# FUNKCE PRO POTVRZENÍ
# ==========================================
confirm() {
  read -p "$1 (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    return 1
  fi
  return 0
}

# ==========================================
# KONTROLA GIT STATUSU
# ==========================================
echo "🔍 Kontrola Git statusu..."

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${YELLOW}⚠️  VAROVÁNÍ: Máš neuložené změny!${NC}"
  echo ""
  git status --short
  echo ""
  
  if confirm "Chceš před pokračováním udělat commit?"; then
    read -p "Commit message: " commit_msg
    git add .
    git commit -m "${commit_msg:-backup před optimalizací}"
    echo -e "${GREEN}✅ Commit vytvořen${NC}"
  else
    if ! confirm "Pokračovat BEZ commitu (nedoporučeno)?"; then
      echo "❌ Optimalizace zrušena. Udělej nejdřív commit:"
      echo "   git add ."
      echo "   git commit -m 'backup před optimalizací'"
      exit 1
    fi
  fi
fi

# ==========================================
# VYTVOŘENÍ BACKUP BRANCHE
# ==========================================
echo ""
echo "💾 Vytvoření backup branch..."

BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"

if confirm "Vytvořit backup branch '$BACKUP_BRANCH'?"; then
  git branch "$BACKUP_BRANCH"
  echo -e "${GREEN}✅ Backup branch vytvořen: $BACKUP_BRANCH${NC}"
  echo "   Vrátit zpět: git checkout $BACKUP_BRANCH"
else
  echo -e "${YELLOW}⚠️  Backup branch NEVYTVOŘEN${NC}"
fi

# ==========================================
# KONTROLA EXISTUJÍCÍCH SOUBORŮ
# ==========================================
echo ""
echo "🔍 Kontrola existujících souborů..."

if [ -f "package.json" ]; then
  echo -e "${YELLOW}⚠️  package.json již existuje${NC}"
  if ! confirm "Přepsat package.json scripty?"; then
    echo "   Přeskakuji npm init..."
    SKIP_NPM_INIT=1
  fi
fi

if [ -f "tailwind.config.js" ]; then
  echo -e "${YELLOW}⚠️  tailwind.config.js již existuje${NC}"
  if ! confirm "Přepsat tailwind.config.js?"; then
    echo "   Přeskakuji konfiguraci..."
    SKIP_TAILWIND_CONFIG=1
  fi
fi

# ==========================================
# DRY RUN - Zobrazení plánovaných změn
# ==========================================
echo ""
echo "📋 PLÁNOVANÉ ZMĚNY:"
echo "-------------------"
echo "✓ Vytvoření: src/css/input.css"
echo "✓ Vytvoření: dist/css/output.css"
echo "✓ Vytvoření: dist/js/"
[ -z "$SKIP_NPM_INIT" ] && echo "✓ Vytvoření/úprava: package.json"
[ -z "$SKIP_TAILWIND_CONFIG" ] && echo "✓ Vytvoření: tailwind.config.js"
echo "✓ Instalace: node_modules/ (~50MB)"
echo ""
echo -e "${GREEN}❌ ŽÁDNÉ existující soubory NEBUDOU smazány!${NC}"
echo ""

if ! confirm "Pokračovat s optimalizací?"; then
  echo "❌ Optimalizace zrušena."
  exit 0
fi

# ==========================================
# ZAČÁTEK OPTIMALIZACE
# ==========================================
echo ""
echo "🚀 Začínám optimalizaci..."
echo ""

# 1. NPM inicializace
if [ -z "$SKIP_NPM_INIT" ]; then
  echo "📦 Krok 1/7: Inicializace npm projektu..."
  npm init -y > /dev/null 2>&1
else
  echo "📦 Krok 1/7: Přeskočeno (package.json existuje)"
fi

# 2. Instalace závislostí
echo "📥 Krok 2/7: Instalace závislostí..."
echo "   (Může trvat 1-2 minuty...)"
npm install -D tailwindcss@latest postcss autoprefixer esbuild --silent

# 3. Tailwind konfigurace
if [ -z "$SKIP_TAILWIND_CONFIG" ]; then
  echo "⚙️  Krok 3/7: Konfigurace Tailwind CSS..."
  npx tailwindcss init > /dev/null 2>&1

  # Vytvořit vlastní config
  cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        gurmaoblack: '#0b0b0d',
        gurmaogold: '#d4af37',
        gurmaored: '#8b1d18',
      },
      boxShadow: {
        glow: '0 0 40px rgba(212,175,55,0.35)'
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: []
}
EOF
else
  echo "⚙️  Krok 3/7: Přeskočeno (tailwind.config.js existuje)"
fi

# 4. Vytvořit CSS vstupní soubor
echo "📝 Krok 4/7: Vytvoření source CSS..."
mkdir -p src/css
cat > src/css/input.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
@layer base {
  body {
    font-family: 'Inter', sans-serif;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
  }
}

@layer utilities {
  .shadow-glow {
    box-shadow: 0 0 40px rgba(212,175,55,0.35);
  }
}
EOF

# 5. Build skripty
echo "🔧 Krok 5/7: Konfigurace build skriptů..."
npm pkg set scripts.build:css="tailwindcss -i ./src/css/input.css -o ./dist/css/output.css --minify"
npm pkg set scripts.build:js="esbuild app.js restaurace.js mapa.js rating.js supabase-client.js --bundle --minify --outdir=dist/js --format=esm"
npm pkg set scripts.dev:css="tailwindcss -i ./src/css/input.css -o ./dist/css/output.css --watch"
npm pkg set scripts.build="npm run build:css && npm run build:js"
npm pkg set scripts.dev="npm run dev:css"

# 6. Adresáře
echo "📁 Krok 6/7: Vytvoření adresářové struktury..."
mkdir -p dist/css
mkdir -p dist/js
mkdir -p src/js

# 7. První build
echo "🏗️  Krok 7/7: První build CSS..."
npm run build:css --silent

# ==========================================
# SHRNUTÍ
# ==========================================
echo ""
echo -e "${GREEN}✅ OPTIMALIZACE DOKONČENA!${NC}"
echo ""
echo "📊 VYTVOŘENÉ SOUBORY:"
echo "   ✓ src/css/input.css"
echo "   ✓ dist/css/output.css ($(du -h dist/css/output.css | cut -f1))"
echo "   ✓ node_modules/ ($(du -sh node_modules 2>/dev/null | cut -f1 || echo '~50MB'))"
[ -z "$SKIP_NPM_INIT" ] && echo "   ✓ package.json (aktualizován)"
[ -z "$SKIP_TAILWIND_CONFIG" ] && echo "   ✓ tailwind.config.js"
echo ""
echo "📋 DALŠÍ KROKY:"
echo "   1. Nahraď v HTML souborech:"
echo "      <script src=\"https://cdn.tailwindcss.com\"></script>"
echo "      →  <link rel=\"stylesheet\" href=\"/dist/css/output.css\">"
echo ""
echo "   2. Spusť development watch:"
echo "      npm run dev"
echo ""
echo "   3. Pro produkční build:"
echo "      npm run build"
echo ""
echo "💾 BACKUP:"
echo "   Branch: $BACKUP_BRANCH"
echo "   Vrátit: git checkout $BACKUP_BRANCH"
echo ""
echo -e "${GREEN}🎉 Vše hotovo! Žádné soubory nebyly smazány.${NC}"
