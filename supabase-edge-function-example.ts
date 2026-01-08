// Supabase Edge Function pro odesílání email notifikací
// Umístění: supabase/functions/send-contact-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resend API (https://resend.com)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = 'info@gurmao.cz'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
}

serve(async (req) => {
  try {
    // Parse webhook payload
    const payload = await req.json()
    const record = payload.record as ContactMessage

    // Odeslání emailu přes Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GURMAO.cz <noreply@gurmao.cz>',
        to: [ADMIN_EMAIL],
        reply_to: record.email,
        subject: `Nová zpráva z kontaktního formuláře: ${record.subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0b0b0d; color: #fff; padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #d4af37;">GUR<span style="color: #d4af37;">M</span>AO.cz</h1>
              <p style="margin: 5px 0 0 0; color: #999;">Nová kontaktní zpráva</p>
            </div>
            
            <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase;">Od:</p>
                <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>${record.name}</strong></p>
                
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase;">Email:</p>
                <p style="margin: 0 0 15px 0;"><a href="mailto:${record.email}" style="color: #d4af37;">${record.email}</a></p>
                
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase;">Předmět:</p>
                <p style="margin: 0 0 15px 0;"><strong>${record.subject}</strong></p>
                
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase;">Zpráva:</p>
                <p style="margin: 0; white-space: pre-wrap;">${record.message}</p>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 12px;">
                Odesláno ${new Date(record.created_at).toLocaleString('cs-CZ')}
              </p>
              
              <p style="text-align: center;">
                <a href="https://txfuxrezyrgybjvjnhom.supabase.co/project/default/editor" 
                   style="display: inline-block; background: #d4af37; color: #0b0b0d; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Otevřít v Supabase
                </a>
              </p>
            </div>
          </div>
        `
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    // Mark message as notified (volitelné - přidej sloupec 'notified' do tabulky)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', record.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
