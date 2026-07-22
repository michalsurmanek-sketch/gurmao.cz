import { supabase } from './supabase-client.js';

const VIBE_PARAM_TO_FILTER = Object.freeze({
  luxe: '🍷 LUXE', drama: '🔥 DRAMA', chaos: '🌮 CHAOS',
  pure: '🌿 PURE', dark: '🖤 DARK', calm: '🌊 CALM'
});
const FILTER_TO_VIBE_PARAM = Object.fromEntries(Object.entries(VIBE_PARAM_TO_FILTER).map(([k,v]) => [v,k]));
const params = new URLSearchParams(location.search);
const savedView = localStorage.getItem('gurmaoRestaurantView');

const state = {
  search: sanitize(params.get('q') || ''),
  cuisine: sanitize(params.get('cuisine') || ''),
  city: sanitize(params.get('city') || ''),
  vibe: VIBE_PARAM_TO_FILTER[(params.get('vibe') || '').toLowerCase()] || 'all',
  sort: params.get('sort') || 'recommended',
  view: savedView === 'rows' ? 'rows' : 'cards',
  userLocation: null,
  page: 0,
  pageSize: 30,
  perPage: innerWidth < 768 ? 12 : 24,
  total: 0,
  loading: false,
  hasMore: true,
  requestId: 0,
  rows: [],
  shown: 0
};

function sanitize(value) {
  return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function updateUrl() {
  const p = new URLSearchParams();
  if (state.search) p.set('q', state.search);
  if (state.cuisine) p.set('cuisine', state.cuisine);
  if (state.city) p.set('city', state.city);
  if (state.vibe !== 'all') p.set('vibe', FILTER_TO_VIBE_PARAM[state.vibe]);
  if (state.sort !== 'recommended') p.set('sort', state.sort);
  history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
}
function distanceKm(lat1, lon1, lat2, lon2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function sortedRows() {
  const rows=[...state.rows];
  const collator=new Intl.Collator('cs',{sensitivity:'base'});
  if (state.userLocation) rows.forEach(r => r.distance = Number(r.latitude) && Number(r.longitude) ? distanceKm(state.userLocation.lat,state.userLocation.lng,Number(r.latitude),Number(r.longitude)) : Infinity);
  if (state.sort==='distance') rows.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
  else if (state.sort==='name-asc') rows.sort((a,b)=>collator.compare(a.name||'',b.name||''));
  else if (state.sort==='name-desc') rows.sort((a,b)=>collator.compare(b.name||'',a.name||''));
  else if (state.sort==='rating-desc') rows.sort((a,b)=>Number(b.rating||b.average_rating||0)-Number(a.rating||a.average_rating||0));
  return rows;
}
function buildQuery(from,to) {
  let q=supabase.from('restaurants').select('*',{count:'exact'});
  if (state.vibe!=='all') q=q.eq('vibe',state.vibe);
  if (state.city) q=q.ilike('city',state.city);
  if (state.cuisine) q=q.ilike('tag',`%${state.cuisine}%`);
  if (state.search) {
    const s=state.search.replace(/[,%()]/g,' '), pattern=`%${s}%`;
    q=q.or(`name.ilike.${pattern},description.ilike.${pattern},tag.ilike.${pattern},city.ilike.${pattern}`);
  }
  if (state.sort==='name-asc') q=q.order('name',{ascending:true});
  else if (state.sort==='name-desc') q=q.order('name',{ascending:false});
  else if (state.sort==='rating-desc') q=q.order('rating',{ascending:false,nullsFirst:false});
  else q=q.order('created_at',{ascending:false});
  return q.range(from,to);
}
async function load(reset=false) {
  if (state.loading) return;
  if (reset) {
    state.requestId++; state.page=0; state.total=0; state.hasMore=true; state.rows=[]; state.shown=0;
    document.getElementById('loadMoreBtn')?.remove();
    setCount('Hledám odpovídající restaurace…');
  }
  if (!state.hasMore) return;
  const requestId=state.requestId, from=state.page*state.pageSize, to=from+state.pageSize-1;
  state.loading=true; toggleSpinner(true);
  try {
    const {data,error,count}=await buildQuery(from,to);
    if (requestId!==state.requestId) return;
    if (error) throw error;
    const batch=data||[];
    state.total=count||0;
    state.rows=reset ? batch : [...state.rows,...batch];
    state.page++;
    state.hasMore=state.rows.length<state.total;
    state.shown=Math.min(state.rows.length, reset ? state.perPage : state.shown+state.perPage);
    render();
  } catch (error) {
    console.error('Restaurant search failed:',error);
    const list=document.getElementById('restaurantsList');
    if (list) list.innerHTML='<div class="col-span-full text-center py-20"><p class="text-gurmaored text-lg">Vyhledávání se nepodařilo načíst.</p><button id="retryRestaurants" class="mt-4 px-6 py-3 rounded-full bg-gurmaogold text-black">Zkusit znovu</button></div>';
    document.getElementById('retryRestaurants')?.addEventListener('click',()=>load(true));
  } finally { state.loading=false; toggleSpinner(false); }
}
function setCount(text) { const el=document.getElementById('resultCount'); if(el) el.textContent=text; }
function toggleSpinner(show) { document.getElementById('loadingSpinner')?.classList.toggle('hidden',!show); }
function formatDistance(km) { return km<1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`; }
function formatMenuDate(date = new Date()) {
  const formatted = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Prague'
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function card(r) {
  const image=escapeHtml(r.image_url||r.image||r.photo_url||'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800');
  const slug=escapeHtml(r.slug||'');
  const name=escapeHtml(r.name||'Restaurace');
  const city=escapeHtml(r.city||'');
  const tag=escapeHtml(r.tag||'');
  const vibe=escapeHtml(r.vibe||'');
  const distance=Number.isFinite(r.distance)?` · <span class="text-gurmaogold">${formatDistance(r.distance)}</span>`:'';
  const menuDate=escapeHtml(formatMenuDate());

  if (state.view === 'rows') {
    return `<article class="restaurant-row"><a href="restaurace-${slug}.html" class="restaurant-row-image"><img src="${image}" alt="${name}" loading="lazy" decoding="async"></a><div class="restaurant-row-main"><div class="restaurant-row-vibe">${vibe}</div><h3>${name}</h3><p>${city}${city&&tag?' · ':''}${tag}${distance}</p></div><div class="restaurant-row-actions"><button data-save="${slug}" class="save-btn" aria-label="Uložit restauraci">🤍</button><a href="restaurace-${slug}.html" class="restaurant-row-detail">Detail</a></div></article>`;
  }

  const shareData=escapeHtml(JSON.stringify({id:r.slug,name:r.name,vibe:r.vibe,city:r.city,tag:r.tag,img:image,href:`restaurace-${r.slug}.html`}));
  const menuItems=[
    {name:'Hovězí tatarák',desc:'s trhaným žloutkem',price:'380 Kč',image:'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=180&q=80'},
    {name:'Grilovaný losos',desc:'s citrusovou salsou',price:'450 Kč',image:'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=180&q=80'},
    {name:'Pasta carbonara',desc:'domácí těstoviny',price:'320 Kč',image:'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=180&q=80'},
    {name:'Degustační menu',desc:'5 chodů',price:'1250 Kč',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=180&q=80'}
  ];

  return `<div class="card-wrapper" style="perspective:1200px;">
    <div class="card-inner" style="position:relative;width:100%;transition:transform .4s ease-in-out;transform-style:preserve-3d;">
      <div class="card-front rounded-3xl bg-white/5 overflow-hidden" style="backface-visibility:hidden;">
        <div class="relative">
          <a href="restaurace-${slug}.html" class="block"><img src="${image}" alt="${name}" loading="lazy" decoding="async" class="aspect-[3/4] w-full h-full object-cover"></a>
          ${vibe ? `<div class="absolute top-3 left-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur border border-gurmaogold/60 text-sm text-gurmaogold font-semibold">${vibe}</div>` : ''}
          <div class="absolute top-3 right-3 flex gap-2">
            <button data-save="${slug}" class="save-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" aria-label="Uložit">🤍</button>
            <button class="share-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" data-restaurant="${shareData}" title="Sdílet" aria-label="Sdílet"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
          </div>
        </div>
        <div class="p-6">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex-1"><h3 class="text-xl font-semibold">${name}</h3><p class="text-white/60 text-sm mt-1">${city}${city&&tag?' · ':''}${tag}${distance}</p></div>
            <button class="flip-btn hidden md:flex w-11 h-11 rounded-full bg-gurmaogold text-black hover:bg-gurmaogold/80 transition items-center justify-center flex-shrink-0" title="Zobrazit menu" aria-label="Zobrazit menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg></button>
          </div>
          <div data-restaurant-rating="${slug}"><div class="border-t border-white/10 pt-3 mt-3"><div class="flex items-center gap-2 mb-2"><div class="inline-flex items-center gap-0.5 text-sm"><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span></div><span class="text-xs text-white/40">—</span></div><div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div><div class="inline-flex items-center gap-1 text-base"><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span><span class="text-white/20">⭐</span></div></div></div>
        </div>
      </div>
      <div class="card-back rounded-3xl bg-white/5 overflow-hidden" style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);">
        <div class="flex flex-col h-full p-6"><div class="mb-4"><h3 class="text-xl font-semibold mb-1">${name}</h3><p class="text-gurmaogold text-sm">Dnešní menu</p><p class="menu-date mt-1 flex items-center gap-1.5 text-xs text-white/55"><span aria-hidden="true">▣</span><span>${menuDate}</span></p></div><div class="flex-1 overflow-y-auto space-y-3">${menuItems.map(item=>`<div class="border-b border-white/10 pb-3"><div class="flex justify-between items-center gap-3"><img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" style="width:58px;height:58px;flex:0 0 58px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.12);"><div class="flex-1 min-w-0"><div class="font-medium">${item.name}</div><div class="text-sm text-white/60 mt-0.5">${item.desc}</div></div><div class="text-gurmaogold font-semibold whitespace-nowrap">${item.price}</div></div></div>`).join('')}</div><div class="mt-4 flex gap-2"><a href="restaurace-${slug}.html" class="flex-1 px-4 py-2 rounded-full bg-gurmaogold text-black text-center font-semibold hover:bg-gurmaogold/80 transition">Detail</a><button class="flip-back-btn px-4 py-2 rounded-full border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition">Zpět</button></div></div>
      </div>
    </div>
  </div>`;
}

function initializeCardInteractions(rows) {
  document.querySelectorAll('.card-wrapper').forEach(wrapper=>{
    const inner=wrapper.querySelector('.card-inner');
    wrapper.querySelector('.flip-btn')?.addEventListener('click',()=>{inner.style.transform='rotateY(180deg)';});
    wrapper.querySelector('.flip-back-btn')?.addEventListener('click',()=>{inner.style.transform='rotateY(0deg)';});
  });
  if (window.ratingManager) {
    rows.forEach(async restaurant=>{
      const container=document.querySelector(`[data-restaurant-rating="${CSS.escape(String(restaurant.slug||''))}"]`);
      if (!container) return;
      try {
        const average=await window.ratingManager.getAverageRating(restaurant.slug);
        let html='<div class="border-t border-white/10 pt-3 mt-3">';
        if (average && average.count>0) html+=window.ratingManager.renderAverageRating(average.average,average.count);
        else html+='<div class="text-xs text-white/40 mb-2">Zatím nehodnoceno</div>';
        html+='<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
        html+=await window.ratingManager.renderInteractiveStars(restaurant.slug,0);
        html+='</div>';
        container.innerHTML=html;
      } catch (error) { console.error('Rating init failed:',error); }
    });
  }
}

function render() {
  const list=document.getElementById('restaurantsList'); if(!list) return;
  const rows=sortedRows();
  list.classList.toggle('restaurants-row-view',state.view==='rows');
  list.dataset.view=state.view;
  setCount(`Celkem: ${state.total} restaurací`);
  if (!rows.length) { list.innerHTML='<div class="col-span-full text-center py-20"><p class="text-white/50 text-lg">Žádné restaurace neodpovídají zvoleným filtrům.</p></div>'; document.getElementById('loadMoreBtn')?.remove(); return; }
  const visible=rows.slice(0,state.shown);
  list.innerHTML=visible.map(card).join('');
  window.filteredRestaurants=rows;
  if (typeof window.updateSaveButtons==='function') window.updateSaveButtons();
  if (state.view==='cards') initializeCardInteractions(visible);
  updateLoadMore();
  syncControls();
}
function updateLoadMore() {
  document.getElementById('loadMoreBtn')?.remove();
  const localMore=state.shown<state.rows.length;
  if (!localMore&&!state.hasMore) return;
  const wrap=document.createElement('div'); wrap.id='loadMoreBtn'; wrap.className='flex justify-center py-8';
  wrap.innerHTML='<button class="px-8 py-3 rounded-full bg-gurmaogold text-black font-semibold">Načíst další</button>';
  wrap.querySelector('button').addEventListener('click',async()=>{
    if(state.shown<state.rows.length){state.shown=Math.min(state.rows.length,state.shown+state.perPage);render();}
    else await load(false);
  });
  document.getElementById('restaurantsList')?.insertAdjacentElement('afterend',wrap);
}
function applyState(patch,{reload=true}={}) { Object.assign(state,patch); updateUrl(); syncControls(); if(reload) load(true); else render(); }
function setView(view) { state.view=view==='rows'?'rows':'cards'; localStorage.setItem('gurmaoRestaurantView',state.view); syncControls(); render(); }
function syncControls() {
  const search=document.getElementById('searchInput'); if(search&&search.value!==state.search) search.value=state.search;
  const cuisine=document.getElementById('cuisineFilter'); if(cuisine) cuisine.value=state.cuisine;
  const city=document.getElementById('localityFilter'); if(city) city.value=state.city;
  const sort=document.getElementById('restaurantSort'); if(sort) sort.value=state.sort;
  document.querySelectorAll('#filters button').forEach(btn=>btn.classList.toggle('is-active',(VIBE_PARAM_TO_FILTER[btn.dataset.vibe]||'all')===state.vibe));
  document.querySelectorAll('[data-restaurant-view]').forEach(btn=>{const active=btn.dataset.restaurantView===state.view;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
}
function initializeBaseControls() {
  const search=document.getElementById('searchInput');
  let timer;
  search?.addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>applyState({search:sanitize(e.target.value)}),350);});
  search?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(timer);applyState({search:sanitize(e.target.value)});}});
  document.querySelectorAll('#filters button').forEach(btn=>btn.addEventListener('click',()=>applyState({vibe:VIBE_PARAM_TO_FILTER[btn.dataset.vibe]||'all'})));
  document.querySelectorAll('.per-page-btn').forEach(btn=>btn.addEventListener('click',()=>{state.perPage=Number(btn.dataset.count)||state.perPage;state.shown=Math.min(state.rows.length,state.perPage);render();}));
  document.getElementById('locationBtn')?.addEventListener('click',()=>{
    if(state.sort==='distance'){applyState({sort:'recommended',userLocation:null},{reload:false});return;}
    if(!navigator.geolocation){alert('Váš prohlížeč nepodporuje geolokaci.');return;}
    navigator.geolocation.getCurrentPosition(pos=>applyState({userLocation:{lat:pos.coords.latitude,lng:pos.coords.longitude},sort:'distance'},{reload:false}),()=>alert('Nepodařilo se získat polohu. Zkontrolujte oprávnění prohlížeče.'));
  });
}
window.GurmaoRestaurantSearch={
  getState:()=>({...state}),
  setFilters:patch=>applyState({
    search:patch.search!==undefined?sanitize(patch.search):state.search,
    cuisine:patch.cuisine!==undefined?sanitize(patch.cuisine):state.cuisine,
    city:patch.city!==undefined?sanitize(patch.city):state.city,
    vibe:patch.vibe!==undefined?patch.vibe:state.vibe,
    sort:patch.sort!==undefined?patch.sort:state.sort
  }),
  setView,
  clear:()=>applyState({search:'',cuisine:'',city:'',vibe:'all',sort:'recommended',userLocation:null}),
  reload:()=>load(true)
};

document.addEventListener('DOMContentLoaded',()=>{ initializeBaseControls(); syncControls(); load(true); });
