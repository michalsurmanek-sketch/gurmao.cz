import { supabase } from './supabase-client.js';

const status = document.getElementById('status');
const results = document.getElementById('results');
const stopBtn = document.getElementById('stopBtn');
const pauseBtn = document.getElementById('pauseBtn');

let stopRequested = false;
let pauseRequested = false;
let runningAll = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function readableError(value) {
  if (!value) return 'Neznámá chyba';
  if (typeof value === 'string') return value;
  if (value.message) return String(value.message);
  if (value.context?.body) return String(value.context.body);
  try { return JSON.stringify(value); } catch { return 'Neznámá objektová chyba'; }
}

function resultText(item) {
  if (item.status === 'updated') return '✅ Údaje z Google uloženy';
  if (item.status === 'no_hours') return '⚠️ Údaje uloženy, Google nemá otevírací dobu';
  if (item.status === 'not_found') return '⚠️ Restaurace nebyla spolehlivě nalezena';
  return `❌ ${readableError(item.error)}`;
}

function setButtonsDisabled(disabled, keepControls = false) {
  document.querySelectorAll('button').forEach((button) => {
    if (keepControls && (button === stopBtn || button === pauseBtn)) return;
    button.disabled = disabled;
  });
}

function renderItems(items, append = false) {
  const html = items.map((item) => `
    <article class="candidate-card">
      <div>
        <h2>${escapeHtml(item.name || 'Restaurace')}</h2>
        <p>${escapeHtml(resultText(item))}</p>
      </div>
    </article>
  `).join('');
  results.innerHTML = append ? results.innerHTML + html : html;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'počítám…';
  if (seconds < 60) return `asi ${Math.max(1, Math.round(seconds))} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `asi ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `asi ${hours} h ${rest} min`;
}

async function invokeBatch(refreshAll = false, limit = 10, maxAttempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('sync-opening-hours', {
        body: { limit, refresh_all: refreshAll }
      });
      if (error) throw error;
      return data || { processed: 0, results: [] };
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || stopRequested) break;
      const delay = [2000, 5000, 10000][attempt - 1] || 10000;
      status.textContent = `Dočasná chyba spojení. Opakuji pokus ${attempt + 1}/${maxAttempts} za ${Math.round(delay / 1000)} s…`;
      await sleep(delay);
    }
  }
  throw lastError;
}

async function run(refreshAll = false) {
  if (runningAll) return;
  setButtonsDisabled(true);
  status.textContent = 'Načítám a ukládám údaje z Google Places…';
  results.innerHTML = '';

  try {
    const data = await invokeBatch(refreshAll, 10);
    const items = data.results || [];
    const successCount = items.filter((item) => item.status === 'updated' || item.status === 'no_hours').length;
    const errorCount = items.filter((item) => item.status === 'error').length;
    status.textContent = `Hotovo: zpracováno ${data.processed || 0}, uloženo ${successCount}, chyby ${errorCount}.`;
    renderItems(items);
  } catch (error) {
    status.textContent = `Chyba: ${readableError(error)}`;
  } finally {
    setButtonsDisabled(false);
  }
}

async function waitWhilePaused(processedTotal, total) {
  while (pauseRequested && !stopRequested) {
    status.textContent = `Pozastaveno: ${processedTotal} z ${total}. Klikni na Pokračovat.`;
    await sleep(300);
  }
}

async function runAll() {
  if (runningAll) return;
  runningAll = true;
  stopRequested = false;
  pauseRequested = false;
  setButtonsDisabled(true, true);
  stopBtn.hidden = false;
  stopBtn.disabled = false;
  pauseBtn.hidden = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = 'Pozastavit';
  results.innerHTML = '';

  try {
    const { count, error: countError } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;

    const total = count || 0;
    if (!total) {
      status.textContent = 'V databázi nejsou žádné restaurace.';
      return;
    }

    let processedTotal = 0;
    let savedTotal = 0;
    let errorTotal = 0;
    let notFoundTotal = 0;
    const startedAt = Date.now();
    const maxBatches = Math.ceil(total / 10);

    for (let batch = 1; batch <= maxBatches; batch += 1) {
      if (stopRequested) break;
      await waitWhilePaused(processedTotal, total);
      if (stopRequested) break;

      const elapsedSeconds = Math.max(1, (Date.now() - startedAt) / 1000);
      const rate = processedTotal > 0 ? processedTotal / elapsedSeconds : 0;
      const eta = rate > 0 ? (total - processedTotal) / rate : NaN;
      status.textContent = `Zpracovávám: ${processedTotal} z ${total} · zbývá ${formatDuration(eta)}…`;

      const data = await invokeBatch(true, 10, 4);
      const items = data.results || [];
      if (!items.length) break;

      processedTotal += items.length;
      savedTotal += items.filter((item) => item.status === 'updated' || item.status === 'no_hours').length;
      errorTotal += items.filter((item) => item.status === 'error').length;
      notFoundTotal += items.filter((item) => item.status === 'not_found').length;

      renderItems(items, true);
      const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
      const currentRate = processedTotal / elapsed;
      const remaining = currentRate > 0 ? (total - processedTotal) / currentRate : NaN;
      status.textContent = `Zpracováno ${Math.min(processedTotal, total)} z ${total} · uloženo ${savedTotal} · nenalezeno ${notFoundTotal} · chyby ${errorTotal} · zbývá ${formatDuration(remaining)}.`;

      if (processedTotal >= total) break;
      await sleep(1200);
    }

    status.textContent = stopRequested
      ? `Zastaveno: zpracováno ${processedTotal} z ${total}, uloženo ${savedTotal}, nenalezeno ${notFoundTotal}, chyby ${errorTotal}.`
      : `Hotovo vše: zpracováno ${processedTotal} z ${total}, uloženo ${savedTotal}, nenalezeno ${notFoundTotal}, chyby ${errorTotal}.`;
  } catch (error) {
    status.textContent = `Hromadné zpracování se zastavilo: ${readableError(error)}. Kliknutím na Zpracovat vše můžeš pokračovat.`;
  } finally {
    runningAll = false;
    stopBtn.hidden = true;
    pauseBtn.hidden = true;
    pauseRequested = false;
    setButtonsDisabled(false);
  }
}

document.getElementById('syncBtn').addEventListener('click', () => run(false));
document.getElementById('refreshBtn').addEventListener('click', () => run(true));
document.getElementById('allBtn').addEventListener('click', runAll);

pauseBtn.addEventListener('click', () => {
  pauseRequested = !pauseRequested;
  pauseBtn.textContent = pauseRequested ? 'Pokračovat' : 'Pozastavit';
  if (pauseRequested) status.textContent = 'Dokončuji aktuální dávku a pozastavuji…';
});

stopBtn.addEventListener('click', () => {
  stopRequested = true;
  pauseRequested = false;
  stopBtn.disabled = true;
  pauseBtn.disabled = true;
  status.textContent = 'Dokončuji aktuální dávku a zastavuji…';
});