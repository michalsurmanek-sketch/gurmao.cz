(() => {
  'use strict';

  if (!location.pathname.endsWith('/ai.html')) return;

  const selected = {
    mood: '',
    occasion: '',
    groupSize: '',
    city: '',
    priceLevel: ''
  };

  const optionGroups = {
    moodOptions: 'mood',
    occasionOptions: 'occasion',
    groupSizeOptions: 'groupSize',
    cityOptions: 'city',
    priceLevelOptions: 'priceLevel'
  };

  document.addEventListener('click', event => {
    const option = event.target.closest('.custom-option');
    if (option) {
      const group = option.closest('.custom-options');
      const key = optionGroups[group?.id];
      if (key) selected[key] = String(option.dataset.value || '');
    }

    if (event.target.closest('#resetForm')) {
      Object.keys(selected).forEach(key => { selected[key] = ''; });
    }
  }, true);

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'aiRecommendationForm') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const results = document.getElementById('aiResults');
    if (!results) return;

    results.innerHTML = `
      <div class="text-center py-12" role="status" aria-live="polite">
        <div class="inline-block animate-spin text-4xl mb-4" aria-hidden="true">✦</div>
        <div class="text-white/60">Hledám nejlepší shodu v aktuálních datech…</div>
      </div>`;

    const query = {
      mood: selected.mood || null,
      occasion: selected.occasion || null,
      groupSize: Number.parseInt(selected.groupSize, 10) || null,
      city: selected.city || null,
      priceLevel: Number.parseInt(selected.priceLevel, 10) || null,
      freeText: form.querySelector('[name="freeText"]')?.value || ''
    };

    try {
      if (!window.aiEngine?.renderRecommendations) throw new Error('Recommendation engine is not ready');
      results.innerHTML = await window.aiEngine.renderRecommendations(query);
    } catch (error) {
      console.error('Recommendation form failed:', error);
      results.innerHTML = '<div class="text-center text-red-300 py-12" role="alert">Doporučení se nepodařilo načíst. Zkus to znovu.</div>';
    }

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
})();