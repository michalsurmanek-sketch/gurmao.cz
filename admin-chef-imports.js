import { supabase } from './supabase-client.js';

const PAGE_SIZE = 30;
const state = { page: 0, total: 0, candidates: new Map(), editing: null, publishing: null, loading: false };
const labels = { new: 'Nový', probable_duplicate: 'Možná duplicita', approved: 'Schválený', rejected: 'Odmítnutý', imported: 'Zveřejněný', invalid: 'Neplatný' };
const $ = (id) => document.getElementById(id);
const elements = {
  list: $('candidateList'), loading: $('loadingState'), empty: $('emptyState'), error: $('errorBanner'),
  pagination: $('pagination'), pageLabel: $('pageLabel'), previous: $('previousPage'), next: $('nextPage'),
  search: $('searchInput'), status: $('statusFilter'), refresh: $('refreshBtn'), logout: $('logoutBtn'),
  editDialog: $('editDialog'), editForm: $('editForm'), editName: $('editCandidateName'), name: $('nameInput'),
  vibe: $('vibeInput'), style: $('styleInput'), bio: $('bioInput'), image: $('imageInput'), instagram: $('instagramInput'),
  tiktok: $('tiktokInput'), facebook: $('facebookInput'), youtube: $('youtubeInput'), confirmEdit: $('confirmEdit'),
  publishDialog: $('publishDialog'), publishName: $('publishCandidateName'), duplicate: $('duplicateConfirmation'),
  forceDuplicate: $('forceDuplicateInput'), confirmPublish: $('confirmPublish')
};

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function safeUrl(value) {
  try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function cleanSearch(value) {
  return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}\s.'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
function score(candidate) { return Math.round((Number(candidate.confidence) || 0) * 100); }
function actions(candidate) {
  if (candidate.candidate_status === 'imported') return '';
  const edit = `<button class="btn btn-edit" data-action="edit" data-id="${escapeHtml(candidate.id)}">✏️ Upravit</button>`;
  if (candidate.candidate_status === 'approved') return `${edit}<button class="btn btn-success" data-action="publish" data-id="${escapeHtml(candidate.id)}">Zveřejnit</button><button class="btn btn-danger" data-action="reject" data-id="${escapeHtml(candidate.id)}">Odmítnout</button>`;
  if (['rejected', 'invalid'].includes(candidate.candidate_status)) return edit;
  return `${edit}<button class="btn btn-primary" data-action="approve" data-id="${escapeHtml(candidate.id)}">Schválit</button><button class="btn btn-danger" data-action="reject" data-id="${escapeHtml(candidate.id)}">Odmítnout</button>`;
}
function render(candidate) {
  const source = safeUrl(candidate.source_url);
  const restaurant = candidate.restaurants || {};
  return `<article class="candidate-card">
    <div class="quality-score" style="--score:${score(candidate)};--score-color:#d4af37"><div><strong>${score(candidate)}</strong><small>důvěra</small></div></div>
    <div><div class="candidate-title-row"><h2>${escapeHtml(candidate.name)}</h2><span class="status-badge status-${escapeHtml(candidate.candidate_status)}">${escapeHtml(labels[candidate.candidate_status] || candidate.candidate_status)}</span></div>
      <div class="candidate-meta"><span>${escapeHtml(restaurant.name || 'Neznámá restaurace')}</span><span>${escapeHtml(restaurant.city || '')}</span><span>${escapeHtml(candidate.signature_style || 'role neuvedena')}</span></div>
      <p class="candidate-address">${escapeHtml(candidate.bio || 'Bio zatím není ve zdroji uvedeno.')}</p>
      <div class="candidate-links">${source ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener">Oficiální zdroj ↗</a>` : ''}</div>
      ${candidate.evidence ? `<div class="info-banner">${escapeHtml(candidate.evidence)}</div>` : ''}
      ${candidate.duplicate_chef_id ? `<div class="duplicate-warning">⚠️ Možná duplicita profilu <code>${escapeHtml(candidate.duplicate_chef_id)}</code></div>` : ''}
    </div><div class="candidate-actions">${actions(candidate)}</div></article>`;
}
function setLoading(value) { state.loading = value; elements.loading.classList.toggle('hidden', !value); elements.refresh.disabled = value; }
function setError(message = '') { elements.error.textContent = message; elements.error.classList.toggle('hidden', !message); }

async function countStatus(status) {
  let query = supabase.from('chef_import_candidates').select('id', { count: 'exact', head: true });
  if (status) query = query.eq('candidate_status', status);
  const { count, error } = await query; if (error) throw error; return count || 0;
}
async function loadStats() {
  const values = await Promise.all([countStatus(), countStatus('new'), countStatus('probable_duplicate'), countStatus('approved'), countStatus('imported')]);
  ['statTotal', 'statNew', 'statDuplicates', 'statApproved', 'statImported'].forEach((id, index) => $(id).textContent = values[index].toLocaleString('cs-CZ'));
}
async function loadCandidates() {
  if (state.loading) return;
  setLoading(true); setError(); elements.list.innerHTML = ''; elements.empty.classList.add('hidden');
  try {
    const from = state.page * PAGE_SIZE;
    let query = supabase.from('chef_import_candidates').select('*,restaurants(name,city)', { count: 'exact' }).order('confidence', { ascending: false }).order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    const status = elements.status.value;
    if (status === 'review') query = query.in('candidate_status', ['new', 'probable_duplicate', 'approved']);
    else if (status !== 'all') query = query.eq('candidate_status', status);
    const search = cleanSearch(elements.search.value); if (search) query = query.ilike('name', `%${search}%`);
    const { data, count, error } = await query; if (error) throw error;
    state.total = count || 0; state.candidates = new Map((data || []).map((item) => [item.id, item]));
    elements.list.innerHTML = (data || []).map(render).join(''); elements.empty.classList.toggle('hidden', Boolean(data?.length));
    const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE)); elements.pageLabel.textContent = `Strana ${state.page + 1} z ${pages}`;
    elements.previous.disabled = state.page === 0; elements.next.disabled = state.page + 1 >= pages; elements.pagination.classList.toggle('hidden', state.total <= PAGE_SIZE);
  } catch (error) { console.error(error); setError('Kandidáty nelze načíst. Nejdřív spusť databázovou migraci pro import kuchařů.'); }
  finally { setLoading(false); }
}
async function review(candidate, status) {
  const notes = status === 'rejected' ? window.prompt('Proč kandidáta odmítáš?') || 'Odmítnuto administrátorem.' : null;
  const { error } = await supabase.rpc('review_chef_import_candidate', { p_candidate_id: candidate.id, p_status: status, p_notes: notes });
  if (error) throw error; await Promise.all([loadCandidates(), loadStats()]);
}
function value(value) { return value == null ? '' : String(value); }
function openEdit(candidate) {
  state.editing = candidate; elements.editForm.reset(); elements.editName.textContent = candidate.name;
  elements.name.value = value(candidate.name); elements.vibe.value = value(candidate.vibe); elements.style.value = value(candidate.signature_style);
  elements.bio.value = value(candidate.bio); elements.image.value = value(candidate.image_url); elements.instagram.value = value(candidate.instagram_url);
  elements.tiktok.value = value(candidate.tiktok_url); elements.facebook.value = value(candidate.facebook_url); elements.youtube.value = value(candidate.youtube_url);
  elements.editDialog.showModal();
}
async function saveEdit(event) {
  event.preventDefault(); const candidate = state.editing; if (!candidate) return; elements.confirmEdit.disabled = true;
  const optional = (element) => element.value.trim() || null;
  const { error } = await supabase.rpc('update_chef_import_candidate', {
    p_candidate_id: candidate.id, p_name: elements.name.value.trim(), p_bio: optional(elements.bio), p_vibe: optional(elements.vibe),
    p_signature_style: optional(elements.style), p_image_url: optional(elements.image), p_instagram_url: optional(elements.instagram),
    p_tiktok_url: optional(elements.tiktok), p_facebook_url: optional(elements.facebook), p_youtube_url: optional(elements.youtube)
  });
  elements.confirmEdit.disabled = false; if (error) throw error; elements.editDialog.close(); state.editing = null; await Promise.all([loadCandidates(), loadStats()]);
}
function openPublish(candidate) {
  state.publishing = candidate; elements.publishName.textContent = `${candidate.name} · ${candidate.restaurants?.name || ''}`;
  elements.forceDuplicate.checked = false; elements.duplicate.classList.toggle('hidden', !candidate.duplicate_chef_id); elements.publishDialog.showModal();
}
async function publish() {
  const candidate = state.publishing; if (!candidate) return;
  if (candidate.duplicate_chef_id && !elements.forceDuplicate.checked) return window.toast?.show('Potvrď kontrolu možné duplicity.', 'error');
  elements.confirmPublish.disabled = true;
  const { error } = await supabase.rpc('publish_chef_import_candidate', { p_candidate_id: candidate.id, p_force_duplicate: elements.forceDuplicate.checked });
  elements.confirmPublish.disabled = false; if (error) throw error; elements.publishDialog.close(); state.publishing = null; await Promise.all([loadCandidates(), loadStats()]);
}

elements.list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action][data-id]'); if (!button || state.loading) return;
  const candidate = state.candidates.get(button.dataset.id); if (!candidate) return;
  try { if (button.dataset.action === 'edit') openEdit(candidate); if (button.dataset.action === 'approve') await review(candidate, 'approved'); if (button.dataset.action === 'reject') await review(candidate, 'rejected'); if (button.dataset.action === 'publish') openPublish(candidate); }
  catch (error) { console.error(error); window.toast?.show(`Akce se nezdařila: ${error.message}`, 'error'); }
});
let timer; elements.search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.page = 0; loadCandidates(); }, 350); });
elements.status.addEventListener('change', () => { state.page = 0; loadCandidates(); });
elements.previous.addEventListener('click', () => { if (state.page > 0) { state.page -= 1; loadCandidates(); } });
elements.next.addEventListener('click', () => { if ((state.page + 1) * PAGE_SIZE < state.total) { state.page += 1; loadCandidates(); } });
elements.refresh.addEventListener('click', () => Promise.all([loadCandidates(), loadStats()]));
elements.logout.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; });
elements.editForm.addEventListener('submit', (event) => saveEdit(event).catch((error) => window.toast?.show(error.message, 'error')));
$('cancelEdit').addEventListener('click', () => elements.editDialog.close()); $('cancelPublish').addEventListener('click', () => elements.publishDialog.close());
elements.confirmPublish.addEventListener('click', () => publish().catch((error) => window.toast?.show(error.message, 'error')));
Promise.all([loadStats(), loadCandidates()]).catch((error) => { console.error(error); setError('Importy kuchařů nelze spustit bez databázové migrace.'); });
