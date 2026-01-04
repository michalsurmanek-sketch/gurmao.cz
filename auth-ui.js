// User Authentication UI Handler
// Displays logged in user menu and logout button

(function initAuthUI() {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (user && user.loggedIn) {
    // Show user menu
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const userMenuMobile = document.getElementById('userMenuMobile');
    const loginLinkDesktop = document.getElementById('loginLinkDesktop');
    const loginLinkMobile = document.getElementById('loginLinkMobile');
    
    if (userMenuDesktop) userMenuDesktop.classList.remove('hidden');
    if (userMenuMobile) userMenuMobile.classList.remove('hidden');
    if (loginLinkDesktop) loginLinkDesktop.classList.add('hidden');
    if (loginLinkMobile) loginLinkMobile.classList.add('hidden');
    
    // Display user name
    const userName = user.name || user.email.split('@')[0];
    const userNameDesktop = document.getElementById('userNameDesktop');
    const userNameMobile = document.getElementById('userNameMobile');
    
    if (userNameDesktop) userNameDesktop.textContent = userName;
    if (userNameMobile) userNameMobile.textContent = `Přihlášen: ${userName}`;
    
    // Desktop dropdown toggle
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userDropdownBtn && userDropdownMenu) {
      userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownMenu.classList.toggle('hidden');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        if (!userDropdownMenu.classList.contains('hidden')) {
          userDropdownMenu.classList.add('hidden');
        }
      });
      
      // Prevent closing when clicking inside dropdown
      userDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Logout handlers
    const logoutBtns = document.querySelectorAll('[data-logout-btn]');
    
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.removeItem('gurmao_user');
        window.location.href = 'index.html';
      });
    });
  }
})();
