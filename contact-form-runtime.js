import { supabase } from './supabase-client.js';

if (location.pathname.endsWith('/kontakt.html')) {
  // Remove an obsolete claim from the older static FAQ. The current recommendation
  // engine uses the user's explicit form choices and current restaurant data; it does
  // not inspect private saved restaurants or infer a profile from user ratings.
  document.querySelectorAll('p,div').forEach(element => {
    const value = String(element.textContent || '').trim();
    if (value.includes('AI analyzuje vaše uložené restaurace') || value.includes('analyzuje vaše uložené restaurace a hodnocení')) {
      element.textContent = 'Doporučení vychází z toho, co do formuláře sami zadáte, a z aktuálních veřejných dat restaurací v GURMAO. Uložené restaurace ani soukromá data účtu se k vytvoření doporučení nepoužívají.';
    }
  });

  const form = document.getElementById('contactForm');
  if (form) {
    const startedAt = Date.now();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent || 'Odeslat zprávu';

    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.style.position = 'absolute';
    honeypot.style.left = '-10000px';
    honeypot.style.width = '1px';
    honeypot.style.height = '1px';
    honeypot.style.opacity = '0';
    form.appendChild(honeypot);

    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.className = 'text-sm text-center min-h-5';
    submitButton?.insertAdjacentElement('afterend', status);

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.style.color = isError ? '#ff9a87' : '#86e49b';
    }

    document.addEventListener('submit', async event => {
      if (event.target !== form) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        website: formData.get('website'),
        startedAt
      };

      if (!payload.subject) {
        setStatus('Vyberte předmět zprávy.', true);
        document.getElementById('subjectButton')?.focus();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Odesílám…';
      }
      setStatus('');

      try {
        const { data, error } = await supabase.functions.invoke('submit-contact', { body: payload });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.message || 'Zprávu se nepodařilo odeslat.');

        form.reset();
        const subjectText = document.getElementById('subjectText');
        if (subjectText) {
          subjectText.textContent = 'Vyberte předmět...';
          subjectText.classList.add('text-white/40');
        }
        const subjectValue = document.getElementById('subjectValue');
        if (subjectValue) subjectValue.value = '';
        setStatus('✓ Zpráva byla odeslána. Odpovíme co nejdříve.');
      } catch (error) {
        console.error('Protected contact form failed:', error);
        const message = error?.context?.body?.message || error?.message || '';
        setStatus(message && !/FunctionsHttpError/i.test(message)
          ? message
          : 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.', true);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    }, true);
  }
}