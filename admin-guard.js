import { supabase } from './supabase-client.js';

const loginUrl = new URL('login.html', window.location.href);
loginUrl.searchParams.set('return', `${window.location.pathname}${window.location.search}`);

try {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.replace(loginUrl.href);
  } else if (user.app_metadata?.role !== 'admin') {
    window.location.replace(new URL('index.html', window.location.href).href);
  } else {
    document.documentElement.classList.add('admin-authorized');
  }
} catch (error) {
  console.error('Admin authorization failed:', error);
  window.location.replace(loginUrl.href);
}
