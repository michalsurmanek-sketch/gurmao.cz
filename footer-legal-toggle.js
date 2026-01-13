// Footer legal links toggle
document.addEventListener('DOMContentLoaded', () => {
  const legalToggle = document.getElementById('legalToggle');
  const legalLinks = document.getElementById('legalLinks');
  const legalToggleMobile = document.getElementById('legalToggleMobile');
  const legalLinksMobile = document.getElementById('legalLinksMobile');

  // Desktop toggle
  if (legalToggle && legalLinks) {
    legalToggle.addEventListener('click', () => {
      legalLinks.classList.toggle('hidden');
      legalLinks.classList.toggle('flex');
      
      // Update arrow
      if (legalLinks.classList.contains('hidden')) {
        legalToggle.innerHTML = 'Právní informace ▼';
      } else {
        legalToggle.innerHTML = 'Právní informace ▲';
      }
    });
  }

  // Mobile toggle (pro mapu)
  if (legalToggleMobile && legalLinksMobile) {
    legalToggleMobile.addEventListener('click', () => {
      legalLinksMobile.classList.toggle('hidden');
      legalLinksMobile.classList.toggle('flex');
      
      // Update arrow
      if (legalLinksMobile.classList.contains('hidden')) {
        legalToggleMobile.innerHTML = 'Právní informace ▼';
      } else {
        legalToggleMobile.innerHTML = 'Právní informace ▲';
      }
    });
  }
});
