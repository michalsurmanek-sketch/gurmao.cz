(function initAIRedesign(){
  const path=window.location.pathname.replace(/\/+$/,'');
  if(!path.endsWith('/ai.html'))return;
  if(window.__gurmaoAIRedesignInitialized)return;
  window.__gurmaoAIRedesignInitialized=true;

  const text=value=>String(value??'').trim();
  const escapeHtml=value=>text(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  document.body.classList.add('ai-page-redesign');
  document.querySelectorAll('a[href="ai.html"]').forEach(link=>{
    link.classList.add('text-gurmaogold');
    link.setAttribute('aria-current','page');
  });

  const section=[...document.querySelectorAll('body > section')].find(node=>node.querySelector('#aiRecommendationForm'));
  const form=document.getElementById('aiRecommendationForm');
  const results=document.getElementById('aiResults');
  if(!section||!form||!results)return;

  const originalInner=section.querySelector('.relative.max-w-7xl');
  const heroText=section.querySelector('h1')?.closest('div');
  if(originalInner){
    originalInner.className='ai-shell';
    const grid=originalInner.querySelector('.grid.lg\\:grid-cols-2');
    if(grid)grid.className='';
  }

  if(heroText&&!heroText.dataset.gurmaoAiHero){
    heroText.dataset.gurmaoAiHero='true';
    heroText.className='ai-hero';
    heroText.innerHTML=`
      <div class="ai-kicker">✦ GURMAO DOPORUČENÍ</div>
      <h1>Najděte podnik pro<br><span>správný okamžik</span></h1>
      <p>Popište chuť, náladu, příležitost nebo rozpočet. GURMAO porovná aktuální restaurace v databázi a seřadí nejvhodnější shody.</p>
      <div class="ai-quick" aria-label="Rychlé volby">
        <button type="button" class="ai-chip" data-ai-query="romantika|rande|2||3|romantická restaurace na rande">❤️ Restaurace na rande</button>
        <button type="button" class="ai-chip" data-ai-query="kamarádi|večer|4||2|dobré jídlo a posezení s přáteli">🍺 Večer s přáteli</button>
        <button type="button" class="ai-chip" data-ai-query="klid|rodinný oběd|4||2|rodinná restaurace">👨‍👩‍👧 Rodinný oběd</button>
        <button type="button" class="ai-chip" data-ai-query="oslava|narozeniny|6||3|oslava narozenin">🎉 Oslava narozenin</button>
        <button type="button" class="ai-chip" data-ai-query="rychle|oběd|1||1|rychlý oběd do 300 Kč">⚡ Rychlý oběd</button>
        <button type="button" class="ai-chip" data-ai-query="romantika|výročí|2||4|fine dining a výjimečný večer">🍷 Výjimečný večer</button>
      </div>`;
    heroText.insertAdjacentElement('afterend',form);
  }

  if(!document.querySelector('.ai-capabilities')){
    const capabilities=document.createElement('div');
    capabilities.className='ai-capabilities';
    capabilities.innerHTML=`
      <article class="ai-capability"><div class="ai-capability-icon">🍽</div><strong>Najde restauraci</strong><span>Podle chuti, kuchyně, města nebo atmosféry.</span></article>
      <article class="ai-capability"><div class="ai-capability-icon">📍</div><strong>Vybere lokalitu</strong><span>Zohlední zadané město nebo oblast, pokud ji vyberete.</span></article>
      <article class="ai-capability"><div class="ai-capability-icon">💰</div><strong>Porovná rozpočet</strong><span>Upřednostní podniky odpovídající dostupné cenové úrovni.</span></article>
      <article class="ai-capability"><div class="ai-capability-icon">⭐</div><strong>Seřadí shody</strong><span>Využije dostupná data a skutečné hodnocení restaurací.</span></article>`;
    form.insertAdjacentElement('afterend',capabilities);
  }

  if(!document.querySelector('.ai-section-title')){
    const title=document.createElement('div');
    title.className='ai-section-title';
    title.innerHTML='<div><h2>Doporučení na míru</h2><p>Výsledky se řadí podle shody se zadáním a dostupných dat restaurací.</p></div>';
    results.parentNode?.insertBefore(title,results);
  }

  function setSelect(buttonId,value,label){
    const button=document.getElementById(buttonId);
    if(!button)return;
    button.dataset.value=value||'';
    button.textContent=label;
  }

  function bindOptions(box,buttonId){
    if(!box||box.dataset.gurmaoBound==='true')return;
    box.dataset.gurmaoBound='true';
    box.querySelectorAll('.custom-option').forEach(option=>option.addEventListener('click',()=>{
      setSelect(buttonId,option.dataset.value||'',option.textContent.trim());
      box.classList.add('hidden');
    }));
  }

  const cityOptions=document.getElementById('cityOptions');
  const cityButton=document.getElementById('cityBtn');
  const cityLabel=cityButton?.closest('div')?.parentElement?.querySelector('label span');
  if(cityLabel)cityLabel.textContent='Kraj';
  if(cityButton&&!cityButton.dataset.value)cityButton.textContent='-- Vyber kraj --';
  if(cityOptions){
    const regions=['Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj'];
    cityOptions.innerHTML='<div class="custom-option" data-value="">-- Všechny kraje --</div>'+regions.map(region=>`<div class="custom-option" data-value="${escapeHtml(region)}">📍 ${escapeHtml(region)}</div>`).join('');
  }

  [['moodOptions','moodBtn'],['occasionOptions','occasionBtn'],['groupSizeOptions','groupSizeBtn'],['priceLevelOptions','priceLevelBtn'],['cityOptions','cityBtn']]
    .forEach(([optionsId,buttonId])=>bindOptions(document.getElementById(optionsId),buttonId));

  const labels={
    romantika:'💕 Romantika',
    kamarádi:'👥 S kamarády',
    klid:'🧘 Klid a pohoda',
    oslava:'🎉 Oslava',
    rychle:'⚡ Rychle'
  };

  document.querySelectorAll('.ai-chip').forEach(chip=>{
    if(chip.dataset.gurmaoBound==='true')return;
    chip.dataset.gurmaoBound='true';
    chip.addEventListener('click',()=>{
      const [mood,occasion,group,region,price,free]=String(chip.dataset.aiQuery||'').split('|');
      setSelect('moodBtn',mood,labels[mood]||mood||'-- Vyber náladu --');
      setSelect('occasionBtn',occasion,occasion?`✨ ${occasion}`:'-- Vyber příležitost --');
      setSelect('groupSizeBtn',group,group?`${group} lidí`:'-- Kolik vás bude? --');
      setSelect('priceLevelBtn',price,price?`${'💵'.repeat(Number(price))} zvolený rozpočet`:'-- Rozpočet --');
      if(region)setSelect('cityBtn',region,`📍 ${region}`);
      const input=form.querySelector('[name="freeText"]');
      if(input)input.value=free||'';
      form.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });

  const reset=document.getElementById('resetForm');
  if(reset&&reset.dataset.gurmaoBound!=='true'){
    reset.dataset.gurmaoBound='true';
    reset.addEventListener('click',()=>{
      ['moodBtn','occasionBtn','groupSizeBtn','cityBtn','priceLevelBtn'].forEach(id=>{
        const button=document.getElementById(id);
        if(button)delete button.dataset.value;
      });
      setSelect('cityBtn','','-- Vyber kraj --');
      results.replaceChildren();
    });
  }
})();