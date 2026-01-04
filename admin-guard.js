// Admin Guard - Protect admin routes
// Only allows users with admin role to access

(async function adminGuard() {
  // First check if user is logged in
  const localUser = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (!localUser || !localUser.loggedIn) {
    window.location.href = 'login.html';
    return;
  }

  // Check if user has admin role in Supabase
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      window.location.href = 'login.html';
      return;
    }

    // Check user metadata for admin role
    const isAdmin = user.user_metadata?.role === 'admin' || user.email === 'admin@gurmao.cz';
    
    if (!isAdmin) {
      // Not an admin - show error and redirect
      if (window.toast) {
        window.toast.show('❌ Nemáš oprávnění k admin panelu', 'error');
      }
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  } catch (error) {
    console.error('Admin check failed:', error);
    window.location.href = 'index.html';
  }
})();
