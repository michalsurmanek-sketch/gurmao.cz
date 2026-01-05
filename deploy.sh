#!/bin/bash
# GURMAO.cz - Production Deployment Script
# Tento skript připraví web k nasazení do produkce

set -e

echo "🚀 GURMAO.cz - Spouštím ostrý režim..."
echo ""

# Barvy pro terminál
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Kontrola souborů
echo "📋 Kontroluji důležité soubory..."

files=(
  "index.html"
  "feed.html"
  "restaurace.html"
  "kuchar.html"
  "gear.html"
  "ai.html"
  "collections.html"
  "login.html"
  "mapa.html"
  "profile.html"
  "reset-password.html"
  "admin.html"
  "restaurace-noir-table.html"
  "kuchar-adam-noir.html"
  "404.html"
  "app.js"
  "supabase-client.js"
  "auth-ui.js"
  "auth-guard.js"
  "admin-guard.js"
  "rating.js"
  "ai-recommendations.js"
  "social-share.js"
  "onboarding.js"
  "vibe-tooltips.js"
  "toast.js"
  "ga.js"
  "favicon.svg"
  "og-image.svg"
  "robots.txt"
  "sitemap.xml"
  "404.html"
  "CNAME"
  "README.md"
  "DEPLOYMENT.md"
)

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo -e "  ${RED}❌ $file - CHYBÍ!${NC}"
    missing=$((missing + 1))
  fi
done

if [ $missing -gt 0 ]; then
  echo -e "${RED}Chybí $missing souborů! Oprav to před deploymentem.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Všechny soubory jsou na místě!${NC}"
echo ""

# 2. Git status
echo "📦 Kontroluji Git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Máš necommitnuté změny!${NC}"
  git status --short
  echo ""
  read -p "Chceš commitnout změny? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    read -p "Commit message: " commit_msg
    git commit -m "$commit_msg"
    echo -e "${GREEN}✅ Změny commitnuty${NC}"
  fi
else
  echo -e "${GREEN}✅ Všechny změny jsou commitnuté${NC}"
fi

echo ""

# 3. Push do GitHub
echo "🔄 Pushuji do GitHub..."
git push origin main
echo -e "${GREEN}✅ Push úspěšný!${NC}"
echo ""

# 4. Informace o deploymentu
echo "🌐 DEPLOYMENT INFORMACE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 GitHub Repository:"
echo "   https://github.com/michalsurmanek-sketch/gurmao.cz"
echo ""
echo "🚀 GitHub Pages URL (za 2-3 minuty):"
echo "   https://michalsurmanek-sketch.github.io/gurmao.cz"
echo ""
echo "⚙️  Nastavení GitHub Pages:"
echo "   https://github.com/michalsurmanek-sketch/gurmao.cz/settings/pages"
echo ""

# Zjistit jestli existuje CNAME
if [ -f "CNAME" ]; then
  domain=$(cat CNAME)
  echo "🌐 Vlastní doména (z CNAME):"
  echo "   https://$domain"
  echo ""
  echo -e "${YELLOW}⚠️  Nezapomeň nastavit DNS záznamy u svého poskytovatele!${NC}"
  echo "   Type: CNAME"
  echo "   Name: www (nebo @)"
  echo "   Value: michalsurmanek-sketch.github.io"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ DEPLOYMENT HOTOVÝ!${NC}"
echo ""
echo "📝 Další kroky:"
echo "   1. Jdi na GitHub Pages nastavení (odkaz výše)"
echo "   2. Zkontroluj že Source je 'Deploy from a branch'"
echo "   3. Zkontroluj že Branch je 'main' / root"
echo "   4. Počkaj 2-3 minuty na build"
echo "   5. Otevři URL a testuj web"
echo ""
echo "🎉 GURMAO.cz je v ostrém režimu!"
echo ""
