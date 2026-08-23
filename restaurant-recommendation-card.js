(async function initRecommendationCard(){
  if(!location.pathname.endsWith('/restaurace.html'))return;
  const box=document.getElementById('recommendedCarousel');
  if(!box)return;

  box.innerHTML=`<div class="recommend-content">
    <div class="recommend-image-wrap">
      <img id="recommendImage" class="recommend-image" alt="Doporučená restaurace" loading="eager" decoding="async">
      <div class="recommend-image-overlay"></div>
      <div class="recommend-label">★ <span>Doporučeno dnes</span></div>
    </div>
    <div class="recommend-body">
      <h2 id="recommendName">Načítám doporučení…</h2>
      <p id="recommendTag">Vybírám z aktuálních restaurací.</p>
      <div class="recommend-meta">
        <div class="recommend-rating"><span class="stars" aria-hidden="true">★</span><span id="recommendRating">–</span></div>
        <div class="recommend-location">⌖ <span id="recommendLocation">Česká republika</span></div>
      </div>
      <a class="recommend-btn" id="recommendLink" href="#restaurantsList">Zobrazit restauraci&nbsp; →</a>
      <div class="recommend-dots" id="recommendDots"></div>
    </div>
  </div>`;

  const imageEl=document.getElementById('recommendImage');
  const nameEl=document.getElementById('recommendName');
  const tagEl=document.getElementById('recommendTag');
  const ratingEl=document.getElementById('recommendRating');
  const locationEl=document.getElementById('recommendLocation');
  const linkEl=document.getElementById('recommendLink');
  const dotsEl=document.getElementById('recommendDots');
  const fallback='images/gurmao-hero-restaurant.jpg';
  const text=value=>String(value??'').trim();
  const ratingOf=restaurant=>Number(restaurant.google_rating||0);
  let items=[],index=0,timer,changeId=0;

  function preload(src){
    return new Promise(resolve=>{
      if(!src){resolve(fallback);return;}
      const img=new Image();
      const timeout=setTimeout(()=>resolve(fallback),2500);
      img.onload=()=>{clearTimeout(timeout);resolve(src);};
      img.onerror=()=>{clearTimeout(timeout);resolve(fallback);};
      img.src=src;
    });
  }

  async function show(nextIndex){
    if(!items.length)return;
    const id=++changeId;
    index=(nextIndex+items.length)%items.length;
    const restaurant=items[index];
    const src=await preload(text(restaurant.image_url));
    if(id!==changeId)return;

    box.classList.add('is-changing');
    setTimeout(()=>{
      if(id!==changeId)return;
      imageEl.src=src;
      imageEl.alt=text(restaurant.name)||'Doporučená restaurace';
      imageEl.onerror=()=>{imageEl.onerror=null;imageEl.src=fallback;};
      nameEl.textContent=text(restaurant.name)||'Restaurace';
      tagEl.textContent=text(restaurant.tag||restaurant.description)||'Místo, které stojí za objevení.';
      const rating=ratingOf(restaurant);
      const reviews=Number(restaurant.google_review_count||0);
      ratingEl.textContent=rating>0
        ? `${rating.toFixed(1).replace('.',',')}${reviews>0?` · ${reviews.toLocaleString('cs-CZ')}`:''}`
        : 'Bez hodnocení';
      locationEl.textContent=text(restaurant.city)||'Česká republika';
      linkEl.href=`restaurant.html?slug=${encodeURIComponent(restaurant.slug||restaurant.id||'')}`;
      [...dotsEl.children].forEach((dot,n)=>dot.classList.toggle('active',n===index));
      box.classList.remove('is-changing');
    },100);
  }

  const restart=()=>{clearInterval(timer);timer=setInterval(()=>show(index+1),30000);};

  try{
    const {supabase}=await import('./supabase-client.js');
    const {data,error}=await supabase
      .from('restaurants')
      .select('id,name,slug,city,tag,description,image_url,google_rating,google_review_count')
      .not('slug','is',null)
      .not('google_rating','is',null)
      .order('google_rating',{ascending:false,nullsFirst:false})
      .order('google_review_count',{ascending:false,nullsFirst:false})
      .limit(12);
    if(error)throw error;

    const valid=(data||[]).filter(restaurant=>text(restaurant.name)&&text(restaurant.slug));
    items=valid.slice(0,Math.min(6,valid.length));
    if(!items.length)throw new Error('Nebyla nalezena žádná restaurace pro doporučení.');

    dotsEl.replaceChildren();
    items.forEach((_,dotIndex)=>{
      const dot=document.createElement('button');
      dot.className=`recommend-dot${dotIndex===0?' active':''}`;
      dot.type='button';
      dot.setAttribute('aria-label',`Zobrazit doporučení ${dotIndex+1}`);
      dot.dataset.index=String(dotIndex);
      dotsEl.appendChild(dot);
    });
    dotsEl.addEventListener('click',event=>{
      const dot=event.target.closest('[data-index]');
      if(!dot)return;
      show(Number(dot.dataset.index));
      restart();
    });
    box.addEventListener('mouseenter',()=>clearInterval(timer));
    box.addEventListener('mouseleave',restart);
    await show(0);
    restart();
  }catch(error){
    console.error('Recommendation card failed:',error);
    imageEl.src=fallback;
    nameEl.textContent='Doporučení teď není dostupné';
    tagEl.textContent='Restaurace můžeš dál vyhledat podle chuti, města nebo atmosféry.';
    ratingEl.textContent='—';
    locationEl.textContent='Česká republika';
    linkEl.href='#restaurantsList';
    linkEl.textContent='Procházet restaurace →';
  }
})();