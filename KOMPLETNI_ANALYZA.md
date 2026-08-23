# Archivovaná analýza GURMAO

Původní dokument byl vytvořen **9. ledna 2026** a popisoval tehdejší web. Od té doby se zásadně změnila datová vrstva, service worker, detail restaurace, katalog, mapa, uložené restaurace, AI doporučení, kontakt, SEO i bezpečnost.

Proto už tento soubor nesmí sloužit jako aktuální audit ani implementační plán.

## Aktuální zdroje pravdy

- `PROJEKT_STATUS.md` – současný technický stav a otevřené priority,
- `SUPABASE_SETUP.md` – aktuální Supabase a RLS pravidla,
- `scripts/runtime-quality.test.mjs` – regresní kontrakty,
- `.github/workflows/quality-check.yml` – automatická kontrola,
- `supabase/config.toml` – JWT režim Edge Functions.

## Aktuální lokální kontrola

```bash
npm ci
npm test
./check-project.sh
```

Historické závěry z ledna 2026, včetně tehdejších počtů restaurací a tehdejšího Supabase projektu, už nejsou platné.
