(async function initAIRedesign(){
  const path=window.location.pathname.replace(/\/+$/,'');
  if(!path.endsWith('/ai.html'))return;
  document.body.classList.add('ai-page-redesign');

  document.querySelectorAll('a[href="ai.html"]').forEach(link=>{
    link.classList.add('text-gurmaogold');
    link.setAttribute('aria-current','page');
  });

  const section=[...document.querySelectorAll('body > section')].find(s=>s.querySelector('#aiRecommendationForm'));
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
  if(heroText){
    heroText.className='ai-hero';
    heroText.innerHTML=`
      <div class="ai-kicker">✨ GURMAO AI</div>
      <h1>Najděte podnik pro<br><span>správný okamžik</span></h1>
      <p>Stačí popsat chuť, náladu, příležitost nebo rozpočet. GURMAO vybere restaurace z databáze a ukáže je ve stejném přehledném stylu jako katalog restaurací.</p>
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

  const capabilities=document.createElement('div');
  capabilities.className='ai-capabilities';
  capabilities.innerHTML=`
    <article class="ai-capability"><div class="ai-capability-icon">🍽</div><strong>Najde restauraci</strong><span>Podle chuti, kuchyně, kraje nebo atmosféry.</span></article>
    <article class="ai-capability"><div class="ai-capability-icon">📍</div><strong>Vybere místo</strong><span>Zohlední kraj, město a příležitost návštěvy.</span></article>
    <article class="ai-capability"><div class="ai-capability-icon">💰</div><strong>Hlídá rozpočet</strong><span>Pomůže vybrat podnik odpovídající cenové úrovni.</span></article>
    <article class="ai-capability"><div class="ai-capability-icon">⭐</div><strong>Seřadí shody</strong><span>Nejvhodnější restaurace ukáže jako první.</span></article>`;
  form.insertAdjacentElement('afterend',capabilities);

  const title=document.createElement('div');
  title.className='ai-section-title';
  title.innerHTML='<div><h2>Doporučení na míru</h2><p>Výsledky se řadí podle shody s vaším zadáním, lokalitou, kuchyní a hodnocením.</p></div>';
  results.parentNode.insertBefore(title,results);

  function text(v){return v==null?'':String(v).trim();}
  function valueFromButton(id){return document.getElementById(id)?.dataset.value||'';}
  function setSelect(btnId,value,label){const btn=document.getElementById(btnId);if(btn){btn.dataset.value=value;btn.textContent=label;}}
  function regionOf(r){return text(r.region||r.kraj||r.county||r.state);}
  function normalize(v){return text(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
  function matchesRegion(r,selectedRegion){
    const wanted=normalize(selectedRegion);
    if(!wanted)return true;
    const direct=normalize(regionOf(r));
    if(direct===wanted)return true;
    return [r.region,r.kraj,r.county,r.state,r.address,r.city].some(value=>normalize(value).includes(wanted));
  }
  function bindOptions(box,btnId){
    box.querySelectorAll('.custom-option').forEach(opt=>opt.addEventListener('click',()=>{
      setSelect(btnId,opt.dataset.value||'',opt.textContent.trim());box.classList.add('hidden');
    }));
  }
  function populateRegions(){
    const box=document.getElementById('cityOptions');
    const btn=document.getElementById('cityBtn');
    const label=btn?.closest('div')?.parentElement?.querySelector('label span');
    if(label)label.textContent='Kraj';
    if(btn&&!btn.dataset.value)btn.textContent='-- Vyber kraj --';
    if(!box)return;
    const regions=['Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj'];
    box.innerHTML='<div class="custom-option" data-value="">-- Všechny kraje --</div>'+regions.map(region=>`<div class="custom-option" data-value="${escapeHtml(region)}">📍 ${escapeHtml(region)}</div>`).join('');
    bindOptions(box,'cityBtn');
  }

  populateRegions();
  [['moodOptions','moodBtn'],['occasionOptions','occasionBtn'],['groupSizeOptions','groupSizeBtn'],['priceLevelOptions','priceLevelBtn']].forEach(([o,b])=>{const box=document.getElementById(o);if(box)bindOptions(box,b);});

  let restaurants=[];
  try{
    const {supabase}=await import('./supabase-client.js');
    const fields='id,slug,name,city,region,kraj,county,state,cuisine,cuisine_type,category,vibe,atmosphere,description,short_description,tags,address,rating,average_rating,google_rating,price_level,image_url,image,photo_url,cover_image,thumbnail_url';
    const {data,error}=await supabase.from('restaurants').select(fields).not('name','is',null).limit(300);
    if(error)throw error;
    restaurants=Array.isArray(data)?data:[];
  }catch(error){console.warn('AI databáze není dostupná:',error);}

  function allText(r){
    return [r.name,r.city,r.region,r.kraj,r.county,r.state,r.cuisine,r.cuisine_type,r.category,r.vibe,r.atmosphere,r.description,r.short_description,r.tags,r.address]
      .flatMap(v=>Array.isArray(v)?v:[v]).map(text).join(' ').toLowerCase();
  }

  document.querySelectorAll('.ai-chip').forEach(chip=>chip.addEventListener('click',()=>{
    const [mood,occasion,group,region,price,free]=chip.dataset.aiQuery.split('|');
    const labels={romantika:'💕 Romantika',kamarádi:'👥 S kamarády',klid:'🧘 Klid a pohoda',oslava:'🎉 Oslava',rychle:'⚡ Rychle'};
    setSelect('moodBtn',mood,labels[mood]||mood);
    setSelect('occasionBtn',occasion,occasion?`✨ ${occasion}`:'-- Vyber příležitost --');
    setSelect('groupSizeBtn',group,group?`${group} lidí`:'-- Kolik vás bude? --');
    setSelect('priceLevelBtn',price,price?`${'💵'.repeat(Number(price))} zvolený rozpočet`:'-- Rozpočet --');
    if(region)setSelect('cityBtn',region,`📍 ${region}`);
    const input=form.querySelector('[name="freeText"]');if(input)input.value=free;
    form.scrollIntoView({behavior:'smooth',block:'center'});
  }));

  const submitButton=form.querySelector('button[type="submit"]');
  const handleSubmit=event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();render();};
  form.addEventListener('submit',handleSubmit,true);
  submitButton?.addEventListener('click',handleSubmit,true);
  if(submitButton){submitButton.disabled=false;submitButton.style.pointerEvents='auto';submitButton.style.cursor='pointer';submitButton.style.position='relative';submitButton.style.zIndex='10';}

  document.getElementById('resetForm')?.addEventListener('click',()=>{
    ['moodBtn','occasionBtn','groupSizeBtn','cityBtn','priceLevelBtn'].forEach(id=>{const b=document.getElementById(id);if(b)delete b.dataset.value;});
    setSelect('cityBtn','','-- Vyber kraj --');results.innerHTML='';
  },true);

  function render(){
    const q={mood:valueFromButton('moodBtn'),occasion:valueFromButton('occasionBtn'),group:valueFromButton('groupSizeBtn'),region:valueFromButton('cityBtn'),price:valueFromButton('priceLevelBtn'),free:text(form.querySelector('[name="freeText"]')?.value).toLowerCase()};
    results.innerHTML='<div class="ai-loading">✨ GURMAO právě vybírá nejlepší restaurace…</div>';
    results.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>{
      if(!restaurants.length){results.innerHTML='<div class="ai-empty">Restaurace se nyní nepodařilo načíst. Zkuste stránku obnovit.</div>';return;}
      const regionalRestaurants=q.region?restaurants.filter(r=>matchesRegion(r,q.region)):restaurants;
      if(q.region&&!regionalRestaurants.length){results.innerHTML=`<div class="ai-empty">V kraji <strong>${escapeHtml(q.region)}</strong> zatím nemáme žádné restaurace.</div>`;return;}
      const tokens=[q.mood,q.occasion,q.free].filter(Boolean).join(' ').split(/\s+/).filter(w=>w.length>2);
      const ranked=regionalRestaurants.map(r=>{
        const hay=normalize(allText(r));let score=20;const reasons=[];
        if(q.region)reasons.push(`V kraji ${q.region}`);
        tokens.forEach(t=>{const token=normalize(t);if(hay.includes(token)){score+=12;if(reasons.length<3)reasons.push(`Odpovídá: ${t}`);}});
        const rating=Number(r.rating||r.average_rating||r.google_rating||0);if(rating){score+=Math.min(15,rating*3);reasons.push(`Hodnocení ${rating.toFixed(1)}`);}
        if(q.price&&Number(r.price_level||0)===Number(q.price)){score+=10;reasons.push('Sedí rozpočet');}
        return {r,score:Math.max(1,Math.round(score)),reasons:[...new Set(reasons)].slice(0,3)};
      }).sort((a,b)=>b.score-a.score).slice(0,6);
      const prompt=[q.free,q.region,q.mood,q.occasion].filter(Boolean).join(' · ')||'univerzální výběr';
      results.innerHTML=`<div class="ai-summary"><strong>GURMAO doporučuje:</strong> nejlepší shody pro „${escapeHtml(prompt)}“. ${q.region?`Zobrazeny jsou restaurace z kraje ${escapeHtml(q.region)}.`:'Výběr vychází z údajů restaurací uložených na GURMAO.'}</div><div class="ai-grid">${ranked.map(card).join('')}</div>`;
    },280);
  }

  function card(item,index){
    const r=item.r;const name=text(r.name)||'Restaurace';const city=text(r.city)||regionOf(r)||'Česká republika';
    const cuisine=text(r.cuisine||r.cuisine_type||r.category)||'Restaurace';const desc=text(r.short_description||r.description)||'Podnik vybraný podle vašeho zadání.';
    const image=text(r.image_url||r.image||r.photo_url||r.cover_image||r.thumbnail_url);const id=encodeURIComponent(r.id||r.slug||name);
    const href=r.slug?`restaurace-detail.html?slug=${encodeURIComponent(r.slug)}`:`restaurace-detail.html?id=${id}`;const match=Math.min(99,Math.max(55,item.score));
    return `<article class="ai-card"><div class="ai-card-image"${image?` style="background-image:url('${escapeAttr(image)}')"`:''}><span class="ai-match">${index===0?'Nejlepší shoda · ':''}${match}%</span></div><div class="ai-card-body"><h3>${escapeHtml(name)}</h3><div class="ai-meta">${escapeHtml(city)} · ${escapeHtml(cuisine)}</div><div class="ai-desc">${escapeHtml(desc.slice(0,150))}</div><div class="ai-reasons">${(item.reasons.length?item.reasons:['Doporučeno podle vašeho zadání']).map(x=>`<span>✓ ${escapeHtml(x)}</span>`).join('')}</div><div class="ai-card-actions"><a href="${href}">Zobrazit restauraci</a><a class="secondary" href="collections.html">Moje kniha</a></div></div></article>`;
  }
  function escapeHtml(v){return text(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function escapeAttr(v){return text(v).replace(/['"()]/g,'');}
})();