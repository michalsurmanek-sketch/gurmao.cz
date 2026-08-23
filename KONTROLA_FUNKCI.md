# Archivovaná kontrola funkcí

Původní obsah tohoto souboru popisoval stav z **7. ledna 2026** a už neodpovídal současné architektuře GURMAO. Obsahoval retired Supabase projekt, starý auth model, dnes odstraněný rating runtime a neplatné tvrzení, že `collections.html` musí být vždy za loginem.

Aktuální technický stav je v:

- `PROJEKT_STATUS.md`
- `SUPABASE_SETUP.md`
- `scripts/runtime-quality.test.mjs`
- `.github/workflows/quality-check.yml`

Pro ověření současného repozitáře spusť:

```bash
npm ci
npm test
./check-project.sh
```

Tento soubor už není zdroj pravdy pro produkční konfiguraci.
