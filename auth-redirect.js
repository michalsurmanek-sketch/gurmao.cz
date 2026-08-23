// Authentication state redirects plus page-specific runtime routing.
import { onAuthStateChange } from './supabase-client.js';

const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY' && page !== 'reset-password.html') {
    location.replace('/reset-password.html');
  }
});

if (page === 'index.html') {
  void import('./homepage-runtime.js').catch(error => console.error('Homepage runtime failed:', error));
}

if (page === 'admin.html') {
  void import('./admin-dashboard-runtime.js').catch(error => console.error('Admin dashboard runtime failed:', error));
}
