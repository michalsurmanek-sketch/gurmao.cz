(async function initGurmaoBook(){
  if(!location.pathname.endsWith('/collections.html')) return;
  const main=document.querySelector('main');
  if(!main) return;

  const safe=(value='')=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const imageFallback='images/gurmao-hero-restaurant.jpg';

  let user=null;
  let saved=[];
  try{
    const module=await import('./supabase-client.js');
    const auth=await module.supabase.auth.getUser();
    user=auth?.data?.user||null;
    saved=await module.getSavedRestaurants();
  }catch(error){
    console.warn('Moje kniha používá omezený režim:',error);
    saved=[];
  }

  const restaurants=saved.map(item=>item?.restaurants).filter(Boolean);
  const notes=readJson('gurmao_book_notes',{});
  const visited=readJson('gurmao_book_visited',[]);
  const reviews=readJson('gurmao_book_reviews',[]);
  const photos=readJson('gurmao_book_photos',[]);
  const chefs=readJson('gurmao_book_chefs',[]);
  const displayName=user?.user_metadata?.name||user?.email?.split('@')[0]||'Gurmán';
  const level=Math.max(1,Math.floor((restaurants.length+visited.length+reviews.length)/5)+1);
  const progress=Math.min(100,((restaurants.length+visited.length+reviews.length)%5)*20);
  const uniqueCities=[...new Set(restaurants.map(r=>r.city||r.location).filter(Boolean))];
  const uniqueCategories=[...new Set(restaurants.map(r=>r.category).filter(Boolean))];

  main.className='book-shell';
  main.innerHTML=`
    <section class="book-hero">
      <div class="book-eyebrow">Osobní gastronomický deník</div>
      <h1 class="book-title">Moje kniha</h1>
      <p class="book-subtitle">Oblíbené podniky, místa k návštěvě, vzpomínky, poznámky a tvoje gastronomické úspěchy na jednom místě.</p>
      <div class="book-actions">
        <a class="book-button primary" href="restaurace.html">Objevovat restaurace</a>
        <a class="book-button" href="mapa.html">Otevřít mapu</a>
        <button class="book-button" id="bookExport">Exportovat přehled</button>
      </div>
      <div class="book-profile">
        <div class="book-avatar">${safe(displayName.charAt(0).toUpperCase())}</div>
        <div><strong style="font-size:1.2rem">${safe(displayName)}</strong><div class="book-muted">Gurmán · člen GURMAO</div></div>
        <div class="book-level"><strong>Úroveň ${level}</strong><div class="book-progress"><span style="width:${progress}%"></span></div><small class="book-muted">${progress}% k další úrovni</small></div>
      </div>
    </section>

    <nav class="book-tabs" aria-label="Sekce Moje kniha">
      <button class="book-tab active" data-book-tab="overview">Přehled</button>
      <button class="book-tab" data-book-tab="wishlist">Chci navštívit</button>
      <button class="book-tab" data-book-tab="timeline">Časová osa</button>
      <button class="book-tab" data-book-tab="achievements">Úspěchy</button>
      <button class="book-tab" data-book-tab="notes">Poznámky</button>
      <button class="book-tab" data-book-tab="year">Gurmán roku</button>
    </nav>

    <section class="book-panel active" data-book-panel="overview">
      <div class="book-section">
        <div class="book-stats">
          ${stat('🍽',restaurants.length,'Uložených podniků')}
          ${stat('📍',uniqueCities.length,'Měst v knize')}
          ${stat('📝',reviews.length,'Mých recenzí')}
          ${stat('📷',photos.length,'Fotografií')}
          ${stat('👨‍🍳',chefs.length,'Oblíbených kuchařů')}
          ${stat('✅',visited.length,'Navštívených míst')}
          ${stat('🌍',uniqueCategories.length,'Typů kuchyní')}
          ${stat('⭐',restaurants.length?Math.min(5,4.2+restaurants.length/100).toFixed(1).replace('.',','):'–','Chuťové skóre')}
        </div>
      </div>
      <div class="book-section">
        <div class="book-section-head"><div><h2>Tvoje gastronomická mapa</h2><p class="book-muted">Místa, která máš uložená ve své knize.</p></div><a class="book-button" href="mapa.html">Zobrazit mapu</a></div>
        <div class="book-map"><div><div style="font-size:3rem">🗺️</div><strong>${uniqueCities.length} ${uniqueCities.length===1?'město':'měst'}</strong><p class="book-muted">${uniqueCities.length?safe(uniqueCities.slice(0,6).join(' · ')):'Začni ukládat restaurace a tvoje mapa se zaplní.'}</p></div></div>
      </div>
      <div class="book-section"><div class="book-section-head"><div><h2>Poslední uložené</h2><p class="book-muted">Tvůj aktuální výběr podniků.</p></div></div>${restaurantGrid(restaurants.slice(0,6))}</div>
    </section>

    <section class="book-panel" data-book-panel="wishlist">
      <div class="book-section"><div class="book-section-head"><div><h2>Chci navštívit</h2><p class="book-muted">Uložené restaurace, které čekají na návštěvu.</p></div></div>${restaurantGrid(restaurants,true)}</div>
    </section>

    <section class="book-panel" data-book-panel="timeline">
      <div class="book-section"><div class="book-section-head"><div><h2>Časová osa</h2><p class="book-muted">Přehled aktivit v tvé gastronomické knize.</p></div></div><div class="book-timeline">${timeline()}</div></div>
    </section>

    <section class="book-panel" data-book-panel="achievements">
      <div class="book-section"><div class="book-section-head"><div><h2>Úspěchy</h2><p class="book-muted">Odemykej odznaky objevováním nových chutí.</p></div></div><div class="book-achievements">${achievements()}</div></div>
    </section>

    <section class="book-panel" data-book-panel="notes">
      <div class="book-section"><div class="book-section-head"><div><h2>Soukromé poznámky</h2><p class="book-muted">Vidíš je jen ty v tomto prohlížeči.</p></div><button class="book-button primary" id="saveBookNotes">Uložit poznámky</button></div><textarea id="bookNotes" class="book-note" placeholder="Například: příště rezervovat stůl u okna, ochutnat degustační menu…">${safe(notes.general||'')}</textarea></div>
    </section>

    <section class="book-panel" data-book-panel="year">
      <div class="book-section"><div class="book-share-card"><div class="book-eyebrow">Gurmán roku ${new Date().getFullYear()}</div><h2 style="font-size:2.25rem;margin:.5rem 0">Tvoje chuťová cesta</h2><div class="book-stats" style="margin-top:18px">${stat('🍽',restaurants.length,'Podniků')}${stat('📍',uniqueCities.length,'Měst')}${stat('📝',reviews.length,'Recenzí')}${stat('📷',photos.length,'Fotografií')}</div><p class="book-muted" style="margin-top:18px">Tento přehled se automaticky rozšiřuje podle aktivit uložených v GURMAO.</p></div></div>
    </section>`;

  function stat(icon,value,label){return `<div class="book-stat"><div class="book-stat-icon">${icon}</div><strong>${safe(value)}</strong><span>${safe(label)}</span></div>`}
  function restaurantGrid(list,visitMode=false){
    if(!list.length)return `<div class="book-empty"><div style="font-size:2.5rem">📖</div><h3 style="font-size:1.5rem;margin-top:10px">Tvoje kniha je zatím prázdná</h3><p class="book-muted">Ulož si první restauraci a začne se zde tvořit tvoje osobní gastronomická historie.</p><a class="book-button primary" style="margin-top:16px" href="restaurace.html">Najít restauraci</a></div>`;
    return `<div class="book-grid">${list.map(r=>{const slug=safe(r.slug||'');const img=safe(r.image_url||r.image||imageFallback);const place=safe(r.city||r.location||'Česká republika');return `<article class="book-card book-restaurant"><a href="restaurace-${slug}.html"><div class="book-restaurant-image" style="background-image:url('${img}')"><span class="book-badge">${visitMode?'Chci navštívit':'Uloženo v knize'}</span></div></a><div class="book-restaurant-body"><h3>${safe(r.name||'Restaurace')}</h3><div class="book-restaurant-meta">${place}${r.category?' · '+safe(r.category):''}</div><div class="book-card-actions"><a class="book-small-button" href="restaurace-${slug}.html">Detail</a><button class="book-small-button" data-visited="${slug}">${visited.includes(r.slug)?'Navštíveno ✓':'Označit návštěvu'}</button></div></div></article>`}).join('')}</div>`;
  }
  function timeline(){
    const events=[];
    restaurants.slice(0,5).forEach((r,i)=>events.push({icon:'❤️',title:`Uložena restaurace ${safe(r.name||'')}`,text:i===0?'Naposledy přidáno':'Ve tvém výběru'}));
    visited.slice(-3).reverse().forEach(slug=>{const r=restaurants.find(item=>item.slug===slug);events.push({icon:'✅',title:`Navštíveno ${safe(r?.name||slug)}`,text:'Označeno v Moje kniha'});});
    if(!events.length)return `<div class="book-empty">Až začneš ukládat a navštěvovat podniky, objeví se zde tvoje časová osa.</div>`;
    return events.map(e=>`<div class="book-timeline-item"><div class="book-timeline-icon">${e.icon}</div><div><strong>${e.title}</strong><div class="book-muted">${e.text}</div></div></div>`).join('');
  }
  function achievements(){
    const list=[['🥇','První restaurace',restaurants.length>=1],['🍽','Objevitel 10',restaurants.length>=10],['🏙️','Pět měst',uniqueCities.length>=5],['🌍','Pestré chutě',uniqueCategories.length>=5],['✅','První návštěva',visited.length>=1],['📝','První recenze',reviews.length>=1],['📷','Fotograf',photos.length>=5],['👨‍🍳','Fanoušek kuchařů',chefs.length>=3]];
    return list.map(([icon,label,ok])=>`<div class="book-achievement ${ok?'unlocked':''}"><div class="book-achievement-icon">${icon}</div><strong>${label}</strong><div class="book-muted">${ok?'Odemčeno':'Zatím zamčeno'}</div></div>`).join('');
  }

  document.querySelectorAll('[data-book-tab]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-book-tab]').forEach(x=>x.classList.toggle('active',x===button));
    document.querySelectorAll('[data-book-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.bookPanel===button.dataset.bookTab));
  }));
  document.querySelectorAll('[data-visited]').forEach(button=>button.addEventListener('click',()=>{
    const slug=button.dataset.visited;
    const index=visited.indexOf(slug);
    if(index>=0){visited.splice(index,1);button.textContent='Označit návštěvu'}else{visited.push(slug);button.textContent='Navštíveno ✓'}
    writeJson('gurmao_book_visited',visited);
  }));
  document.getElementById('saveBookNotes')?.addEventListener('click',()=>{
    writeJson('gurmao_book_notes',{...notes,general:document.getElementById('bookNotes').value});
    window.toastInfo?.('Poznámky byly uloženy')||alert('Poznámky byly uloženy');
  });
  document.getElementById('bookExport')?.addEventListener('click',()=>window.print());
})();