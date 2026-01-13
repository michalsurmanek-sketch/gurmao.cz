#!/bin/bash

# Seznam souborů k úpravě
files=(
  "404.html"
  "ai.html" 
  "admin.html"
  "collections.html"
  "feed.html"
  "gear.html"
  "kontakt.html"
  "kuchar.html"
  "kuchar-adam-noir.html"
  "kuchar-detail.html"
  "legal.html"
  "login.html"
  "profile.html"
  "restaurace.html"
  "restaurace-detail.html"
  "restaurace-noir-table.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Úprava $file..."
    # Použij sed k odstranění footerSearchBox bloku
    # Najdi řádek s footerSearchBox a odstraň celý blok až po </div> a další </div>
    sed -i '/<div id="footerSearchBox"/,/<\/div>$/{ /Sledujte nás/!d; }' "$file" 2>/dev/null || true
  fi
done

echo "Hotovo!"
