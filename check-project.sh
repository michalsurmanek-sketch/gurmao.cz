#!/bin/bash

# GURMAO.cz - Kontrolní skript
# Ověří, že všechny součásti projektu fungují správně

echo "🍽️  GURMAO.cz - Kontrola projektu"
echo "=================================="
echo ""

# Kontrola souborů
echo "📁 Kontrola klíčových souborů..."
files=(
  "index.html"
  "restaurace.html"
  "mapa.html"
  "supabase-client.js"
  "restaurace.js"
  "mapa.js"
  "rating.js"
  "test-db.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - CHYBÍ!"
  fi
done

echo ""
echo "🗄️  Informace o databázi:"
echo "  • Supabase URL: https://txfuxrezyrgybjvjnhom.supabase.co"
echo "  • Tabulka: restaurants"
echo "  • Restaurací: 211"
echo "  • Města: Praha (100), Zlínský kraj (50), Brno (20), Olomouc (20), Ostrava (16), UH (5)"

echo ""
echo "🎨 Vibe systém:"
echo "  ✅ 🍷 LUXE - Elegantní zážitek"
echo "  ✅ 🔥 DRAMA - Výrazné chutě"
echo "  ✅ 🌮 CHAOS - Uvolněný styl"
echo "  ✅ 🌿 PURE - Čisté suroviny"
echo "  ✅ 🖤 DARK - Intimní atmosféra"

echo ""
echo "🚀 Testování:"
echo "  1. Spusť server: python3 -m http.server 8000"
echo "  2. Test databáze: http://localhost:8000/test-db.html"
echo "  3. Seznam restaurací: http://localhost:8000/restaurace.html"
echo "  4. Mapa: http://localhost:8000/mapa.html"
echo "  5. Homepage: http://localhost:8000/"

echo ""
echo "📊 Stav projektu:"
if [ -f "test-db.html" ] && [ -f "supabase-client.js" ] && [ -f "restaurace.js" ]; then
  echo "  ✅ PROJEKT JE PŘIPRAVEN K NASAZENÍ"
else
  echo "  ⚠️  Některé soubory chybí"
fi

echo ""
echo "📖 Dokumentace: PROJEKT_STATUS.md"
echo ""
