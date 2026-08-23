import { supabase } from './supabase-client.js';

if (!location.pathname.endsWith('/feed.html')) throw new Error('feed-page loaded outside feed');

const PAGE_SIZE = 12;
const FALLBACK_IMAGE = 'images/gurmao-hero-restaurant.jpg';
const grid = document.getElementById('feedGrid');
const count = document.getElementById('feedCount');
const loadMoreButton = document.getElementById('loadMoreFeed');
const empty = document.getElementById('feedEmpty');
const errorBox = document.getElementById('feedError');
const vibeFilter = document.getElementById('feedVibeFilter');
const searchInput = document.getElementById('feedSearch');

let rows = [];
let page = 0;
let total = 0;
let loading = false;
let saved = new Set();

function text(value) {
  return String(value ?? '').trim();
}

function safeImage(value) {
  try {
    const url = new URL(text(value), location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function ratingOf(row) {
  const value = Number(row.google_rating ?? row.rating ?? row.average_rating);
  return Number.isFinite(value) && value > 0 && value <= 5 ? value : null;
}

function restaurantKey(row) {
  return text(row.slug || row.id);
}

function detailUrl(row) {
  const key = restaurantKey(row);
  return key ? `restaurant.html?slug=${encodeURIComponent(key)}` : 'restaurace.html';
}

function visibleRows() {
  const q = text(searchInput?.value).normalize('NFKC').toLocaleLowerCase('cs-CZ');
  const vibe = text(vibeFilter?.value).toLocaleLowerCase('cs-CZ');
  return rows.filter(row => {
    if (vibe && text(row.vibe).toLocaleLowerCase('cs-CZ').includes(vibe) === false) return false;
    if (!q) return true;
    return [row.name, row.city, row.cuisine, row.cuisine_type, row.tag, row.vibe]
      .some(value => text(value).normalize('NFKC').toLocaleLowerCase('cs-CZ').includes(q));
  });
}

function iconButton(label, content) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'feed-action';
  button.setAttribute('aria-label', label);
  button.textContent = content;
  return button;
}

function buildCard(row) {
  const key = restaurantKey(row);
  const article = document.createElement('article');
  article.className = 'feed-card';

  const imageLink = document.createElement('a');
  imageLink.className = 'feed-image-wrap';
  imageLink.href = detailUrl(row);
  imageLink.setAttribute('aria-label', `Zobrazit ${text(row.name) || 'restauraci'}`);

  const image = document.createElement('img');
  image.className = 'feed-image';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.src = safeImage(row.image_url || row.image || row.photo_url || row.cover_image);
  image.alt = text(row.name) || 'Restaurace';
  image.addEventListener('error', () => {
    image.onerror = null;
    image.src = FALLBACK_IMAGE;
  }, { once: true });
  imageLink.appendChild(image);

  if (text(row.vibe)) {
    const vibe = document.createElement('span');
    vibe.className = 'feed-vibe';
    vibe.textContent = text(row.vibe);
    imageLink.appendChild(vibe);
  }

  const actions = document.createElement('div');
  actions.className = 'feed-actions';

  const saveButton = iconButton('Uložit restauraci', saved.has(key) ? '♥' : '♡');
  saveButton.classList.toggle('is-saved', saved.has(key));
  saveButton.setAttribute('aria-pressed', String(saved.has(key)));
  saveButton.addEventListener('click', async () => {
    if (!key || !window.GurmaoCollections || saveButton.disabled) return;
    saveButton.disabled = true;
    try {
      const result = await window.GurmaoCollections.toggle(key);
      result.saved ? saved.add(key) : saved.delete(key);
      saveButton.textContent = result.saved ? '♥' : '♡';
      saveButton.classList.toggle('is-saved', result.saved);
      saveButton.setAttribute('aria-pressed', String(result.saved));
      window.toast?.show(result.saved ? 'Přidáno do výběru.' : 'Odebráno z výběru.', 'success');
    } catch (error) {
      console.error('Feed save failed:', error);
      window.toast?.show('Uložení se nepodařilo.', 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  const shareButton = iconButton('Sdílet restauraci', '↗');
  shareButton.addEventListener('click', async () => {
    const url = new URL(detailUrl(row), location.href).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: text(row.name) || 'GURMAO', url });
      } else {
        await navigator.clipboard.writeText(url);
        window.toast?.show('Odkaz byl zkopírován.', 'success');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('Feed share failed:', error);
    }
  });

  actions.append(saveButton, shareButton);
  imageLink.appendChild(actions);

  const body = document.createElement('div');
  body.className = 'feed-card-body';

  const title = document.createElement('a');
  title.className = 'feed-title';
  title.href = detailUrl(row);
  title.textContent = text(row.name) || 'Restaurace';

  const meta = document.createElement('div');
  meta.className = 'feed-meta';
  const metaParts = [text(row.city), text(row.cuisine || row.cuisine_type || row.tag)].filter(Boolean);
  meta.textContent = metaParts.join(' · ') || 'Česká republika';

  body.append(title, meta);

  const rating = ratingOf(row);
  if (rating !== null) {
    const ratingNode = document.createElement('div');
    ratingNode.className = 'feed-rating';
    const reviews = Number(row.google_review_count ?? row.review_count ?? 0);
    ratingNode.textContent = reviews > 0 ? `★ ${rating.toFixed(1)} · ${reviews.toLocaleString('cs-CZ')} hodnocení` : `★ ${rating.toFixed(1)}`;
    body.appendChild(ratingNode);
  }

  const description = text(row.short_description || row.description);
  if (description) {
    const paragraph = document.createElement('p');
    paragraph.className = 'feed-description';
    paragraph.textContent = description.slice(0, 180);
    body.appendChild(paragraph);
  }

  const detail = document.createElement('a');
  detail.href = detailUrl(row);
  detail.className = 'feed-detail-link';
  detail.textContent = 'Zobrazit detail →';
  body.appendChild(detail);

  article.append(imageLink, body);
  return article;
}

function render() {
  const visible = visibleRows();
  grid.replaceChildren(...visible.map(buildCard));
  empty.hidden = visible.length > 0;
  count.textContent = total > 0
    ? `Načteno ${rows.length.toLocaleString('cs-CZ')} z ${total.toLocaleString('cs-CZ')} restaurací`
    : `${rows.length.toLocaleString('cs-CZ')} restaurací`;
  loadMoreButton.hidden = rows.length >= total || total === 0;
}

async function loadPage() {
  if (loading) return;
  loading = true;
  errorBox.hidden = true;
  loadMoreButton.disabled = true;
  loadMoreButton.textContent = 'Načítám…';

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  try {
    const { data, error, count: exactCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact' })
      .not('name', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const next = Array.isArray(data) ? data.filter(row => restaurantKey(row)) : [];
    const existing = new Set(rows.map(restaurantKey));
    rows.push(...next.filter(row => !existing.has(restaurantKey(row))));
    total = Number(exactCount) || rows.length;
    page += 1;
    render();
  } catch (error) {
    console.error('Feed load failed:', error);
    errorBox.hidden = false;
    errorBox.textContent = 'Restaurace se nepodařilo načíst. Zkuste to znovu.';
  } finally {
    loading = false;
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = 'Načíst další';
  }
}

async function init() {
  try {
    if (window.GurmaoCollections?.getSaved) saved = await window.GurmaoCollections.getSaved();
  } catch (error) {
    console.warn('Feed saved state unavailable:', error);
  }

  const params = new URLSearchParams(location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q').slice(0, 80);
  if (vibeFilter && params.get('vibe')) vibeFilter.value = params.get('vibe').toLowerCase();

  searchInput?.addEventListener('input', render);
  vibeFilter?.addEventListener('change', render);
  loadMoreButton?.addEventListener('click', loadPage);
  await loadPage();
}

init();
