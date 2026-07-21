(async function initAIRedesign(){
  const path=window.location.pathname.replace(/\/+$/,'');
  if(!path.endsWith('/ai.html'))return;
  document.body.classList.add('ai-page-redesign');

  const section=[...document.querySelectorAll('body > section')].find(s=>s.querySelector('#aiRecommendationForm'));
  const form=document.getElementById('aiRecommendationForm');
  const results=document.getElementById('aiResults');
  if(!section||!form||!results)return;

  const originalInner=section.querySelector('.relative.max-w-7xl');
  const heroText=section.querySelector('h1')?.closest('div');
  if(originalInner){
    originalInner.className='ai-shell';
    const grid=originalInner.querySelector('.grid.lg\\:grid-cols-2');
    if(grid){grid.className='';}
  }
  if(heroText){
    heroText.className='ai-hero';
    heroText.innerHTML=`
      <div class="ai-kicker">GURMAO AI ASISTENT</div>
      <h1>AI doporučí váš<br><span>další zážitek</span></h1>
      <p>Popište náladu, příležitost, kraj nebo chuť. Gurmao projde skutečné restaurace v databázi a vybere podniky, které vám dávají největší smysl.</p>
      <div class="ai-quick" aria-label="Rychlé volby">
        <button type="button" class="ai-chip" data-ai-query="romantika|rande|2||3|klidné místo na rande">❤️ Rande</button>
        <button type="button" class="ai-chip" data-ai-query="kamarádi|páteční večer|4||2|pivo a dobré jídlo">🍺 S přáteli</button>
        <button type="button" class="ai-chip" data-ai-query="klid|oběd|2||2|rodinná restaurace">👨‍👩‍👧 Rodina</button>
        <button type="button" class="ai-chip" data-ai-query="oslava|narozeniny|6||3|oslava narozenin">🎉 Oslava</button>
        <button type="button" class="ai-chip" data-ai-query="rychle|oběd|1||1|rychlý oběd">⚡ Rychlý oběd</button>
        <button type="button" class="ai-chip" data-ai-query="romantika|výročí|2||4|výjimečný večer">🍷 Výročí</button>
      </div>`;
    heroText.insertAdjacentElement('afterend',form);
  }

  const title=document.createElement('div');
  title.className='ai-section-title';
  title.innerHTML='<h2>Doporučení na míru</h2><p>Výsledky se řadí podle shody s vaším zadáním, krajem, kuchyní a atmosférou.</p>';
  results.parentNode.insertBefore(title,results);

  let restaurants=[];
  try{
    const {supabase}=await import('./supabase-client.js');
    const {data,error}=await supabase.from('restaurants').select('*').limit(1000);
    if(error)throw error;
    restaurants=Array.isArray(data)?data:[];
    populateRegions();
  }catch(error){console.warn('AI databáze není dostupná:',error);populateRegions();}

  function text(v){return v==null?'':String(v).trim();}
  function allText(r){
    return [r.name,r.city,r.region,r.kraj,r.county,r.state,r.cuisine,r.cuisine_type,r.category,r.vibe,r.atmosphere,r.description,r.short_description,r.tags,r.address]
      .flatMap(v=>Array.isArray(v)?v:[v]).map(text).join(' ').toLowerCase();
  }
  function valueFromButton(id){return document.getElementById(id)?.dataset.value||'';}
  function setSelect(btnId,value,label){const btn=document.getElementById(btnId);if(btn){btn.dataset.value=value;btn.textContent=label;}}
  function regionOf(r){return text(r.region||r.kraj||r.county||r.state);}
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
  function bindOptions(box,btnId){
    box.querySelectorAll('.custom-option').forEach(opt=>opt.addEventListener('click',()=>{
      setSelect(btnId,opt.dataset.value||'',opt.textContent.trim());box.classList.add('hidden');
    }));
  }
  [['moodOptions','moodBtn'],['occasionOptions','occasionBtn'],['groupSizeOptions','groupSizeBtn'],['priceLevelOptions','priceLevelBtn']].forEach(([o,b])=>{const box=document.getElementById(o);if(box)bindOptions(box,b);});

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

  form.addEventListener('submit',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    render();
  },true);
  document.getElementById('resetForm')?.addEventListener('click',()=>{
    ['moodBtn','occasionBtn','groupSizeBtn','cityBtn','priceLevelBtn'].forEach(id=>{const b=document.getElementById(id);if(b)delete b.dataset.value;});
    setSelect('cityBtn','','-- Vyber kraj --');
    results.innerHTML='';
  });

  function render(){
    const q={
      mood:valueFromButton('moodBtn'),occasion:valueFromButton('occasionBtn'),group:valueFromButton('groupSizeBtn'),region:valueFromButton('cityBtn'),price:valueFromButton('priceLevelBtn'),free:text(form.querySelector('[name="freeText"]')?.value).toLowerCase()
    };
    results.innerHTML='<div class="ai-loading">✨ Gurmao prochází restaurace a hledá nejlepší shodu…</div>';
    setTimeout(()=>{
      if(!restaurants.length){results.innerHTML='<div class="ai-empty">Restaurace se nyní nepodařilo načíst. Zkuste stránku obnovit.</div>';return;}
      const tokens=[q.mood,q.occasion,q.free].filter(Boolean).join(' ').split(/\s+/).filter(w=>w.length>2);
      const ranked=restaurants.map(r=>{
        const hay=allText(r);let score=20;const reasons=[];
        if(q.region){const region=regionOf(r).toLowerCase();if(region&&region===q.region.toLowerCase()){score+=35;reasons.push(`V kraji ${q.region}`);}else if(hay.includes(q.region.toLowerCase())){score+=25;reasons.push(`V kraji ${q.region}`);}else score-=15;}
        tokens.forEach(t=>{if(hay.includes(t)){score+=12;if(reasons.length<3)reasons.push(`Odpovídá: ${t}`);}});
        const rating=Number(r.rating||r.average_rating||r.google_rating||0);if(rating){score+=Math.min(15,rating*3);reasons.push(`Hodnocení ${rating.toFixed(1)}`);}
        if(q.price&&Number(r.price_level||r.priceLevel||0)===Number(q.price)){score+=10;reasons.push('Sedí rozpočet');}
        return {r,score:Math.max(1,Math.round(score)),reasons:[...new Set(reasons)].slice(0,3)};
      }).sort((a,b)=>b.score-a.score).slice(0,6);
      const prompt=[q.free,q.region,q.mood,q.occasion].filter(Boolean).join(' · ')||'univerzální výběr';
      results.innerHTML=`<div class="ai-summary"><strong>Gurmao doporučuje:</strong> Nejlepší shody pro „${escapeHtml(prompt)}“. Výběr vychází z údajů restaurací uložených na Gurmao.</div><div class="ai-grid">${ranked.map(card).join('')}</div>`;
    },350);
  }

  function card(item,index){
    const r=item.r;const name=text(r.name)||'Restaurace';const city=text(r.city)||regionOf(r)||'Česká republika';
    const cuisine=text(r.cuisine||r.cuisine_type||r.category)||'Restaurace';
    const desc=text(r.short_description||r.description)||'Podnik vybraný podle vašeho zadání.';
    const image=text(r.image_url||r.image||r.photo_url||r.cover_image||r.thumbnail_url);
    const id=encodeURIComponent(r.id||r.slug||name);const href=r.slug?`restaurace-detail.html?slug=${encodeURIComponent(r.slug)}`:`restaurace-detail.html?id=${id}`;
    const match=Math.min(99,Math.max(55,item.score));
    return `<article class="ai-card"><div class="ai-card-image"${image?` style="background-image:url('${escapeAttr(image)}')"`:''}><span class="ai-match">${index===0?'Nejlepší shoda · ':''}${match}%</span></div><div class="ai-card-body"><h3>${escapeHtml(name)}</h3><div class="ai-meta">${escapeHtml(city)} · ${escapeHtml(cuisine)}</div><div class="ai-desc">${escapeHtml(desc.slice(0,150))}</div><div class="ai-reasons">${(item.reasons.length?item.reasons:['Doporučeno podle vašeho zadání']).map(x=>`<span>✓ ${escapeHtml(x)}</span>`).join('')}</div><div class="ai-card-actions"><a href="${href}">Zobrazit detail</a><a class="secondary" href="collections.html">Můj výběr</a></div></div></article>`;
  }
  function escapeHtml(v){return text(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function escapeAttr(v){return text(v).replace(/['"()]/g,'');}
})();