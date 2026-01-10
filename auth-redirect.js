// Auth redirect handler - determines where user lands after auth actions
// Must be loaded on EVERY page

import { onAuthStateChange } from './supabase-client.js';

onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // User clicked reset password link → redirect to reset form
    if (!window.location.pathname.endsWith('/reset-password.html')) {
      window.location.href = '/reset-password.html';
    }
  }

  if (event === 'SIGNED_IN') {
    // User logged in or registered → redirect to feed
    if (window.location.pathname.endsWith('/login.html')) {
      window.location.href = '/feed.html';
    }
  }

  if (event === 'USER_UPDATED') {
    // Email changed or other profile update
    // Stay on current page
  }
});
