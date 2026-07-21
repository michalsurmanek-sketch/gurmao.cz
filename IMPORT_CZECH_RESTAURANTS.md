# Automatický import restaurací pro celou ČR

Import používá otevřená data Overture Places. Každý záznam projde filtrem kategorie,
souřadnic, kraje, provozního stavu a minimální důvěryhodnosti. Výsledek se nejdřív
ukládá do neveřejné tabulky `restaurant_import_candidates`; veřejná tabulka
`restaurants` se bodem 2 nemění.

## První nastavení

1. V Supabase SQL Editoru spusťte `czech-republic-database.sql` z bodu 1.
2. Potom spusťte `czech-import-pipeline.sql`.
3. Pro administrační schvalování spusťte `czech-import-review.sql`.
4. Pro ruční opravy importovaných údajů spusťte `czech-import-candidate-edit.sql`.
5. Pro automatické návrhy obsahu spusťte `czech-import-content-suggestions.sql`.
6. V GitHub repozitáři otevřete **Settings → Secrets and variables → Actions**.
7. Přidejte `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY`.

Servisní klíč nikdy nevkládejte do zdrojového kódu ani do veřejného frontendového
JavaScriptu.

## Bezpečný první běh

1. Otevřete **Actions → Import restaurací z Overture → Run workflow**.
2. Vyberte jeden kraj, například `CZ072`.
3. `Uložit kandidáty do neveřejné čekárny` nechte vypnuté.
4. Pro malý test zadejte limit `50`.
5. Po dokončení stáhněte report `overture-report-CZ072`.

Když report vypadá správně, spusťte stejný běh znovu se zapnutým uložením do
čekárny. Ani tento krok nic nezveřejní na Gurmao.cz.

## Kontrola a zveřejnění

Po uložení kandidátů otevřete `admin-imports.html`. Administrátor zde vidí skóre
kvality, zdrojová data a možné duplicity. Bezpečný postup má dva samostatné kroky:

- Ikona **✏️ Upravit** dovolí před schválením opravit název, kategorii, město,
  adresu, telefon, web a souřadnice. Zdrojové ID zůstává uzamčené.
- Úprava již schváleného kandidáta vrátí jeho stav na `new`, aby musel znovu
  projít kontrolou.
- Při importu se automaticky navrhne atmosféra a krátký faktický popis. Import se
  také pokusí získat `og:image` pouze z oficiálního webu restaurace. Pokud jej
  web neposkytuje, URL obrázku zůstane prázdná.
- Po schválení se návrhy předvyplní do publikačního formuláře, ale administrátor
  je může před zveřejněním libovolně upravit.

1. kandidáta zkontrolovat a schválit,
2. vybrat atmosféru Gurmao, napsat pravdivý popis a teprve potom zveřejnit.

Zveřejnění probíhá databázovou funkcí, která znovu ověří administrátorskou roli,
schválený stav a duplicitu. Běžný přihlášený uživatel importní frontu neuvidí.

## Automatický režim

Workflow se každý měsíc spustí pro všech 14 krajů pouze jako kontrolní náhled.
Výsledky uchová 30 dní. Zápis do čekárny je vždy ruční rozhodnutí.

## Místní kontrola

```bash
npm run test:import
node scripts/import-czech-restaurants.mjs --print-bbox --region=CZ072
node scripts/import-czech-restaurants.mjs \
  --input=/cesta/overture-CZ072.geojson \
  --region=CZ072 \
  --limit=50 \
  --report=import-report-CZ072.json
```

## Zdroje a licence

- Overture Places: https://docs.overturemaps.org/guides/places/
- Overture získání dat: https://docs.overturemaps.org/getting-data/
- Overture licence a atribuce: https://docs.overturemaps.org/attribution/

Při zveřejnění dat musí web uvést atribuci požadovanou aktuální verzí Overture.
