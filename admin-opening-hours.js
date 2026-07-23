import { supabase } from './supabase-client.js';

const status = document.getElementById('status');
const results = document.getElementById('results');
const stopBtn = document.getElementById('stopBtn');
let stopRequested = false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function readableError(value) {
  if (!value) return 'Neznámá chyba';
  if (typeof value === 'string') return value;
  if (value.message) return String(value.message);
  try { return JSON.stringify(value); } catch { return 'Neznámá objektová chyba'; }
}

function resultText(item) {
  if (item.status === 'updated') return '✅ Údaje z Google uloženy';
  if (item.status === 'no_hours') return '⚠️ Údaje uloženy, Google nemá otevírací dobu';
  if (item.status === 'not_found') return '⚠️ Restaurace nebyla spolehlivě nalezena';
  return `❌ ${readableError(item.error)}`;
}

function setButtonsDisabled(disabled, keepStop = false) {
  document.querySelectorAll('button').forEach((button) => {
    if (keepStop && button === stopBtn) return;
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

async function invokeBatch(refreshAll = false, limit = 10) {
  const { data, error } = await supabase.functions.invoke('sync-opening-hours', {
    body: { limit, refresh_all: refreshAll }
  });
  if (error) throw error;
  return data || { processed: 0, results: [] };
}

async function run(refreshAll = false) {
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

async function runAll() {
  stopRequested = false;
  setButtonsDisabled(true, true);
  stopBtn.hidden = false;
  stopBtn.disabled = false;
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
    const maxBatches = Math.ceil(total / 10);

    for (let batch = 1; batch <= maxBatches; batch += 1) {
      if (stopRequested) break;

      status.textContent = `Zpracovávám vše: ${processedTotal} z ${total} restaurací…`;
      const data = await invokeBatch(true, 10);
      const items = data.results || [];
      if (!items.length) break;

      processedTotal += items.length;
      savedTotal += items.filter((item) => item.status === 'updated' || item.status === 'no_hours').length;
      errorTotal += items.filter((item) => item.status === 'error').length;
      notFoundTotal += items.filter((item) => item.status === 'not_found').length;

      renderItems(items, true);
      status.textContent = `Zpracovávám vše: ${Math.min(processedTotal, total)} z ${total} · uloženo ${savedTotal} · nenalezeno ${notFoundTotal} · chyby ${errorTotal}.`;

      if (processedTotal >= total) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    status.textContent = stopRequested
      ? `Zastaveno: zpracováno ${processedTotal} z ${total}, uloženo ${savedTotal}, nenalezeno ${notFoundTotal}, chyby ${errorTotal}.`
      : `Hotovo vše: zpracováno ${processedTotal} z ${total}, uloženo ${savedTotal}, nenalezeno ${notFoundTotal}, chyby ${errorTotal}.`;
  } catch (error) {
    status.textContent = `Chyba při hromadném zpracování: ${readableError(error)}`;
  } finally {
    stopBtn.hidden = true;
    setButtonsDisabled(false);
  }
}

document.getElementById('syncBtn').addEventListener('click', () => run(false));
document.getElementById('refreshBtn').addEventListener('click', () => run(true));
document.getElementById('allBtn').addEventListener('click', runAll);
stopBtn.addEventListener('click', () => {
  stopRequested = true;
  stopBtn.disabled = true;
  status.textContent = 'Dokončuji aktuální dávku a zastavuji…';
});
