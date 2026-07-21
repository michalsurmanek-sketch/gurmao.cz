import { supabase } from './supabase-client.js';

const PAGE_SIZE = 30;
const STATUS_LABELS = Object.freeze({
  new: 'Nový',
  probable_duplicate: 'Možná duplicita',
  already_imported: 'Už existuje',
  approved: 'Schválený',
  rejected: 'Odmítnutý',
  imported: 'Zveřejněný',
  invalid: 'Neplatný'
});

const state = {
  page: 0,
  total: 0,
  candidates: new Map(),
  regions: new Map(),
  editing: null,
  publishing: null,
  loading: false
};

const elements = {
  candidateList: document.getElementById('candidateList'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  errorBanner: document.getElementById('errorBanner'),
  pagination: document.getElementById('pagination'),
  pageLabel: document.getElementById('pageLabel'),
  previousPage: document.getElementById('previousPage'),
  nextPage: document.getElementById('nextPage'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  regionFilter: document.getElementById('regionFilter'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  editDialog: document.getElementById('editDialog'),
  editForm: document.getElementById('editForm'),
  editCandidateName: document.getElementById('editCandidateName'),
  editNameInput: document.getElementById('editNameInput'),
  editCategoryInput: document.getElementById('editCategoryInput'),
  editCityInput: document.getElementById('editCityInput'),
  editAddressInput: document.getElementById('editAddressInput'),
  editPostalCodeInput: document.getElementById('editPostalCodeInput'),
  editPhoneInput: document.getElementById('editPhoneInput'),
  editWebsiteInput: document.getElementById('editWebsiteInput'),
  editLatitudeInput: document.getElementById('editLatitudeInput'),
  editLongitudeInput: document.getElementById('editLongitudeInput'),
  confirmEdit: document.getElementById('confirmEdit'),
  publishDialog: document.getElementById('publishDialog'),
  publishForm: document.getElementById('publishForm'),
  publishCandidateName: document.getElementById('publishCandidateName'),
  vibeInput: document.getElementById('vibeInput'),
  descriptionInput: document.getElementById('descriptionInput'),
  imageInput: document.getElementById('imageInput'),
  contentSuggestionStatus: document.getElementById('contentSuggestionStatus'),
  duplicateConfirmation: document.getElementById('duplicateConfirmation'),
  forceDuplicateInput: document.getElementById('forceDuplicateInput'),
  confirmPublish: document.getElementById('confirmPublish')
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function cleanSearch(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s.'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function scoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  return '#fb7185';
}

function coordinatesLink(candidate) {
  const latitude = Number(candidate.latitude);
  const longitude = Number(candidate.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=18/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`;
}

function actionButtons(candidate) {
  const editButton = ['imported', 'already_imported'].includes(candidate.candidate_status)
    ? ''
    : `<button class="btn btn-edit" data-action="edit" data-id="${escapeHtml(candidate.id)}" title="Upravit importované údaje">✏️ Upravit</button>`;
  if (['imported', 'already_imported', 'rejected', 'invalid'].includes(candidate.candidate_status)) {
    return editButton;
  }
  if (candidate.candidate_status === 'approved') {
    return `
      ${editButton}
      <button class="btn btn-success" data-action="publish" data-id="${escapeHtml(candidate.id)}">Zveřejnit</button>
      <button class="btn btn-danger" data-action="reject" data-id="${escapeHtml(candidate.id)}">Odmítnout</button>
    `;
  }
  return `
    ${editButton}
    <button class="btn btn-primary" data-action="approve" data-id="${escapeHtml(candidate.id)}">Schválit</button>
    <button class="btn btn-danger" data-action="reject" data-id="${escapeHtml(candidate.id)}">Odmítnout</button>
  `;
}

function renderCandidate(candidate) {
  const score = Math.max(0, Math.min(100, Number(candidate.quality_score) || 0));
  const website = safeUrl(candidate.website);
  const sourceUrl = safeUrl(candidate.source_url);
  const mapUrl = coordinatesLink(candidate);
  const regionName = state.regions.get(candidate.region_code) || candidate.region_code;
  const duplicate = candidate.duplicate_restaurant_id
    ? `<div class="duplicate-warning">⚠️ Pravděpodobná shoda s restaurací <code>${escapeHtml(candidate.duplicate_restaurant_id)}</code></div>`
    : '';
  const notes = candidate.review_notes
    ? `<div class="duplicate-warning">Poznámka: ${escapeHtml(candidate.review_notes)}</div>`
    : '';

  return `
    <article class="candidate-card">
      <div class="quality-score" style="--score:${score};--score-color:${scoreColor(score)}">
        <div><strong>${score}</strong><small>kvalita</small></div>
      </div>
      <div>
        <div class="candidate-title-row">
          <h2>${escapeHtml(candidate.name)}</h2>
          <span class="status-badge status-${escapeHtml(candidate.candidate_status)}">
            ${escapeHtml(STATUS_LABELS[candidate.candidate_status] || candidate.candidate_status)}
          </span>
        </div>
        <div class="candidate-meta">
          <span>${escapeHtml(candidate.category_label || candidate.category || 'bez kategorie')}</span>
          <span>${escapeHtml(candidate.city || 'bez města')}</span>
          <span>${escapeHtml(regionName || 'bez kraje')}</span>
          <span>důvěra ${candidate.confidence == null ? '–' : `${Math.round(Number(candidate.confidence) * 100)} %`}</span>
        </div>
        <p class="candidate-address">${escapeHtml(candidate.address || 'Adresa není ve zdroji uvedena')}</p>
        <div class="candidate-links">
          ${website ? `<a href="${escapeHtml(website)}" target="_blank" rel="noopener">Web restaurace ↗</a>` : ''}
          ${mapUrl ? `<a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">Mapa ↗</a>` : ''}
          ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">Zdroj ↗</a>` : ''}
        </div>
        ${duplicate}
        ${notes}
        <details class="candidate-details">
          <summary>Technické údaje</summary>
          <dl>
            <dt>Zdrojové ID</dt><dd>${escapeHtml(candidate.source_external_id)}</dd>
            <dt>Release</dt><dd>${escapeHtml(candidate.source_release || 'neuveden')}</dd>
            <dt>Telefon</dt><dd>${escapeHtml(candidate.phone || 'neuveden')}</dd>
            <dt>PSČ</dt><dd>${escapeHtml(candidate.postal_code || 'neuvedeno')}</dd>
            <dt>Okres</dt><dd>${escapeHtml(candidate.district || 'neuveden')}</dd>
            <dt>Navržený slug</dt><dd>${escapeHtml(candidate.proposed_slug)}</dd>
          </dl>
        </details>
      </div>
      <div class="candidate-actions">${actionButtons(candidate)}</div>
    </article>
  `;
}

function setError(message = '') {
  elements.errorBanner.textContent = message;
  elements.errorBanner.classList.toggle('hidden', !message);
}

function setLoading(loading) {
  state.loading = loading;
  elements.loadingState.classList.toggle('hidden', !loading);
  elements.refreshBtn.disabled = loading;
}

async function loadRegions() {
  const { data, error } = await supabase
    .from('czech_regions')
    .select('code,name,sort_order')
    .order('sort_order');
  if (error) throw error;
  state.regions = new Map((data || []).map((region) => [region.code, region.name]));
  elements.regionFilter.innerHTML = '<option value="all">Všechny kraje</option>' +
    (data || []).map((region) =>
      `<option value="${escapeHtml(region.code)}">${escapeHtml(region.name)}</option>`
    ).join('');
}

async function countStatus(status = null) {
  let query = supabase
    .from('restaurant_import_candidates')
    .select('id', { count: 'exact', head: true });
  if (status) query = query.eq('candidate_status', status);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function loadStats() {
  const [total, fresh, duplicates, approved, imported] = await Promise.all([
    countStatus(),
    countStatus('new'),
    countStatus('probable_duplicate'),
    countStatus('approved'),
    countStatus('imported')
  ]);
  document.getElementById('statTotal').textContent = total.toLocaleString('cs-CZ');
  document.getElementById('statNew').textContent = fresh.toLocaleString('cs-CZ');
  document.getElementById('statDuplicates').textContent = duplicates.toLocaleString('cs-CZ');
  document.getElementById('statApproved').textContent = approved.toLocaleString('cs-CZ');
  document.getElementById('statImported').textContent = imported.toLocaleString('cs-CZ');
}

async function loadCandidates() {
  if (state.loading) return;
  setLoading(true);
  setError();
  elements.candidateList.innerHTML = '';
  elements.emptyState.classList.add('hidden');

  try {
    const from = state.page * PAGE_SIZE;
    let query = supabase
      .from('restaurant_import_candidates')
      .select('*', { count: 'exact' })
      .order('quality_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const status = elements.statusFilter.value;
    if (status === 'review') {
      query = query.in('candidate_status', ['new', 'probable_duplicate', 'approved']);
    } else if (status !== 'all') {
      query = query.eq('candidate_status', status);
    }
    if (elements.regionFilter.value !== 'all') {
      query = query.eq('region_code', elements.regionFilter.value);
    }
    const search = cleanSearch(elements.searchInput.value);
    if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    state.total = count || 0;
    state.candidates = new Map((data || []).map((candidate) => [candidate.id, candidate]));
    elements.candidateList.innerHTML = (data || []).map(renderCandidate).join('');
    elements.emptyState.classList.toggle('hidden', Boolean(data?.length));
    updatePagination();
  } catch (error) {
    console.error('Import candidate loading failed:', error);
    setError('Kandidáty se nepodařilo načíst. Zkontroluj, že jsou v Supabase spuštěné SQL migrace bodů 1, 2 a 3.');
    elements.pagination.classList.add('hidden');
  } finally {
    setLoading(false);
  }
}

function updatePagination() {
  const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  if (state.page >= pages) state.page = pages - 1;
  elements.pageLabel.textContent = `Strana ${state.page + 1} z ${pages}`;
  elements.previousPage.disabled = state.page === 0;
  elements.nextPage.disabled = state.page + 1 >= pages;
  elements.pagination.classList.toggle('hidden', state.total <= PAGE_SIZE);
}

async function reviewCandidate(candidate, status) {
  let notes = null;
  if (status === 'rejected') {
    notes = window.prompt('Proč kandidáta odmítáš? (doporučeno)') || 'Odmítnuto administrátorem.';
    if (!window.confirm(`Opravdu odmítnout „${candidate.name}“?`)) return;
  } else if (candidate.duplicate_restaurant_id &&
      !window.confirm('Kandidát má možnou duplicitu. Opravdu ho chceš schválit k další kontrole?')) {
    return;
  }

  const toastId = window.toast?.loading(status === 'approved' ? 'Schvaluji kandidáta…' : 'Odmítám kandidáta…');
  const { error } = await supabase.rpc('review_restaurant_import_candidate', {
    p_candidate_id: candidate.id,
    p_status: status,
    p_notes: notes
  });
  if (error) {
    if (toastId) window.toast?.update(toastId, `Chyba: ${error.message}`, 'error');
    throw error;
  }
  if (toastId) window.toast?.update(toastId, status === 'approved' ? 'Kandidát schválen' : 'Kandidát odmítnut', 'success');
  await Promise.all([loadCandidates(), loadStats()]);
}

function editValue(value) {
  return value == null ? '' : String(value);
}

function openEditDialog(candidate) {
  state.editing = candidate;
  elements.editForm.reset();
  elements.editCandidateName.textContent = `${candidate.name} · ${candidate.city || 'bez města'}`;
  elements.editNameInput.value = editValue(candidate.name);
  elements.editCategoryInput.value = editValue(candidate.category_label || candidate.category);
  elements.editCityInput.value = editValue(candidate.city);
  elements.editAddressInput.value = editValue(candidate.address);
  elements.editPostalCodeInput.value = editValue(candidate.postal_code);
  elements.editPhoneInput.value = editValue(candidate.phone);
  elements.editWebsiteInput.value = editValue(candidate.website);
  elements.editLatitudeInput.value = editValue(candidate.latitude);
  elements.editLongitudeInput.value = editValue(candidate.longitude);
  elements.editDialog.showModal();
}

function closeEditDialog() {
  state.editing = null;
  elements.editDialog.close();
}

function nullableInput(element) {
  const value = element.value.trim();
  return value || null;
}

async function saveCandidateEdit(event) {
  event.preventDefault();
  const candidate = state.editing;
  if (!candidate) return;

  const latitude = nullableInput(elements.editLatitudeInput);
  const longitude = nullableInput(elements.editLongitudeInput);
  if ((latitude == null) !== (longitude == null)) {
    window.toast?.show('Vyplň obě souřadnice, nebo obě nech prázdné.', 'error');
    return;
  }

  elements.confirmEdit.disabled = true;
  const toastId = window.toast?.loading('Ukládám úpravy…');
  try {
    const { error } = await supabase.rpc('update_restaurant_import_candidate', {
      p_candidate_id: candidate.id,
      p_name: elements.editNameInput.value.trim(),
      p_category_label: nullableInput(elements.editCategoryInput),
      p_city: elements.editCityInput.value.trim(),
      p_address: nullableInput(elements.editAddressInput),
      p_postal_code: nullableInput(elements.editPostalCodeInput),
      p_phone: nullableInput(elements.editPhoneInput),
      p_website: nullableInput(elements.editWebsiteInput),
      p_latitude: latitude == null ? null : Number(latitude),
      p_longitude: longitude == null ? null : Number(longitude)
    });
    if (error) throw error;
    if (toastId) window.toast?.update(toastId, 'Importované údaje byly upraveny', 'success');
    closeEditDialog();
    await Promise.all([loadCandidates(), loadStats()]);
  } catch (error) {
    console.error('Candidate update failed:', error);
    if (toastId) window.toast?.update(toastId, `Chyba: ${error.message}`, 'error');
  } finally {
    elements.confirmEdit.disabled = false;
  }
}

function openPublishDialog(candidate) {
  state.publishing = candidate;
  elements.publishForm.reset();
  elements.publishCandidateName.textContent = `${candidate.name} · ${candidate.city || 'bez města'}`;
  elements.vibeInput.value = candidate.suggested_vibe || '';
  elements.descriptionInput.value = candidate.suggested_description || '';
  elements.imageInput.value = candidate.suggested_image_url || '';
  const hasSuggestion = Boolean(candidate.suggested_vibe || candidate.suggested_description || candidate.suggested_image_url);
  elements.contentSuggestionStatus.textContent = hasSuggestion
    ? `✨ Návrh byl automaticky předvyplněn${candidate.suggested_image_url ? ' včetně obrázku z oficiálního webu' : '; oficiální obrázek nebyl nalezen'}. Před zveřejněním vše zkontroluj.`
    : 'Automatický návrh zatím není připraven. Doplň údaje ručně nebo zopakuj import po nasazení návrhů.';
  elements.contentSuggestionStatus.classList.toggle('is-empty', !hasSuggestion);
  const hasDuplicate = Boolean(candidate.duplicate_restaurant_id);
  elements.duplicateConfirmation.classList.toggle('hidden', !hasDuplicate);
  elements.forceDuplicateInput.required = hasDuplicate;
  elements.publishDialog.showModal();
}

function closePublishDialog() {
  state.publishing = null;
  elements.publishDialog.close();
}

async function publishCandidate(event) {
  event.preventDefault();
  const candidate = state.publishing;
  if (!candidate) return;
  if (candidate.duplicate_restaurant_id && !elements.forceDuplicateInput.checked) {
    window.toast?.show('Nejdřív potvrď kontrolu možné duplicity.', 'error');
    return;
  }

  elements.confirmPublish.disabled = true;
  const toastId = window.toast?.loading('Zveřejňuji restauraci…');
  try {
    const { error } = await supabase.rpc('publish_restaurant_import_candidate', {
      p_candidate_id: candidate.id,
      p_vibe: elements.vibeInput.value,
      p_description: elements.descriptionInput.value.trim(),
      p_image_url: elements.imageInput.value.trim() || null,
      p_force_duplicate: elements.forceDuplicateInput.checked
    });
    if (error) throw error;
    if (toastId) window.toast?.update(toastId, 'Restaurace byla zveřejněna', 'success');
    closePublishDialog();
    await Promise.all([loadCandidates(), loadStats()]);
  } catch (error) {
    console.error('Candidate publishing failed:', error);
    if (toastId) window.toast?.update(toastId, `Chyba: ${error.message}`, 'error');
  } finally {
    elements.confirmPublish.disabled = false;
  }
}

elements.candidateList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action][data-id]');
  if (!button || state.loading) return;
  const candidate = state.candidates.get(button.dataset.id);
  if (!candidate) return;
  button.disabled = true;
  try {
    if (button.dataset.action === 'edit') openEditDialog(candidate);
    if (button.dataset.action === 'approve') await reviewCandidate(candidate, 'approved');
    if (button.dataset.action === 'reject') await reviewCandidate(candidate, 'rejected');
    if (button.dataset.action === 'publish') openPublishDialog(candidate);
  } catch (error) {
    console.error('Candidate review failed:', error);
    window.toast?.show(`Akce se nezdařila: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
  }
});

let searchTimer;
elements.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.page = 0;
    loadCandidates();
  }, 350);
});

[elements.statusFilter, elements.regionFilter].forEach((element) => {
  element.addEventListener('change', () => {
    state.page = 0;
    loadCandidates();
  });
});

elements.previousPage.addEventListener('click', () => {
  if (state.page === 0) return;
  state.page -= 1;
  loadCandidates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

elements.nextPage.addEventListener('click', () => {
  if ((state.page + 1) * PAGE_SIZE >= state.total) return;
  state.page += 1;
  loadCandidates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

elements.refreshBtn.addEventListener('click', () => Promise.all([loadCandidates(), loadStats()]));
elements.logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});
elements.editForm.addEventListener('submit', saveCandidateEdit);
document.getElementById('cancelEdit').addEventListener('click', closeEditDialog);
elements.editDialog.addEventListener('click', (event) => {
  if (event.target === elements.editDialog) closeEditDialog();
});
elements.publishForm.addEventListener('submit', publishCandidate);
document.getElementById('cancelPublish').addEventListener('click', closePublishDialog);
elements.publishDialog.addEventListener('click', (event) => {
  if (event.target === elements.publishDialog) closePublishDialog();
});

Promise.all([loadRegions(), loadStats()])
  .then(loadCandidates)
  .catch((error) => {
    console.error('Admin imports initialization failed:', error);
    setLoading(false);
    setError('Importní administraci nelze spustit. Zkontroluj databázové migrace bodů 1, 2 a 3.');
  });
