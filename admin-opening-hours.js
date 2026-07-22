import { supabase } from './supabase-client.js';
const status=document.getElementById('status');
const results=document.getElementById('results');
async function run(refreshAll=false){
  const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);status.textContent='Načítám a ukládám otevírací dobu…';results.innerHTML='';
  try{
    const {data,error}=await supabase.functions.invoke('sync-opening-hours',{body:{limit:10,refresh_all:refreshAll}});
    if(error)throw error;
    status.textContent=`Hotovo: zpracováno ${data.processed||0} restaurací.`;
    results.innerHTML=(data.results||[]).map(r=>`<article class="candidate-card"><div><h2>${String(r.name||'Restaurace').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</h2><p>${r.status==='updated'?'✅ Otevírací doba uložena':r.status==='no_hours'?'⚠️ Google nemá uvedenou otevírací dobu':r.status==='not_found'?'⚠️ Restaurace nebyla spolehlivě nalezena':'❌ '+(r.error||'Chyba')}</p></div></article>`).join('');
  }catch(e){status.textContent=`Chyba: ${e.message||e}`;}
  finally{buttons.forEach(b=>b.disabled=false);}
}
document.getElementById('syncBtn').addEventListener('click',()=>run(false));
document.getElementById('refreshBtn').addEventListener('click',()=>run(true));
