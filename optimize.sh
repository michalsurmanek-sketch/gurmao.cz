#!/bin/bash

# GURMAO.cz - Quick Optimization Script
# Implementuje nejvýznamnější optimalizace (Fáze 1)

set -e

echo "🚀 GURMAO.cz - Optimalizační skript"
echo "==================================="
echo ""

# 1. Inicializace projektu s npm
echo "📦 Krok 1/7: Inicializace npm projektu..."
if [ ! -f "package.json" ]; then
  npm init -y
fi

# 2. Instalace závislostí
echo "📥 Krok 2/7: Instalace závislostí..."
npm install -D tailwindcss@latest postcss autoprefixer esbuild

# 3. Konfigurace Tailwind CSS
echo "⚙️  Krok 3/7: Konfigurace Tailwind CSS..."
npx tailwindcss init

# Vytvořit tailwind.config.js s vlastní konfigurací
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

# 5. Vytvořit build skripty
echo "🔧 Krok 5/7: Konfigurace build skriptů..."
npm pkg set scripts.build:css="tailwindcss -i ./src/css/input.css -o ./dist/css/output.css --minify"
npm pkg set scripts.build:js="esbuild app.js restaurace.js mapa.js rating.js supabase-client.js --bundle --minify --outdir=dist/js --format=esm"
npm pkg set scripts.dev:css="tailwindcss -i ./src/css/input.css -o ./dist/css/output.css --watch"
npm pkg set scripts.build="npm run build:css && npm run build:js"
npm pkg set scripts.dev="npm run dev:css"

# 6. Vytvořit directories
echo "📁 Krok 6/7: Vytvoření adresářové struktury..."
mkdir -p dist/css
mkdir -p dist/js
mkdir -p src/js

# 7. Build CSS pro první spuštění
echo "🏗️  Krok 7/7: První build..."
npm run build:css

echo ""
echo "✅ Optimalizace dokončena!"
echo ""
echo "📋 Další kroky:"
echo "1. Nahraďte v HTML souborech:"
echo "   <script src=\"https://cdn.tailwindcss.com\"></script>"
echo "   →  <link rel=\"stylesheet\" href=\"/dist/css/output.css\">"
echo ""
echo "2. Spusťte development watch:"
echo "   npm run dev"
echo ""
echo "3. Pro produkční build:"
echo "   npm run build"
echo ""
echo "📈 Očekávané zlepšení: ~2-3s rychlejší First Contentful Paint"
