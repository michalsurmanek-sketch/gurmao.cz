import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
};

function normalizeUrl(value:string){
  try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}
}
function text(html:string){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();}
function isPdfUrl(url:string){return /\.pdf(?:$|[?#])/i.test(url);}
function scoreCandidate(url:string,label:string,body=''){
  const hay=`${url} ${label} ${body.slice(0,3000)}`.toLocaleLowerCase('cs');
  let score=0;
  for(const [pattern,points] of [[/denn[ií][-_ ]?menu/,50],[/poledn[ií][-_ ]?menu/,45],[/menu[-_ ]?dne/,45],[/ob[eě]dov[eé][-_ ]?menu/,40],[/t[yý]denn[ií][-_ ]?menu/,35],[/jideln[ií][-_ ]?listek/,18],[/menu/,12],[/lunch/,25]] as const){if(pattern.test(hay))score+=points;}
  if(isPdfUrl(url))score+=30;
  if(/facebook|instagram|tripadvisor|google\./.test(hay))score-=40;
  return score;
}
async function inspectUrl(url:string){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'GURMAO-menu-discovery/1.2 (+https://gurmao.cz)'}});
    if(!r.ok)return null;
    const type=(r.headers.get('content-type')||'').toLowerCase();
    const pdf=type.includes('application/pdf')||isPdfUrl(r.url);
    if(pdf)return {kind:'pdf' as const,finalUrl:r.url,html:''};
    if(!type.includes('text/html')&&!type.includes('text/plain'))return null;
    return {kind:'html' as const,html:await r.text(),finalUrl:r.url};
  }finally{clearTimeout(timer);}
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL');
    const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!supabaseUrl||!anonKey||!serviceKey){
      return new Response(JSON.stringify({message:'Serverová konfigurace není kompletní'}),{status:503,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    const auth=req.headers.get('Authorization')||'';
    const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user){
      return new Response(JSON.stringify({message:'Nepřihlášený uživatel'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if(user.app_metadata?.role!=='admin'){
      return new Response(JSON.stringify({message:'Přístup odepřen'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    const body=await req.json();
    const restaurantId=body.restaurant_id;
    if(!restaurantId)throw new Error('Chybí restaurant_id');
    const admin=createClient(supabaseUrl,serviceKey);
    const {data:r,error}=await admin.from('restaurants').select('*').eq('id',restaurantId).single();
    if(error||!r)throw new Error('Restaurace nebyla nalezena');

    const manualUrl=normalizeUrl(body.menu_url||'');
    if(manualUrl){
      const inspected=await inspectUrl(manualUrl);
      if(!inspected)throw new Error('Zadané menu URL není dostupné');
      const source=inspected.kind==='pdf'?'pdf':'website';
      const {error:updateError}=await admin.from('restaurants').update({menu_url:inspected.finalUrl,menu_source:source,menu_auto_enabled:true,menu_last_checked:new Date().toISOString()}).eq('id',restaurantId);
      if(updateError)throw updateError;
      await admin.from('menu_import_queue').upsert({restaurant_id:restaurantId,status:'pending',scheduled_for:new Date().toISOString(),last_error:null},{onConflict:'restaurant_id'});
      return new Response(JSON.stringify({menu_url:inspected.finalUrl,source,score:100,message:source==='pdf'?'PDF menu bylo ověřeno a zařazeno ke zpracování':'Menu stránka byla ověřena a zařazena ke zpracování'}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    const website=normalizeUrl(r.website||r.website_url||r.web_url||r.url||'');
    if(!website)throw new Error('Restaurace nemá vyplněný platný web');
    const homepage=await inspectUrl(website);
    if(!homepage||homepage.kind!=='html')throw new Error('Oficiální web se nepodařilo načíst');
    const base=new URL(homepage.finalUrl);
    const candidates=new Map<string,{url:string,label:string,score:number}>();
    const add=(raw:string,label='')=>{try{const u=new URL(raw,base);if(u.origin!==base.origin)return;u.hash='';const url=u.href;const s=scoreCandidate(url,label);if(s>0)candidates.set(url,{url,label,score:s});}catch{}};
    for(const match of homepage.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))add(match[1],text(match[2]));
    for(const match of homepage.html.matchAll(/<(?:iframe|embed|object)\b[^>]*(?:src|data)=["']([^"']+)["'][^>]*>/gi))add(match[1],'vložené menu PDF');
    for(const path of ['/denni-menu','/denni-menu/','/poledni-menu','/poledni-menu/','/menu','/menu/','/jidelnilistek','/jidelnilistek/','/obedove-menu','/obedove-menu/'])add(path,path);

    const ranked=[...candidates.values()].sort((a,b)=>b.score-a.score).slice(0,20);
    let best:{url:string;score:number;source:'pdf'|'website'}|null=null;
    for(const candidate of ranked){
      const page=await inspectUrl(candidate.url);if(!page)continue;
      if(page.kind==='pdf'){
        const combined=candidate.score+35;
        if(!best||combined>best.score)best={url:page.finalUrl,score:combined,source:'pdf'};
        continue;
      }
      const bodyText=text(page.html);const combined=candidate.score+scoreCandidate(page.finalUrl,candidate.label,bodyText);
      if(/denn[ií]\s+menu|poledn[ií]\s+menu|menu\s+dne|ob[eě]dov[eé]\s+menu|pol[eé]vka|hlavn[ií]\s+j[ií]dlo/i.test(bodyText)&&(!best||combined>best.score))best={url:page.finalUrl,score:combined,source:'website'};
    }
    if(!best)return new Response(JSON.stringify({message:'Na webu nebyla nalezena stránka ani PDF s denním menu'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});

    const {error:updateError}=await admin.from('restaurants').update({menu_url:best.url,menu_source:best.source,menu_auto_enabled:true,menu_last_checked:new Date().toISOString()}).eq('id',restaurantId);
    if(updateError)throw updateError;
    await admin.from('menu_import_queue').upsert({restaurant_id:restaurantId,status:'pending',scheduled_for:new Date().toISOString(),last_error:null},{onConflict:'restaurant_id'});
    return new Response(JSON.stringify({menu_url:best.url,score:best.score,source:best.source,message:best.source==='pdf'?'PDF menu bylo nalezeno a zařazeno ke zpracování':'Menu stránka byla nalezena a zařazena ke zpracování'}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
  }catch(error){return new Response(JSON.stringify({message:error instanceof Error?error.message:String(error)}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});}
});