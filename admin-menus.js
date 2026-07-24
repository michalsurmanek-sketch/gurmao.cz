import { supabase } from './supabase-client.js';

const list=document.getElementById('list');
const empty=document.getElementById('empty');
const summary=document.getElementById('summary');
const search=document.getElementById('search');
const refresh=document.getElementById('refresh');
let restaurants=[];

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function websiteOf(r){return r.website||r.website_url||r.web_url||r.url||r.homepage||r.site_url||'';}
function sourceLabel(r){if(r.menu_source==='pdf'||/\.pdf(?:$|[?#])/i.test(r.menu_url||''))return 'PDF';if(r.menu_source==='website')return 'WEB';return r.menu_url?'URL':'—';}

function render(){
  const q=search.value.trim().toLocaleLowerCase('cs');
  const rows=restaurants.filter(r=>!q||`${r.name||''} ${r.city||''}`.toLocaleLowerCase('cs').includes(q));
  summary.textContent=`Zobrazeno ${rows.length} z ${restaurants.length} restaurací · menu nalezeno u ${restaurants.filter(r=>r.menu_url).length}`;
  empty.hidden=rows.length>0;
  list.innerHTML=rows.map(r=>`
    <article class="card" data-id="${esc(r.id)}">
      <div>
        <div class="name">${esc(r.name||'Restaurace')} ${r.menu_url?`<span class="source-badge">${sourceLabel(r)}</span>`:''}</div>
        <div class="meta">${esc(r.city||'')} ${websiteOf(r)?'· '+esc(websiteOf(r)):'· web není vyplněn'}</div>
        <div class="url ${r.menu_url?'ok':''}">${r.menu_url?`Menu: ${esc(r.menu_url)}`:'Menu URL zatím nenalezena'}</div>
        <div class="manual-row"><input data-menu-url type="url" inputmode="url" placeholder="Vlož přímý odkaz na PDF nebo stránku menu" value="${esc(r.menu_url||'')}"><button class="btn" data-action="save-url">✓ Ověřit a uložit URL</button></div>
        <div class="status" data-status></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" data-action="discover" ${websiteOf(r)?'':'disabled'}>🤖 Najít menu automaticky</button>
        ${r.menu_url?`<a class="btn" href="${esc(r.menu_url)}" target="_blank" rel="noopener">Otevřít ↗</a>`:''}
      </div>
    </article>`).join('');
}

async function load(){
  refresh.disabled=true;
  const {data,error}=await supabase.from('restaurants').select('*').order('name').limit(2000);
  refresh.disabled=false;
  if(error){window.toast?.show(`Načtení selhalo: ${error.message}`,'error');return;}
  restaurants=data||[];render();
}

async function invokeDiscovery(restaurant,card,button,menuUrl=''){
  const status=card.querySelector('[data-status]');
  button.disabled=true;
  status.textContent=menuUrl?'Ověřuji odkaz a typ souboru…':'Prohledávám oficiální web včetně PDF…';
  try{
    const body={restaurant_id:restaurant.id};
    if(menuUrl)body.menu_url=menuUrl;
    const {data,error}=await supabase.functions.invoke('discover-menu',{body});
    if(error)throw error;
    if(!data?.menu_url)throw new Error(data?.message||'Menu nebylo nalezeno');
    restaurant.menu_url=data.menu_url;
    restaurant.menu_source=data.source||(/\.pdf(?:$|[?#])/i.test(data.menu_url)?'pdf':'website');
    status.textContent=data.message||`Nalezeno se skóre ${data.score??'–'}`;
    window.toast?.show(restaurant.menu_source==='pdf'?'PDF menu bylo ověřeno a uloženo':'Menu URL byla nalezena a uložena','success');
    render();
  }catch(error){
    status.textContent='Nepodařilo se ověřit';
    window.toast?.show(`Operace selhala: ${error.message}`,'error');
  }finally{button.disabled=false;}
}

list.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const card=button.closest('[data-id]');
  const restaurant=restaurants.find(r=>String(r.id)===card?.dataset.id);if(!restaurant)return;
  if(button.dataset.action==='discover')invokeDiscovery(restaurant,card,button);
  if(button.dataset.action==='save-url'){
    const value=card.querySelector('[data-menu-url]')?.value.trim();
    if(!value){window.toast?.show('Vlož odkaz na PDF nebo stránku menu','error');return;}
    invokeDiscovery(restaurant,card,button,value);
  }
});

search.addEventListener('input',render);
refresh.addEventListener('click',load);
load();
