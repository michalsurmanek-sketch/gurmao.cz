// Keep the locality select visibly synced with the city from the URL.
(function syncRestaurantLocalitySelect(){
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();

  const sync=()=>{
    const select=document.getElementById('localityFilter');
    if(!select)return false;

    const requested=new URLSearchParams(location.search).get('city')||'';
    if(!requested){
      if(!select.value) select.value='';
      return true;
    }

    const requestedNormalized=normalize(requested);
    const option=[...select.options].find(item=>normalize(item.value||item.textContent)===requestedNormalized);

    if(option){
      select.value=option.value;
      select.setAttribute('aria-label',`Lokalita: ${option.textContent.trim()}`);
      return true;
    }

    // Until database options arrive, keep a readable temporary option instead of a blank field.
    let temporary=select.querySelector('option[data-gurmao-temporary-city]');
    if(!temporary){
      temporary=document.createElement('option');
      temporary.dataset.gurmaoTemporaryCity='true';
      select.appendChild(temporary);
    }
    temporary.value=requested;
    temporary.textContent=requested;
    select.value=requested;
    return false;
  };

  const start=()=>{
    const select=document.getElementById('localityFilter');
    if(!select)return;
    sync();
    const observer=new MutationObserver(()=>{
      const matched=sync();
      if(matched) observer.disconnect();
    });
    observer.observe(select,{childList:true,subtree:true});
    window.setTimeout(()=>{sync();observer.disconnect();},6000);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
