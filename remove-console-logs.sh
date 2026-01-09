#!/bin/bash

# GURMAO.cz - Odstranění console.log() z produkčních souborů
# Zachová je pouze v development souborech

echo "🧹 Odstraňování console.log() z produkčních souborů..."
echo ""

# Soubory ke zpracování (produkční kód)
PRODUCTION_FILES=(
  "restaurace.js"
  "mapa.js"
  "rating.js"
  "supabase-client.js"
)

# Backup adresář
BACKUP_DIR="backup-console-logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

count=0

for file in "${PRODUCTION_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Backup
    cp "$file" "$BACKUP_DIR/$file"
    
    # Odstranit console.log, console.debug, console.info
    # Zachovat console.error a console.warn (důležité pro debugging)
    sed -i '/console\.log(/d' "$file"
    sed -i '/console\.debug(/d' "$file"
    sed -i '/console\.info(/d' "$file"
    
    echo "✅ Vyčištěno: $file"
    count=$((count + 1))
  fi
done

echo ""
echo "✅ Hotovo! Vyčištěno $count souborů"
echo "📁 Backup: $BACKUP_DIR"
echo ""
echo "ℹ️  console.error() a console.warn() byly zachovány"
