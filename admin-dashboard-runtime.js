import { supabase } from './supabase-client.js';

if (!/^admin(?:\.html)?$/i.test((location.pathname.split('/').pop() || '').replace(/^\//, ''))) {
  throw new Error('admin-dashboard-runtime loaded outside admin dashboard');
}

async function countAdminItems(table, statuses = null) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (Array.isArray(statuses) && statuses.length) query = query.in('candidate_status', statuses);
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

function actionCard({ href, icon, title, description, badgeId, accent = 'gold', external = false, tab = '' }) {
  const link = document.createElement('a');
  link.href = href;
  link.className = 'admin-quick-action';
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  if (tab) link.dataset.adminTab = tab;

  const iconElement = document.createElement('span');
  iconElement.className = 'admin-quick-action__icon';
  iconElement.textContent = icon;

  const content = document.createElement('span');
  content.className = 'admin-quick-action__content';
  const strong = document.createElement('strong');
  strong.textContent = title;
  const small = document.createElement('small');
  small.textContent = description;
  content.append(strong, small);

  link.append(iconElement, content);
  if (badgeId) {
    const badge = document.createElement('span');
    badge.className = 'admin-quick-action__badge';
    badge.id = badgeId;
    badge.textContent = '–';
    link.appendChild(badge);
  }
  const arrow = document.createElement('span');
  arrow.className = 'admin-quick-action__arrow';
  arrow.textContent = external ? '↗' : '→';
  link.appendChild(arrow);
  link.dataset.accent = accent;
  return link;
}

function addStyles() {
  if (document.getElementById('admin-quick-actions-style')) return;
  const style = document.createElement('style');
  style.id = 'admin-quick-actions-style';
  style.textContent = `
    .admin-quick-actions-wrap{margin:0 0 2rem;padding:1rem;border:1px solid rgba(255,255,255,.10);border-radius:1.25rem;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 18px 45px rgba(0,0,0,.20)}
    .admin-quick-actions-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-bottom:.9rem}.admin-quick-actions-head h2{font-size:1.25rem;margin:0;color:#fff}.admin-quick-actions-head p{margin:.2rem 0 0;color:rgba(255,255,255,.55);font-size:.82rem}
    .admin-quick-actions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.admin-quick-action{position:relative;display:flex;align-items:center;gap:.8rem;min-height:92px;padding:1rem;border:1px solid rgba(255,255,255,.16);border-radius:1rem;color:#fff;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;overflow:hidden}.admin-quick-action[data-accent="gold"]{background:linear-gradient(145deg,rgba(212,175,55,.13),rgba(255,255,255,.035))}.admin-quick-action[data-accent="green"]{background:linear-gradient(145deg,rgba(34,197,94,.12),rgba(255,255,255,.035))}.admin-quick-action[data-accent="blue"]{background:linear-gradient(145deg,rgba(59,130,246,.12),rgba(255,255,255,.035))}.admin-quick-action[data-accent="red"]{background:linear-gradient(145deg,rgba(239,68,68,.11),rgba(255,255,255,.035))}.admin-quick-action[data-accent="purple"]{background:linear-gradient(145deg,rgba(168,85,247,.12),rgba(255,255,255,.035))}.admin-quick-action:hover{transform:translateY(-2px);border-color:rgba(212,175,55,.75);box-shadow:0 14px 30px rgba(0,0,0,.28)}.admin-quick-action:focus-visible{outline:3px solid rgba(212,175,55,.45);outline-offset:2px}
    .admin-quick-action__icon{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:14px;background:rgba(0,0,0,.28);font-size:1.45rem}.admin-quick-action__content{display:flex;flex-direction:column;min-width:0;gap:.24rem}.admin-quick-action__content strong{font-size:.94rem;line-height:1.2}.admin-quick-action__content small{color:rgba(255,255,255,.58);font-size:.74rem;line-height:1.35}.admin-quick-action__badge{position:absolute;top:.6rem;right:.65rem;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:grid;place-items:center;background:#d4af37;color:#0b0b0d;font-size:.72rem;font-weight:800}.admin-quick-action__arrow{margin-left:auto;align-self:flex-end;color:#d4af37;font-size:1.15rem}
    @media(max-width:1023px){.admin-quick-actions-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:639px){.admin-quick-actions-grid{grid-template-columns:1fr}.admin-quick-action{min-height:78px;padding:.85rem}}
  `;
  document.head.appendChild(style);
}

async function updateBadges() {
  try {
    const [review, approved] = await Promise.all([
      countAdminItems('restaurant_import_candidates', ['new', 'probable_duplicate']),
      countAdminItems('restaurant_import_candidates', ['approved'])
    ]);
    const reviewBadge = document.getElementById('quickRestaurantImports');
    const approvedBadge = document.getElementById('quickApprovedImports');
    if (reviewBadge) reviewBadge.textContent = review.toLocaleString('cs-CZ');
    if (approvedBadge) approvedBadge.textContent = approved.toLocaleString('cs-CZ');
  } catch (error) {
    console.warn('Restaurant import counts unavailable:', error);
  }

  try {
    const { count, error } = await supabase.from('chef_import_candidates').select('id', { count: 'exact', head: true });
    if (error) throw error;
    const badge = document.getElementById('quickChefImports');
    if (badge) badge.textContent = Number(count || 0).toLocaleString('cs-CZ');
  } catch (error) {
    console.warn('Chef import count unavailable:', error);
  }
}

function init() {
  if (document.getElementById('adminQuickActions')) return;
  const tabs = document.querySelector('.tab-btn')?.parentElement;
  if (!tabs) return;
  addStyles();

  const section = document.createElement('section');
  section.id = 'adminQuickActions';
  section.className = 'admin-quick-actions-wrap';
  section.setAttribute('aria-label', 'Rychlé administrátorské akce');

  const head = document.createElement('div');
  head.className = 'admin-quick-actions-head';
  const copy = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = '⚡ Rychlé akce';
  const description = document.createElement('p');
  description.textContent = 'Schvalování, publikace a nejčastější správa bez hledání v záložkách.';
  copy.append(title, description);
  head.appendChild(copy);

  const grid = document.createElement('div');
  grid.className = 'admin-quick-actions-grid';
  const actions = [
    { href: 'admin-imports.html', icon: '📥', title: 'Schválit restaurace', description: 'Kontrola, úprava a publikování importovaných podniků', badgeId: 'quickRestaurantImports', accent: 'gold' },
    { href: 'admin-imports.html?status=approved', icon: '🚀', title: 'Publikovat restaurace', description: 'Schválené podniky čekající na zveřejnění', badgeId: 'quickApprovedImports', accent: 'red' },
    { href: 'admin-chef-imports.html', icon: '👨‍🍳', title: 'Schválit kuchaře', description: 'Kontrola a zveřejnění importovaných profilů kuchařů', badgeId: 'quickChefImports', accent: 'green' },
    { href: 'admin-menus.html', icon: '🍽️', title: 'Denní menu', description: 'Najít, ověřit a uložit webové nebo PDF menu restaurací', accent: 'blue' },
    { href: '#', icon: '➕', title: 'Přidat restauraci ručně', description: 'Přejde přímo na formulář nové restaurace', accent: 'purple', tab: 'add' },
    { href: 'admin-contact.html', icon: '📬', title: 'Zprávy a žádosti', description: 'Dotazy uživatelů, restaurací a partnerů', accent: 'blue' },
    { href: 'index.html', icon: '🌐', title: 'Zobrazit ostrý web', description: 'Otevře hlavní stránku Gurmao pro rychlou kontrolu', accent: 'neutral', external: true }
  ];
  actions.forEach(action => grid.appendChild(actionCard(action)));
  section.append(head, grid);
  tabs.insertAdjacentElement('beforebegin', section);

  section.querySelector('[data-admin-tab="add"]')?.addEventListener('click', event => {
    event.preventDefault();
    if (typeof window.switchTab === 'function') {
      window.switchTab('add');
      document.getElementById('content-add')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  void updateBadges();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
