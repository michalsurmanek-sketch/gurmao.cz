// Admin Guard - Protect admin routes
// Only allows users with admin role to access

(async function adminGuard() {
  // First check if user is logged in
  const localUser = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (!localUser || !localUser.loggedIn) {
    window.location.href = 'login.html';
    return;
  }

  // Check for admin access
  let isAdmin = false;
  
  // Primary check: email match in localStorage
  if (localUser.email === 'michalsurmanek@seznam.cz') {
    isAdmin = true;
  }
  
  // Secondary check: Supabase user metadata (if available)
  if (!isAdmin) {
    try {
      if (window.supabase) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && user) {
          if (user.user_metadata?.role === 'admin' || user.email === 'michalsurmanek@seznam.cz') {
            isAdmin = true;
          }
        }
      }
    } catch (error) {
      console.error('Supabase check failed:', error);
      // Continue to final check
    }
  }
  
  // Final check: deny if not admin
  if (!isAdmin) {
    // Not an admin - show error and redirect
    if (window.toast) {
      window.toast.show('❌ Nemáš oprávnění k admin panelu', 'error');
    }
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
})();
