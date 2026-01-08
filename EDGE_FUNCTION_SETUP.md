# Nastavení Email Notifikací přes Supabase Edge Function

## Prerekvizity
- Supabase CLI nainstalované
- Resend účet (nebo jiná email služba)

## Krok 1: Instalace Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Nebo přes npm
npm install -g supabase
```

## Krok 2: Registrace na Resend

1. Jdi na https://resend.com
2. Založ účet (100 emailů/den zdarma)
3. Vytvoř API klíč v Dashboard → API Keys
4. Zkopíruj klíč (začíná `re_...`)

## Krok 3: Nastavení Edge Function

```bash
# 1. Login do Supabase
supabase login

# 2. Link projekt
cd /workspaces/gurmao.cz
supabase link --project-ref txfuxrezyrgybjvjnhom

# 3. Vytvoř Edge Function
supabase functions new send-contact-email

# 4. Zkopíruj kód z supabase-edge-function-example.ts do:
# supabase/functions/send-contact-email/index.ts
```

## Krok 4: Nastavení secrets

```bash
# Nastav Resend API klíč
supabase secrets set RESEND_API_KEY=re_tvuj_api_klic_zde

# Secrets jsou automaticky dostupné jako Deno.env.get('RESEND_API_KEY')
```

## Krok 5: Deploy Edge Function

```bash
# Deploy funkce do produkce
supabase functions deploy send-contact-email

# Zkopíruj URL funkce (např. https://txfuxrezyrgybjvjnhom.supabase.co/functions/v1/send-contact-email)
```

## Krok 6: Nastav Database Webhook

1. Supabase Dashboard → **Database** → **Webhooks**
2. Klikni **Create a new webhook**
3. Nastav:
   - **Name:** `contact-email-notification`
   - **Table:** `contact_messages`
   - **Events:** ✅ Insert
   - **Type:** `HTTP Request`
   - **HTTP Request:**
     - Method: `POST`
     - URL: `https://txfuxrezyrgybjvjnhom.supabase.co/functions/v1/send-contact-email`
     - Headers:
       ```
       Authorization: Bearer YOUR_ANON_KEY
       Content-Type: application/json
       ```
4. Klikni **Confirm**

## Krok 7: Testování

1. Otevři `kontakt.html`
2. Odešli testovací zprávu
3. Zkontroluj:
   - Email dorazil na `info@gurmao.cz`
   - Zpráva je v Supabase tabulce
   - Logy v Supabase Functions

## Troubleshooting

### Email se neodeslal

```bash
# Zobraz logy Edge Function
supabase functions logs send-contact-email

# Zkontroluj, že secrets jsou nastavené
supabase secrets list
```

### Webhook nefunguje

1. Zkontroluj URL webhook v Supabase Dashboard
2. Ověř, že funkce je deployed: `supabase functions list`
3. Zkontroluj logy webhook v Dashboard → Webhooks → View logs

### Resend vrací chybu

- Ověř, že API klíč je správně
- Zkontroluj, že máš ověřenou doménu v Resend (pro produkci)
- V development můžeš používat `onboarding@resend.dev` jako sender

## Alternativní email služby

### SendGrid

```typescript
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!

await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: ADMIN_EMAIL }]
    }],
    from: { email: 'noreply@gurmao.cz' },
    subject: `Nová zpráva: ${record.subject}`,
    content: [{
      type: 'text/html',
      value: htmlContent
    }]
  })
})
```

### Mailgun

```typescript
const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY')!
const MAILGUN_DOMAIN = 'gurmao.cz'

const formData = new FormData()
formData.append('from', 'GURMAO <noreply@gurmao.cz>')
formData.append('to', ADMIN_EMAIL)
formData.append('subject', `Nová zpráva: ${record.subject}`)
formData.append('html', htmlContent)

await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
  },
  body: formData
})
```

## Ceny

- **Resend:** Zdarma 100 emailů/den, pak $20/měsíc (3000 emailů)
- **SendGrid:** Zdarma 100 emailů/den, pak $19.95/měsíc
- **Mailgun:** Pay as you go ($0.80 za 1000 emailů)

## Poznámky

- Edge Functions běží na Deno (ne Node.js)
- Free tier Supabase má limit 500,000 Edge Function invocations/měsíc
- Pro produkci doporuču nastavit rate limiting na Edge Function
