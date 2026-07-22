import { supabase } from './supabase-client.js';

const status = document.getElementById('status');
const results = document.getElementById('results');

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
  if (item.status === 'updated') return '✅ Otevírací doba uložena';
  if (item.status === 'no_hours') return '⚠️ Google nemá uvedenou otevírací dobu';
  if (item.status === 'not_found') return '⚠️ Restaurace nebyla spolehlivě nalezena';
  return `❌ ${readableError(item.error)}`;
}

async function run(refreshAll = false) {
  const buttons = [...document.querySelectorAll('button')];
  buttons.forEach((button) => { button.disabled = true; });
  status.textContent = 'Načítám a ukládám otevírací dobu…';
  results.innerHTML = '';

  try {
    const { data, error } = await supabase.functions.invoke('sync-opening-hours', {
      body: { limit: 10, refresh_all: refreshAll }
    });
    if (error) throw error;

    const items = data?.results || [];
    const successCount = items.filter((item) => item.status === 'updated').length;
    const errorCount = items.filter((item) => item.status === 'error').length;
    status.textContent = `Hotovo: zpracováno ${data?.processed || 0}, uloženo ${successCount}, chyby ${errorCount}.`;

    results.innerHTML = items.map((item) => `
      <article class="candidate-card">
        <div>
          <h2>${escapeHtml(item.name || 'Restaurace')}</h2>
          <p>${escapeHtml(resultText(item))}</p>
        </div>
      </article>
    `).join('');
  } catch (error) {
    status.textContent = `Chyba: ${readableError(error)}`;
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

document.getElementById('syncBtn').addEventListener('click', () => run(false));
document.getElementById('refreshBtn').addEventListener('click', () => run(true));