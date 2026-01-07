# GDPR & Legal Compliance - Nutné kroky k dokončení

## ✅ Co je hotovo

- ✅ Právní stránka (legal.html) s kompletní strukturou
- ✅ Cookie consent banner s GDPR compliant nastavením
- ✅ Odkazy v footerech všech stránek
- ✅ Integrace cookie consent na všech stránkách
- ✅ Správa souhlasu uživatelů s localStorage

## ⚠️ CO MUSÍTE JEŠTĚ VYPLNIT

### 1. Identifikační údaje v legal.html (řádky 69-77)

Otevřete `/workspaces/gurmao.cz/legal.html` a vyplňte:

```html
<p class="mb-2"><strong>Název:</strong> [Název společnosti / jméno podnikatele]</p>
<p class="mb-2"><strong>Sídlo:</strong> [Adresa]</p>
<p class="mb-2"><strong>IČO:</strong> [IČO]</p>
<p class="mb-2"><strong>DIČ:</strong> [DIČ] (pokud je plátce DPH)</p>
<p class="mb-2"><strong>E-mail:</strong> <a href="mailto:info@gurmao.cz">info@gurmao.cz</a></p>
<p class="mb-0"><strong>Zápis:</strong> [Obchodní rejstřík / Živnostenský rejstřík]</p>
```

**Příklad pro živnostníka:**
```html
<p class="mb-2"><strong>Název:</strong> Jan Novák</p>
<p class="mb-2"><strong>Sídlo:</strong> Pražská 123, 110 00 Praha 1</p>
<p class="mb-2"><strong>IČO:</strong> 12345678</p>
<p class="mb-2"><strong>DIČ:</strong> CZ12345678 (pokud je plátce DPH, jinak smazat řádek)</p>
<p class="mb-2"><strong>E-mail:</strong> <a href="mailto:info@gurmao.cz">info@gurmao.cz</a></p>
<p class="mb-0"><strong>Zápis:</strong> Živnostenský rejstřík, Magistrát města Praha</p>
```

**Příklad pro s.r.o.:**
```html
<p class="mb-2"><strong>Název:</strong> GURMAO s.r.o.</p>
<p class="mb-2"><strong>Sídlo:</strong> Pražská 123, 110 00 Praha 1</p>
<p class="mb-2"><strong>IČO:</strong> 12345678</p>
<p class="mb-2"><strong>DIČ:</strong> CZ12345678</p>
<p class="mb-2"><strong>E-mail:</strong> <a href="mailto:info@gurmao.cz">info@gurmao.cz</a></p>
<p class="mb-0"><strong>Zápis:</strong> Obchodní rejstřík, vedený u Městského soudu v Praze, oddíl C, vložka 12345</p>
```

### 2. Kontaktní e-maily

Vytvořte nebo nakonfigurujte tyto e-mailové adresy:

- **info@gurmao.cz** - obecné dotazy
- **gdpr@gurmao.cz** - GDPR žádosti (nebo použijte info@gurmao.cz pro obě)

Případně změňte v legal.html odkazy na vaše skutečné e-maily.

### 3. Google Analytics (volitelné)

Pokud používáte Google Analytics, v souboru `ga.js` nastavte:

```javascript
window.gaTrackingId = 'G-XXXXXXXXXX'; // Váš GA4 tracking ID
```

Cookie consent banner automaticky řídí, kdy se GA může načíst.

### 4. Datum poslední aktualizace

V legal.html (řádek ~297) aktualizujte datum při každé změně podmínek:

```html
<p>Tyto podmínky byly naposledy aktualizovány: <strong>7. ledna 2025</strong></p>
```

## 📋 Kontrolní seznam před spuštěním

- [ ] Vyplněny identifikační údaje v legal.html
- [ ] Zkontrolované e-mailové adresy (info@, gdpr@)
- [ ] Nastaveno Google Analytics tracking ID (pokud používáte)
- [ ] Ověřena platnost údajů v sekci GDPR
- [ ] Zkontrolována funkčnost cookie banneru (otevřete stránku v inkognito režimu)
- [ ] Ověřeno tlačítko "Nastavení cookies" v patičce
- [ ] Zkontrolováno, že všechny stránky mají footer s právními odkazy

## 🔍 Testování cookie consent

1. Otevřete web v inkognito režimu
2. Měl by se zobrazit cookie banner dole
3. Vyzkoušejte všechny tři možnosti:
   - "Přijmout vše" - uloží souhlas a skryje banner
   - "Pouze nezbytné" - zakáže analytiku
   - "Nastavit" - zobrazí detailní nastavení

4. Po uložení preference:
   - Zkontrolujte localStorage klíč: `gurmao-cookie-consent`
   - Klikněte na "Nastavení cookies" v patičce - mělo by znovu otevřít banner

## ⚖️ Právní compliance

Web nyní splňuje:

✅ **Zákon o ochraně osobních údajů (GDPR)**
- Informační povinnost (čl. 13 GDPR)
- Právní základ zpracování
- Práva subjektů údajů
- Informace o zpracovatelích

✅ **Cookie zákon (ePrivacy Directive)**
- Cookie consent banner
- Rozdělení na nezbytné a analytické cookies
- Možnost odvolání souhlasu

✅ **Obchodní zákoník / Živnostenský zákon**
- Identifikace provozovatele
- IČO, DIČ, registrace
- Kontaktní údaje

## 🚨 Dodatečná doporučení

1. **Zálohování dat**: Pravidelně zálohujte uživatelská data z Supabase
2. **HTTPS**: Používejte vždy HTTPS (pravděpodobně už máte přes hosting)
3. **Smlouvy se zpracovateli**: Ověřte, že máte DPA (Data Processing Agreement) se Supabase
4. **Oznámení ÚOOÚ**: Pokud zpracováváte citlivé údaje ve velkém měřítku, zvažte registraci

## 📞 V případě kontroly

Pokud obdržíte dotaz od ÚOOÚ nebo České obchodní inspekce:

1. Nepanikařte - máte dokumentaci na legal.html
2. Odpovězte do 30 dnů
3. Poskytněte odkaz na právní stránku
4. Připravte si přehled zpracovávaných údajů (je na legal.html)
5. V případě potřeby konzultujte s právníkem

## 📝 Poznámky

- Tyto dokumenty jsou základní GDPR compliance
- Pro specifické situace konzultujte s právníkem
- Při změně zpracování údajů aktualizujte legal.html
- Archivujte staré verze podmínek (min. 3 roky)

---

**Vytvořeno:** 7. ledna 2025  
**Autor:** GitHub Copilot  
**Pro:** GURMAO.cz
