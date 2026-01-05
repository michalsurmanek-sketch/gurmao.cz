// Admin Guard - Protect admin routes
// Only allows users with admin role to access

(function adminGuard() {
  console.log('🔒 Admin Guard: Starting check...');
  
  // First check if user is logged in
  const localUser = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  console.log('🔒 Admin Guard: User from localStorage:', localUser);
  
  if (!localUser || !localUser.loggedIn) {
    console.warn('🔒 Admin Guard: No user logged in');
    window.location.href = 'login.html';
    return;
  }

  console.log('🔒 Admin Guard: Checking email:', localUser.email);
  
  // Primary check: email match in localStorage
  // If email matches, allow access immediately
  if (localUser.email === 'michalsurmanek@seznam.cz') {
    console.log('✅ Admin Guard: Access granted for', localUser.email);
    return; // Allow access
  }
  
  // If not admin email, block access
  console.warn('❌ Admin Guard: Access denied for', localUser.email);
  
  if (window.toast) {
    window.toast.show('❌ Nemáš oprávnění k admin panelu', 'error');
  }
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
})();
