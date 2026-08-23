// Auth Guard – chrání pouze stránky, které skutečně vyžadují přihlášení.
(async function authGuard() {
  const page = (window.location.pathname.split('/').pop() || '').toLowerCase();

  // Můj výběr podporuje hosta přes localStorage a přihlášeného uživatele přes Supabase.
  // Proto collections.html nesmí být přesměrována na login.
  if (page === 'collections.html') return;

  try {
    const { supabase } = await import('./supabase-client.js');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const returnUrl = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem('gurmao_return_url', returnUrl);
      window.location.replace('login.html');
      return;
    }

    // Zachovat pouze kompatibilní pomocnou informaci; zdrojem pravdy je Supabase Auth.
    localStorage.setItem('gurmao_user', JSON.stringify({
      loggedIn: true,
      id: user.id,
      email: user.email || ''
    }));
  } catch (error) {
    console.error('Ověření přihlášení se nezdařilo:', error);
    // Při dočasné technické chybě stránku nepřepisovat ani uživatele násilně nepřesměrovávat.
  }
})();
