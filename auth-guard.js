// Auth Guard - Protect routes from unauthenticated users
// Redirects to login.html if user is not logged in

(function authGuard() {
  const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (!user || !user.loggedIn) {
    // Save current page to redirect back after login
    const returnUrl = window.location.pathname + window.location.search;
    localStorage.setItem('gurmao_return_url', returnUrl);
    
    // Redirect to login
    window.location.href = 'login.html';
  }
})();
