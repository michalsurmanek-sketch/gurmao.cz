import { supabase } from './supabase-client.js';

const elements = {
  approve: document.getElementById('bulkApproveBtn'),
  publish: document.getElementById('bulkPublishBtn'),
  approvePublish: document.getElementById('bulkApprovePublishBtn'),
  progress: document.getElementById('bulkProgress'),
  search: document.getElementById('searchInput'),
  status: document.getElementById('statusFilter'),
  region: document.getElementById('regionFilter'),
  refresh: document.getElementById('refreshBtn')
};

let running = false;

function cleanSearch(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s.'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function setRunning(value) {
  running = value;
  [elements.approve, elements.publish, elements.approvePublish].forEach((button) => {
    if (button) button.disabled = value;
  });
}

function showProgress(message, type = '') {
  if (!elements.progress) return;
  elements.progress.textContent = message;
  elements.progress.classList.remove('hidden', 'is-error', 'is-success');
  if (type) elements.progress.classList.add(`is-${type}`);
}

function buildFilteredQuery(statuses) {
  let query = supabase
    .from('restaurant_import_candidates')
    .select('*')
    .in('candidate_status', statuses)
    .order('quality_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (elements.region?.value && elements.region.value !== 'all') {
    query = query.eq('region_code', elements.region.value);
  }

  const search = cleanSearch(elements.search?.value);
  if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);

  return query;
}

async function fetchCandidates(statuses) {
  const { data, error } = await buildFilteredQuery(statuses);
  if (error) throw error;
  return data || [];
}

async function approveCandidates(candidates) {
  let approved = 0;
  let skippedDuplicates = 0;
  let failed = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    showProgress(`Schvaluji ${index + 1} z ${candidates.length}: ${candidate.name}`);

    if (candidate.duplicate_restaurant_id || candidate.candidate_status === 'probable_duplicate') {
      skippedDuplicates += 1;
      continue;
    }

    const { error } = await supabase.rpc('review_restaurant_import_candidate', {
      p_candidate_id: candidate.id,
      p_status: 'approved',
      p_notes: 'Hromadně schváleno administrátorem.'
    });

    if (error) {
      console.error('Bulk approval failed:', candidate.id, error);
      failed += 1;
    } else {
      approved += 1;
    }
  }

  return { approved, skippedDuplicates, failed };
}

async function publishCandidates(candidates) {
  let published = 0;
  let skippedDuplicates = 0;
  let skippedMissingContent = 0;
  let failed = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    showProgress(`Publikuji ${index + 1} z ${candidates.length}: ${candidate.name}`);

    if (candidate.duplicate_restaurant_id) {
      skippedDuplicates += 1;
      continue;
    }

    const vibe = String(candidate.suggested_vibe || '').trim();
    const description = String(candidate.suggested_description || '').trim();
    if (!vibe || !description) {
      skippedMissingContent += 1;
      continue;
    }

    const { error } = await supabase.rpc('publish_restaurant_import_candidate', {
      p_candidate_id: candidate.id,
      p_vibe: vibe,
      p_description: description,
      p_image_url: String(candidate.suggested_image_url || '').trim() || null,
      p_force_duplicate: false
    });

    if (error) {
      console.error('Bulk publishing failed:', candidate.id, error);
      failed += 1;
    } else {
      published += 1;
    }
  }

  return { published, skippedDuplicates, skippedMissingContent, failed };
}

function filterDescription() {
  const parts = [];
  if (elements.region?.value && elements.region.value !== 'all') {
    parts.push(elements.region.options[elements.region.selectedIndex]?.text || elements.region.value);
  }
  const search = cleanSearch(elements.search?.value);
  if (search) parts.push(`hledání „${search}“`);
  return parts.length ? parts.join(', ') : 'všechny kraje bez vyhledávání';
}

async function refreshPageData() {
  elements.refresh?.click();
}

async function runApprove() {
  if (running) return;
  const candidates = await fetchCandidates(['new', 'probable_duplicate']);
  if (!candidates.length) {
    window.toast?.show('Pro aktuální filtr nejsou žádní kandidáti ke schválení.', 'info');
    return;
  }

  const safeCount = candidates.filter((item) => !item.duplicate_restaurant_id && item.candidate_status !== 'probable_duplicate').length;
  const duplicateCount = candidates.length - safeCount;
  const confirmed = window.confirm(
    `Opravdu schválit ${safeCount} restaurací pro filtr: ${filterDescription()}?` +
    (duplicateCount ? `\n\n${duplicateCount} možných duplicit bude z bezpečnostních důvodů přeskočeno.` : '')
  );
  if (!confirmed) return;

  setRunning(true);
  try {
    const result = await approveCandidates(candidates);
    showProgress(
      `Hotovo: schváleno ${result.approved}, přeskočené duplicity ${result.skippedDuplicates}, chyby ${result.failed}.`,
      result.failed ? 'error' : 'success'
    );
    window.toast?.show(`Schváleno ${result.approved} restaurací.`, result.failed ? 'warning' : 'success');
    await refreshPageData();
  } catch (error) {
    console.error(error);
    showProgress(`Hromadné schválení selhalo: ${error.message}`, 'error');
    window.toast?.show(`Hromadné schválení selhalo: ${error.message}`, 'error');
  } finally {
    setRunning(false);
  }
}

async function runPublish() {
  if (running) return;
  const candidates = await fetchCandidates(['approved']);
  if (!candidates.length) {
    window.toast?.show('Pro aktuální filtr nejsou žádné schválené restaurace k publikování.', 'info');
    return;
  }

  const publishable = candidates.filter((item) =>
    !item.duplicate_restaurant_id &&
    String(item.suggested_vibe || '').trim() &&
    String(item.suggested_description || '').trim()
  );
  const skipped = candidates.length - publishable.length;
  const confirmed = window.confirm(
    `Opravdu publikovat ${publishable.length} restaurací pro filtr: ${filterDescription()}?` +
    (skipped ? `\n\n${skipped} položek bez kompletního návrhu nebo s možnou duplicitou bude přeskočeno.` : '')
  );
  if (!confirmed) return;

  setRunning(true);
  try {
    const result = await publishCandidates(candidates);
    showProgress(
      `Hotovo: publikováno ${result.published}, bez obsahu ${result.skippedMissingContent}, duplicity ${result.skippedDuplicates}, chyby ${result.failed}.`,
      result.failed ? 'error' : 'success'
    );
    window.toast?.show(`Publikováno ${result.published} restaurací.`, result.failed ? 'warning' : 'success');
    await refreshPageData();
  } catch (error) {
    console.error(error);
    showProgress(`Hromadné publikování selhalo: ${error.message}`, 'error');
    window.toast?.show(`Hromadné publikování selhalo: ${error.message}`, 'error');
  } finally {
    setRunning(false);
  }
}

async function runApprovePublish() {
  if (running) return;
  const candidates = await fetchCandidates(['new', 'probable_duplicate', 'approved']);
  if (!candidates.length) {
    window.toast?.show('Pro aktuální filtr nejsou žádné restaurace ke zpracování.', 'info');
    return;
  }

  const duplicates = candidates.filter((item) => item.duplicate_restaurant_id || item.candidate_status === 'probable_duplicate').length;
  const confirmed = window.confirm(
    `Opravdu schválit a následně publikovat všechny bezpečné restaurace pro filtr: ${filterDescription()}?` +
    `\n\nCelkem nalezeno: ${candidates.length}. Možné duplicity: ${duplicates}.` +
    '\nPublikovány budou pouze položky s připravenou atmosférou a popisem.'
  );
  if (!confirmed) return;

  setRunning(true);
  try {
    const toApprove = candidates.filter((item) => ['new', 'probable_duplicate'].includes(item.candidate_status));
    const approval = await approveCandidates(toApprove);

    const approvedNow = await fetchCandidates(['approved']);
    const publishing = await publishCandidates(approvedNow);

    showProgress(
      `Hotovo: schváleno ${approval.approved}, publikováno ${publishing.published}, ` +
      `duplicity ${approval.skippedDuplicates + publishing.skippedDuplicates}, ` +
      `bez obsahu ${publishing.skippedMissingContent}, chyby ${approval.failed + publishing.failed}.`,
      approval.failed + publishing.failed ? 'error' : 'success'
    );
    window.toast?.show(
      `Schváleno ${approval.approved}, publikováno ${publishing.published}.`,
      approval.failed + publishing.failed ? 'warning' : 'success'
    );
    await refreshPageData();
  } catch (error) {
    console.error(error);
    showProgress(`Hromadná akce selhala: ${error.message}`, 'error');
    window.toast?.show(`Hromadná akce selhala: ${error.message}`, 'error');
  } finally {
    setRunning(false);
  }
}

elements.approve?.addEventListener('click', runApprove);
elements.publish?.addEventListener('click', runPublish);
elements.approvePublish?.addEventListener('click', runApprovePublish);
