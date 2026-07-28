// Auth Guard – ověřuje skutečnou Supabase relaci místo zastaralého localStorage.
(async function authGuard() {
  try {
    const { supabase } = await import('./supabase-client.js');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const returnUrl = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem('gurmao_return_url', returnUrl);
      window.location.replace('login.html');
      return;
    }

    // Zachovat pouze kompatibilní pomocnou informaci; zdrojem pravdy je Supabase.
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
