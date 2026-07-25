(async function initRecommendationCard(){
  if(!location.pathname.endsWith('/restaurace.html'))return;
  const box=document.getElementById('recommendedCarousel');
  if(!box)return;

  box.innerHTML=`<div class="recommend-content">
    <div class="recommend-image-wrap">
      <img id="recommendImage" class="recommend-image" alt="Doporučená restaurace" loading="eager">
      <div class="recommend-image-overlay"></div>
      <div class="recommend-label">★ <span>Doporučeno dnes</span></div>
    </div>
    <div class="recommend-body">
      <h2 id="recommendName">Načítám doporučení…</h2>
      <p id="recommendTag">Připravuji vybranou restauraci.</p>
      <div class="recommend-meta">
        <div class="recommend-rating"><span class="stars">★★★★★</span><span id="recommendRating">–</span></div>
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
  const text=value=>String(value??'').trim();
  let items=[],index=0,timer;

  const shuffle=list=>list.map(value=>({value,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(item=>item.value);
  const imageOf=r=>text(r.image_url||r.image||r.photo_url)||'images/gurmao-hero-restaurant.jpg';
  const ratingOf=r=>Number(r.google_rating||r.rating||r.average_rating||0);

  function show(i){
    if(!items.length)return;
    index=(i+items.length)%items.length;
    const r=items[index];
    box.classList.add('is-changing');
    setTimeout(()=>{
      imageEl.src=imageOf(r);
      imageEl.alt=text(r.name)||'Doporučená restaurace';
      nameEl.textContent=text(r.name)||'Restaurace';
      tagEl.textContent=text(r.tag||r.description)||'Místo, které stojí za objev.';
      const rating=ratingOf(r);
      ratingEl.textContent=rating>0?rating.toFixed(1).replace('.',','):'Novinka';
      locationEl.textContent=text(r.city)||'Česká republika';
      linkEl.href=r.slug?`restaurace-${encodeURIComponent(r.slug)}.html`:'#restaurantsList';
      [...dotsEl.children].forEach((dot,n)=>dot.classList.toggle('active',n===index));
      box.classList.remove('is-changing');
    },220);
  }

  const restart=()=>{clearInterval(timer);timer=setInterval(()=>show(index+1),30000)};

  try{
    const {supabase}=await import('./supabase-client.js');
    const {data,error}=await supabase.from('restaurants').select('*').not('slug','is',null).limit(100);
    if(error)throw error;
    const valid=(data||[]).filter(r=>text(r.name)&&text(r.slug)&&imageOf(r));
    items=shuffle(valid).slice(0,Math.min(8,valid.length));
    if(!items.length)throw new Error('Nebyla nalezena žádná restaurace pro doporučení.');
    dotsEl.innerHTML=items.map((_,i)=>`<button class="recommend-dot${i===0?' active':''}" aria-label="Zobrazit doporučení ${i+1}" data-index="${i}"></button>`).join('');
    dotsEl.addEventListener('click',event=>{const dot=event.target.closest('[data-index]');if(!dot)return;show(Number(dot.dataset.index));restart();});
    box.addEventListener('mouseenter',()=>clearInterval(timer));
    box.addEventListener('mouseleave',restart);
    show(0);
    restart();
  }catch(error){
    console.error('Recommendation card failed:',error);
    imageEl.src='images/gurmao-hero-restaurant.jpg';
    nameEl.textContent='Objevte svůj nový podnik';
    tagEl.textContent='Vyberte podle chuti, atmosféry a vzdálenosti.';
    ratingEl.textContent='4,8';
  }
})();
