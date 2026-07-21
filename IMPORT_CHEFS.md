# Import kuchařů z oficiálních webů

Import nikdy nezveřejňuje kuchaře automaticky. Systém přijímá pouze strukturovaná data `Person`, která oficiální web restaurace označuje jako `chef`, případně obsahují jednoznačnou kuchařskou pracovní pozici.

## První spuštění

1. V produkčním Supabase SQL Editoru spusť celý soubor `chef-import-pipeline.sql`.
2. V GitHub Actions otevři workflow **Najít kuchaře na oficiálních webech**.
3. Pro první kontrolu nastav `limit` na `50` a `stage` zapni.
4. Výsledek zkontroluj na `admin-chef-imports.html`.

## Bezpečnost a kvalita

- zdrojem je výhradně web uložený u zveřejněné restaurace;
- volný text stránky se nepoužívá k hádání jmen;
- každý kandidát uchovává přesnou zdrojovou URL a důkaz;
- privátní IP adresy, lokální sítě a nebezpečné URL jsou blokované;
- možné duplicity se označí a vyžadují ruční potvrzení;
- chybějící bio nebo obrázek zůstává prázdný;
- zveřejnění vyžaduje administrátora, předchozí schválení a neprázdné ověřené bio.
