import { supabase } from './supabase-client.js';

const list = document.getElementById('list');
const empty = document.getElementById('empty');
const summary = document.getElementById('summary');
const search = document.getElementById('search');
const refresh = document.getElementById('refresh');
let restaurants = [];

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function websiteOf(r){return r.website||r.website_url||r.web_url||r.url||'';}

function render(){
  const q=search.value.trim().toLocaleLowerCase('cs');
  const rows=restaurants.filter(r=>!q||`${r.name||''} ${r.city||''}`.toLocaleLowerCase('cs').includes(q));
  summary.textContent=`Zobrazeno ${rows.length} z ${restaurants.length} restaurací · menu nalezeno u ${restaurants.filter(r=>r.menu_url).length}`;
  empty.hidden=rows.length>0;
  list.innerHTML=rows.map(r=>`
    <article class="card" data-id="${esc(r.id)}">
      <div><div class="name">${esc(r.name||'Restaurace')}</div><div class="meta">${esc(r.city||'')} ${websiteOf(r)?'· '+esc(websiteOf(r)): '· web není vyplněn'}</div><div class="url ${r.menu_url?'ok':''}">${r.menu_url?`Menu: ${esc(r.menu_url)}`:'Menu URL zatím nenalezena'}</div><div class="status" data-status></div></div>
      <div class="actions"><button class="btn btn-primary" data-action="discover" ${websiteOf(r)?'':'disabled'}>🤖 Najít menu automaticky</button>${r.menu_url?`<a class="btn" href="${esc(r.menu_url)}" target="_blank" rel="noopener">Otevřít ↗</a>`:''}</div>
    </article>`).join('');
}

async function load(){
  refresh.disabled=true;
  const {data,error}=await supabase.from('restaurants').select('id,name,city,website,website_url,web_url,url,menu_url,menu_last_checked').order('name').limit(2000);
  refresh.disabled=false;
  if(error){window.toast?.show(`Načtení selhalo: ${error.message}`,'error');return;}
  restaurants=data||[];render();
}

async function discover(restaurant,card,button){
  const status=card.querySelector('[data-status]');
  button.disabled=true;status.textContent='Prohledávám oficiální web…';
  try{
    const {data,error}=await supabase.functions.invoke('discover-menu',{body:{restaurant_id:restaurant.id}});
    if(error) throw error;
    if(!data?.menu_url) throw new Error(data?.message||'Stránka s menu nebyla nalezena');
    restaurant.menu_url=data.menu_url;
    status.textContent=`Nalezeno se skóre ${data.score??'–'}`;
    window.toast?.show('Menu URL byla nalezena a uložena','success');
    render();
  }catch(error){status.textContent='Nenalezeno';window.toast?.show(`Hledání selhalo: ${error.message}`,'error');}
  finally{button.disabled=false;}
}

list.addEventListener('click',event=>{
  const button=event.target.closest('[data-action="discover"]');if(!button)return;
  const card=button.closest('[data-id]');const restaurant=restaurants.find(r=>String(r.id)===card.dataset.id);if(restaurant)discover(restaurant,card,button);
});
search.addEventListener('input',render);refresh.addEventListener('click',load);load();
