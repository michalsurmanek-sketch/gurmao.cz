// Admin Guard - Protect admin routes
// Only allows users with admin role to access

(function adminGuard() {
  // First check if user is logged in
  const localUser = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (!localUser || !localUser.loggedIn) {
    window.location.href = 'login.html';
    return;
  }

  // Primary check: email match in localStorage
  // If email matches, allow access immediately
  if (localUser.email === 'michalsurmanek@seznam.cz') {
    console.log('Admin access granted via email match');
    return; // Allow access
  }
  
  // If not admin email, block access
  console.warn('Access denied: not an admin email');
  
  if (window.toast) {
    window.toast.show('❌ Nemáš oprávnění k admin panelu', 'error');
  }
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
})();
