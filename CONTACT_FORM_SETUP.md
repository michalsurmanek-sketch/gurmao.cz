# Nastavení kontaktního formuláře

## 1. Základní nastavení (Supabase databáze)

### Krok 1: Vytvoř tabulku v Supabase

1. Otevři **Supabase Dashboard** → tvůj projekt
2. Jdi do **SQL Editor**
3. Klikni **New query**
4. Zkopíruj a spusť SQL z `create-contact-messages-table.sql`
5. Klikni **Run**

✅ Hotovo! Formulář nyní ukládá zprávy do databáze.

---

## 2. Zobrazení zpráv v Admin panelu

Zprávy můžeš zobrazit v Supabase Dashboard:
- **Table Editor** → `contact_messages`
- Nebo přidej do admin.html sekci pro správu zpráv

---

## 3. Rozšířené nastavení - Email notifikace (volitelné)

### Možnost A: Supabase Database Webhooks

Nejjednodušší způsob - Supabase odešle webhook při nové zprávě:

1. V Supabase Dashboard → **Database** → **Webhooks**
2. **Create a new webhook**
3. Nastav:
   - Table: `contact_messages`
   - Events: `INSERT`
   - URL: Webhook endpoint (např. Make.com, Zapier, n8n)
4. Webhook může poslat email přes:
   - **Gmail API**
   - **SendGrid**
   - **Resend**
   - **Mailgun**

### Možnost B: Supabase Edge Function

Pro kompletní kontrolu vytvoř Edge Function:

```bash
# Instalace Supabase CLI (pokud nemáš)
npm install -g supabase

# Login do Supabase
supabase login

# Link projekt
supabase link --project-ref txfuxrezyrgybjvjnhom

# Vytvoř novou Edge Function
supabase functions new send-contact-email
```

Vytvořím soubor pro Edge Function níže.

### Možnost C: Make.com / Zapier (Bez kódu)

1. Vytvoř nový scénář v Make.com nebo Zap v Zapier
2. Trigger: Supabase → Watch New Rows
3. Action: Gmail/SendGrid → Send Email
4. Nastav template emailu

---

## 4. Doporučené služby pro odesílání emailů

### Resend (Doporučeno pro moderní projekty)
- ✅ Jednoduché API
- ✅ Generous free tier (100 emailů/den)
- ✅ Skvělá dokumentace
- Cena: Zdarma až 100 emailů/den, pak $20/měsíc

### SendGrid
- ✅ Zdarma 100 emailů/den
- ⚠️ Složitější nastavení
- Cena: Zdarma až 100 emailů/den

### Mailgun
- ✅ Spolehlivá služba
- Cena: $35/měsíc (nebo Pay as you go)

### Gmail API
- ✅ Zdarma
- ⚠️ Složitější OAuth nastavení
- ⚠️ Limity pro odesílání

---

## 5. Monitoring a Analytics

V `kontakt.html` je připravený Google Analytics tracking:

```javascript
gtag('event', 'contact_form_submission', {
  subject: data.subject
});
```

Aktivuje se automaticky, pokud máš GA nastavené v `ga.js`.

---

## Bezpečnost

✅ **RLS (Row Level Security)** je nastavena:
- Kdokoliv může vložit zprávu (INSERT)
- Číst/upravovat mohou jen admini
- Anonymní uživatelé nevidí zprávy

✅ **Rate limiting**: Doporuču přidat (např. přes Cloudflare nebo Supabase Edge Function)

✅ **Spam protection**: Zvažte přidat:
- Google reCAPTCHA v3
- Honeypot pole
- Email verification

---

## Testování

1. Otevři `kontakt.html`
2. Vyplň formulář
3. Zkontroluj v Supabase Dashboard → Table Editor → `contact_messages`
4. Měla by se objevit nová zpráva se statusem `new`

---

## Troubleshooting

### "Error submitting contact form"
- Zkontroluj, že SQL skript byl spuštěn
- Ověř RLS policies v Supabase
- Zkontroluj console v dev tools

### Zprávy se neuloží
- Zkontroluj Network tab v dev tools
- Ověř, že tabulka `contact_messages` existuje
- Zkontroluj INSERT policy

---

## Příští kroky

1. ✅ Vytvoř tabulku (`create-contact-messages-table.sql`)
2. 🔲 (Volitelné) Nastav email notifikace
3. 🔲 (Volitelné) Přidej sekci do admin.html pro správu zpráv
4. 🔲 (Volitelné) Přidaj spam protection
