#!/bin/bash
# Skript pro obnovení souborů ze zálohy

echo "Obnovování souborů ze zálohy..."

if [ -f "nav-search.js.backup" ]; then
  cp nav-search.js.backup nav-search.js
  echo "✓ nav-search.js obnoven"
fi

if [ -f "footer-legal-toggle.js.backup" ]; then
  cp footer-legal-toggle.js.backup footer-legal-toggle.js
  echo "✓ footer-legal-toggle.js obnoven"
fi

if [ -f "index.html.backup" ]; then
  cp index.html.backup index.html
  echo "✓ index.html obnoven"
fi

# Smazat location-search.js pokud existuje
if [ -f "location-search.js" ]; then
  rm location-search.js
  echo "✓ location-search.js odstraněn"
fi

echo ""
echo "Obnovení dokončeno! Všechny soubory vráceny do původního stavu."
echo "Záložní soubory (.backup) ponechány pro případné další použití."
