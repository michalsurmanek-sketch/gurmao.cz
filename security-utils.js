export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

export function safeWebUrl(value, fallback = '#') {
  try {
    const url = new URL(String(value), window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function safeImageUrl(value, fallback) {
  const url = safeWebUrl(value, fallback);
  return url === '#' ? fallback : url;
}

export function safePhoneUrl(value) {
  const phone = String(value ?? '').replace(/[^+0-9(). -]/g, '');
  return phone ? `tel:${phone}` : '#';
}

export function safeEmailUrl(value) {
  const email = String(value ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : '#';
}
