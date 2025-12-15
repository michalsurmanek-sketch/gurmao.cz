#!/bin/bash
# GURMAO.cz - Supabase Configuration Wizard
# Tento skript pomůže nakonfigurovat Supabase credentials

echo "🚀 GURMAO.cz - Supabase Configuration"
echo "======================================"
echo ""

# Barvy
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Tento wizard ti pomůže nastavit Supabase.${NC}"
echo ""
echo "Než začneš, ujisti se, že máš:"
echo "  1. ✅ Účet na https://supabase.com"
echo "  2. ✅ Vytvořený projekt"
echo "  3. ✅ Project URL a anon key"
echo ""

read -p "Máš tyto informace připravené? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}📚 Návod:${NC}"
    echo "  1. Jdi na https://supabase.com"
    echo "  2. Sign up / Login"
    echo "  3. Create new project"
    echo "     - Name: gurmao-cz"
    echo "     - Region: Europe (Frankfurt)"
    echo "     - Database password: [silné heslo]"
    echo "  4. Počkej ~2 minuty na setup"
    echo "  5. Settings → API"
    echo "     - Copy 'Project URL'"
    echo "     - Copy 'anon/public' key"
    echo "  6. Spusť tento script znovu"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}Výborně! Zadej Supabase credentials:${NC}"
echo ""

# Načti Project URL
read -p "📍 Project URL (např. https://xxxxx.supabase.co): " SUPABASE_URL

# Validace URL
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${YELLOW}⚠️  URL by mělo končit na .supabase.co${NC}"
    read -p "Pokračovat? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Načti anon key
echo ""
read -p "🔑 Anon/public key (dlouhý string začínající 'eyJ...'): " SUPABASE_ANON_KEY

# Validace key
if [[ ! $SUPABASE_ANON_KEY =~ ^eyJ ]]; then
    echo -e "${YELLOW}⚠️  Key by měl začínat 'eyJ'${NC}"
    read -p "Pokračovat? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}📝 Aktualizuji supabase-client.js...${NC}"

# Backup původního souboru
cp supabase-client.js supabase-client.js.backup

# Nahraď credentials
sed -i "s|const SUPABASE_URL = '.*';|const SUPABASE_URL = '$SUPABASE_URL';|" supabase-client.js
sed -i "s|const SUPABASE_ANON_KEY = '.*';|const SUPABASE_ANON_KEY = '$SUPABASE_ANON_KEY';|" supabase-client.js

echo -e "${GREEN}✅ Credentials uloženy!${NC}"
echo ""

# Zobraz další kroky
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Konfigurace hotová!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Další kroky:"
echo ""
echo "1️⃣  Setup databáze:"
echo "   → Jdi do Supabase Dashboard"
echo "   → SQL Editor → New query"
echo "   → Copy-paste SQL z SUPABASE_SETUP.md"
echo "   → Run"
echo ""
echo "2️⃣  Enable Authentication:"
echo "   → Authentication → Providers"
echo "   → Zkontroluj že Email je enabled"
echo "   → (Volitelně) Enable Google OAuth"
echo ""
echo "3️⃣  Test:"
echo "   → Otevři login.html"
echo "   → Zaregistruj se"
echo "   → Zkontroluj Dashboard → Authentication → Users"
echo ""
echo "4️⃣  Deploy:"
echo "   git add ."
echo "   git commit -m \"Add Supabase integration\""
echo "   git push origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📚 Dokumentace:${NC}"
echo "   • SUPABASE_SETUP.md - kompletní setup guide"
echo "   • supabase-client.js - API helper funkce"
echo "   • AUTHENTICATION.md - security best practices"
echo ""
echo -e "${GREEN}🎊 GURMAO.cz je připraven s Supabase! 🎊${NC}"
echo ""
