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

  // Footer search functionality
  const footerSearchBox = document.getElementById('footerSearchBox');
  const footerSearchToggle = document.getElementById('footerSearchToggle');
  const footerSearchInput = document.getElementById('footerSearchInput');
  const footerSearchResults = document.getElementById('footerSearchResults');

  if (footerSearchToggle && footerSearchBox && footerSearchInput && footerSearchResults) {
    footerSearchToggle.addEventListener('click', () => {
      const isExpanded = footerSearchBox.classList.contains('w-64');
      
      if (isExpanded) {
        footerSearchBox.classList.remove('w-64');
        footerSearchBox.classList.add('w-9');
        footerSearchInput.classList.add('opacity-0', 'w-0');
        footerSearchInput.classList.remove('opacity-100', 'w-full');
        footerSearchResults.classList.add('hidden');
        footerSearchInput.value = '';
      } else {
        footerSearchBox.classList.remove('w-9');
        footerSearchBox.classList.add('w-64');
        footerSearchInput.classList.remove('opacity-0', 'w-0');
        footerSearchInput.classList.add('opacity-100', 'w-full');
        setTimeout(() => footerSearchInput.focus(), 100);
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!footerSearchBox.contains(e.target) && !footerSearchResults.contains(e.target)) {
        footerSearchBox.classList.remove('w-64');
        footerSearchBox.classList.add('w-9');
        footerSearchInput.classList.add('opacity-0', 'w-0');
        footerSearchInput.classList.remove('opacity-100', 'w-full');
        footerSearchResults.classList.add('hidden');
        footerSearchInput.value = '';
      }
    });
  }
});
