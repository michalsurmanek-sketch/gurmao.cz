import { supabase, getCurrentUser, updatePassword } from './supabase-client.js';

if (!location.pathname.endsWith('/profile.html')) throw new Error('profile-page loaded outside profile');

const $ = id => document.getElementById(id);
let currentUser = null;

function notify(message, type = 'info') {
  if (window.toast?.show) window.toast.show(message, type);
  else {
    const status = $('profileStatus');
    if (status) status.textContent = message;
  }
}

function normalizeLine(value, max) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeBio(value) {
  return String(value || '').normalize('NFKC').replace(/\r\n/g, '\n').trim().slice(0, 1000);
}

async function loadProfile() {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      location.replace('login.html?next=profile.html');
      return;
    }

    $('userEmail').textContent = currentUser.email || 'E-mail není dostupný';
    $('displayName').value = currentUser.user_metadata?.display_name || currentUser.user_metadata?.name || '';
    $('bio').value = currentUser.user_metadata?.bio || '';

    const verified = Boolean(currentUser.email_confirmed_at || currentUser.confirmed_at);
    const badge = $('verificationBadge');
    badge.textContent = verified ? 'E-mail ověřen' : 'E-mail neověřen';
    badge.classList.toggle('verified', verified);
    badge.classList.toggle('unverified', !verified);
  } catch (error) {
    console.error('Profile load failed:', error);
    notify('Profil se nepodařilo načíst.', 'error');
  }
}

$('profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser) return;

  const displayName = normalizeLine($('displayName').value, 80);
  const bio = normalizeBio($('bio').value);
  if (displayName.length > 0 && displayName.length < 2) {
    notify('Jméno musí mít alespoň 2 znaky.', 'error');
    return;
  }

  const button = $('saveProfileBtn');
  button.disabled = true;
  button.textContent = 'Ukládám…';
  try {
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName, bio } });
    if (error) throw error;
    currentUser = data.user || currentUser;
    notify('Profil byl aktualizován.', 'success');
  } catch (error) {
    console.error('Profile update failed:', error);
    notify('Profil se nepodařilo uložit.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Uložit změny';
  }
});

$('passwordForm').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('newPassword').value;
  const confirmation = $('confirmPassword').value;
  if (password !== confirmation) {
    notify('Hesla se neshodují.', 'error');
    return;
  }
  if (password.length < 10) {
    notify('Nové heslo musí mít alespoň 10 znaků.', 'error');
    return;
  }

  const button = $('changePasswordBtn');
  button.disabled = true;
  button.textContent = 'Měním…';
  try {
    await updatePassword(password);
    $('passwordForm').reset();
    notify('Heslo bylo změněno.', 'success');
  } catch (error) {
    console.error('Password update failed:', error);
    notify('Heslo se nepodařilo změnit. Může být nutné se znovu přihlásit.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Změnit heslo';
  }
});

$('deleteAccountBtn').addEventListener('click', async () => {
  if (!currentUser) return;
  const confirmation = window.prompt('Smazání účtu je nevratné. Pro potvrzení napište přesně: SMAZAT');
  if (confirmation !== 'SMAZAT') return;

  const button = $('deleteAccountBtn');
  button.disabled = true;
  button.textContent = 'Mažu účet…';
  try {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: { confirmation: 'DELETE' }
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'Account deletion failed');

    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('gurmao_') || key.startsWith('gurmao-')) localStorage.removeItem(key);
    }
    location.replace('index.html?account=deleted');
  } catch (error) {
    console.error('Account deletion failed:', error);
    notify('Účet se nepodařilo smazat. Zkuste se znovu přihlásit a akci opakovat.', 'error');
    button.disabled = false;
    button.textContent = 'Smazat účet';
  }
});

loadProfile();
