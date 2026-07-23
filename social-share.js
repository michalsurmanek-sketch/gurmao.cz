// Moderní sdílení pro GURMAO.cz
class SocialShareManager {
  constructor() {
    this.baseUrl = 'https://gurmao.cz';
  }

  escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  async shareRestaurant(restaurant) {
    const href = String(restaurant.href || 'feed.html').replace(/^\/+/, '');
    const url = `${this.baseUrl}/${href}`;
    const data = {
      title: `${restaurant.name || 'Restaurace'} – GURMAO`,
      text: `Podívej se na ${restaurant.name || 'tuto restauraci'} na GURMAO.`,
      url,
      image: restaurant.photo_url || restaurant.img || restaurant.image || null
    };
    this.showShareModal(data, restaurant);
  }

  injectStyles() {
    if (document.getElementById('gurmao-modern-share-styles')) return;
    const style = document.createElement('style');
    style.id = 'gurmao-modern-share-styles';
    style.textContent = `
      #shareModal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(14px);animation:shareFade .18s ease}
      #shareModal .share-sheet{width:min(460px,100%);overflow:hidden;border:1px solid rgba(216,173,52,.26);border-radius:24px;background:linear-gradient(160deg,#171812,#0d0e0c);box-shadow:0 28px 90px rgba(0,0,0,.62);animation:shareUp .22s ease}
      #shareModal .share-preview{position:relative;height:158px;background-size:cover;background-position:center}
      #shareModal .share-preview:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.82))}
      #shareModal .share-close{position:absolute;z-index:2;right:14px;top:14px;width:38px;height:38px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(0,0,0,.55);color:#fff;cursor:pointer}
      #shareModal .share-title{position:absolute;z-index:2;left:20px;right:64px;bottom:16px}
      #shareModal .share-title strong{display:block;font-size:20px;font-weight:600;color:#fff}.share-title span{display:block;margin-top:4px;font-size:12px;color:rgba(255,255,255,.64)}
      #shareModal .share-body{padding:20px}
      #shareModal .share-heading{margin:0 0 14px;font-size:14px;font-weight:500;color:rgba(255,255,255,.72)}
      #shareModal .share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      #shareModal .share-option{min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:13px 6px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.035);color:#fff;text-decoration:none;cursor:pointer;transition:.18s}
      #shareModal .share-option:hover{transform:translateY(-2px);border-color:rgba(216,173,52,.55);background:rgba(216,173,52,.08)}
      #shareModal .share-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#22231f;font-size:19px;color:#f3c94a}
      #shareModal .share-option span:last-child{font-size:11px;color:rgba(255,255,255,.72);white-space:nowrap}
      #shareModal .share-copy{display:flex;align-items:center;gap:10px;margin-top:14px;padding:7px 7px 7px 14px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:#11120f}
      #shareModal .share-url{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:rgba(255,255,255,.5)}
      #shareModal .copy-btn{height:38px;padding:0 15px;border:0;border-radius:10px;background:linear-gradient(135deg,#f3c94a,#d6a62b);color:#111;font-weight:600;cursor:pointer}
      #shareModal .native-share{width:100%;height:44px;margin-top:12px;border:1px solid rgba(216,173,52,.38);border-radius:12px;background:transparent;color:#f3c94a;cursor:pointer}
      @keyframes shareFade{from{opacity:0}to{opacity:1}}@keyframes shareUp{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
      @media(max-width:520px){#shareModal{align-items:flex-end;padding:10px}#shareModal .share-sheet{border-radius:24px 24px 16px 16px}#shareModal .share-preview{height:145px}}
    `;
    document.head.appendChild(style);
  }

  showShareModal(shareData, restaurant) {
    document.getElementById('shareModal')?.remove();
    this.injectStyles();

    const url = this.escape(shareData.url);
    const name = this.escape(restaurant.name || 'Restaurace');
    const city = this.escape(restaurant.city || '');
    const image = this.escape(shareData.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80');
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedText = encodeURIComponent(shareData.text);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="shareModal" role="dialog" aria-modal="true" aria-label="Sdílet restauraci">
        <div class="share-sheet">
          <div class="share-preview" style="background-image:url('${image}')">
            <button id="closeShareModal" class="share-close" aria-label="Zavřít">✕</button>
            <div class="share-title"><strong>${name}</strong><span>${city || 'GURMAO · Nejez. Prožij.'}</span></div>
          </div>
          <div class="share-body">
            <p class="share-heading">Sdílet restauraci</p>
            <div class="share-grid">
              <a class="share-option" href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener"><span class="share-icon">◉</span><span>WhatsApp</span></a>
              <a class="share-option" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener"><span class="share-icon">f</span><span>Facebook</span></a>
              <a class="share-option" href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener"><span class="share-icon">𝕏</span><span>X</span></a>
              <a class="share-option" href="mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodedText}%0A${encodedUrl}"><span class="share-icon">✉</span><span>E-mail</span></a>
            </div>
            <div class="share-copy"><span class="share-url">${url}</span><button id="copyLinkBtn" class="copy-btn" data-url="${url}">Kopírovat</button></div>
            ${navigator.share ? '<button id="nativeShareBtn" class="native-share">Další možnosti sdílení</button>' : ''}
          </div>
        </div>
      </div>`);

    document.body.style.overflow = 'hidden';
    const modal = document.getElementById('shareModal');
    document.getElementById('closeShareModal')?.addEventListener('click', () => this.closeShareModal());
    modal?.addEventListener('click', event => { if (event.target === modal) this.closeShareModal(); });
    document.getElementById('copyLinkBtn')?.addEventListener('click', async event => {
      try {
        await navigator.clipboard.writeText(event.currentTarget.dataset.url);
        event.currentTarget.textContent = 'Zkopírováno ✓';
        setTimeout(() => this.closeShareModal(), 700);
      } catch {
        window.prompt('Zkopírujte odkaz:', shareData.url);
      }
    });
    document.getElementById('nativeShareBtn')?.addEventListener('click', async () => {
      try { await navigator.share({title: shareData.title, text: shareData.text, url: shareData.url}); }
      catch (error) { if (error.name !== 'AbortError') console.error(error); }
    });

    const escHandler = event => {
      if (event.key === 'Escape') {
        this.closeShareModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => { modal.remove(); document.body.style.overflow = ''; }, 160);
  }

  renderShareButton(restaurant, size = 'md') {
    const sizeClasses = {sm:'w-9 h-9 text-sm',md:'w-11 h-11 text-base',lg:'w-12 h-12 text-lg'};
    return `<button class="share-btn ${sizeClasses[size]} rounded-full bg-white/5 border border-white/15 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" data-restaurant='${JSON.stringify(restaurant)}' title="Sdílet"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path></svg></button>`;
  }

  initializeShareButtons() {
    document.addEventListener('click', async event => {
      const button = event.target.closest('.share-btn');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      try { await this.shareRestaurant(JSON.parse(button.dataset.restaurant)); }
      catch (error) { console.error('Share error:', error); }
    });
  }
}

window.socialShare = new SocialShareManager();
document.addEventListener('DOMContentLoaded', () => window.socialShare.initializeShareButtons());
window.shareRestaurant = restaurant => window.socialShare.shareRestaurant(restaurant);

// Na stránkách restaurací doplní živý stav, otevírací dobu a dnešní menu.
import('./opening-hours-ui.js').catch(error => console.error('Opening hours module:', error));
import('./daily-menu-ui.js').catch(error => console.error('Daily menu module:', error));

// Feed: stejné kruhové akce jako na kartách restaurací.
(function initFeedCardActions(){
  if(!/\bfeed\.html$/.test(location.pathname) && !document.getElementById('feed') && !document.getElementById('grid')) return;

  const style=document.createElement('style');
  style.id='gurmao-feed-card-actions-style';
  style.textContent=`
    .feed-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;position:relative;z-index:20}
    .feed-card-action{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.48);backdrop-filter:blur(8px);color:#fff;text-decoration:none;cursor:pointer;transition:transform .18s,border-color .18s,background .18s,color .18s}
    .feed-card-action:hover,.feed-card-action:focus-visible{transform:translateY(-2px);border-color:rgba(216,173,52,.58);background:rgba(18,16,9,.82);color:#f3c94a;outline:none}
    .feed-card-action svg{width:17px;height:17px;pointer-events:none}
    .feed-card-action span{display:none!important}
    .feed-card-action.save-btn{font-size:0!important}
    .feed-card-action.save-btn:before{content:'♡';font-size:22px;line-height:1}
    .feed-card-action.save-btn[data-feed-saved='true']:before{content:'♥';color:#f3c94a}
    .feed-card-action.feed-menu-btn{color:#f3c94a}
    #feed .feed-card-actions{position:absolute;right:24px;bottom:24px}
    #feed article>a .absolute.left-6{right:88px!important;bottom:30px!important}
    #feed .save-btn{position:static!important;top:auto!important;right:auto!important;width:38px!important;height:38px!important;border-radius:50%!important}
    #grid [data-restaurant-card] .feed-card-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
    #grid [data-restaurant-card] .feed-card-actions .save-btn,#grid [data-restaurant-card] .feed-card-actions .share-btn{width:38px!important;height:38px!important;border-radius:50%!important}
    @media(max-width:420px){#feed .feed-card-actions{right:16px;bottom:18px}#feed article>a .absolute.left-6{right:78px!important;bottom:24px!important}}
  `;
  document.head.appendChild(style);

  const shareSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path></svg>';
  const menuSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg>';

  function restaurantData(card,href){
    const title=card.querySelector('.text-3xl,.text-xl')?.textContent?.trim()||'Restaurace';
    const meta=card.querySelector('[class~="text-white/70"],[class~="text-white/60"]')?.textContent?.trim()||'';
    const [city='',tag='']=meta.split('·').map(v=>v.trim());
    const imageNode=card.querySelector('[style*="background-image"]');
    const image=(imageNode?.style.backgroundImage||'').replace(/^url\(["']?|["']?\)$/g,'');
    return {id:card.dataset.restaurant||card.dataset.restaurantCard||'',name:title,city,tag,img:image,href};
  }

  function syncSaveButton(button){
    const saved=(button.textContent||'').includes('❤️')||(button.textContent||'').includes('♥')||button.dataset.feedSaved==='true';
    button.dataset.feedSaved=String(saved);
    button.setAttribute('aria-label',saved?'Odebrat z výběru':'Uložit do výběru');
    button.title=saved?'Uloženo':'Uložit';
    button.textContent='';
  }

  function prepareSaveButton(button){
    syncSaveButton(button);
    if(button.dataset.feedSaveSync==='true')return;
    button.dataset.feedSaveSync='true';
    button.addEventListener('click',()=>setTimeout(()=>syncSaveButton(button),300));
  }

  function enhanceMobile(card){
    if(card.dataset.feedActionsReady==='true')return;
    const save=card.querySelector(':scope > .save-btn');
    const detail=card.querySelector(':scope > a[href]');
    if(!save||!detail)return;
    card.dataset.feedActionsReady='true';
    const href=detail.getAttribute('href')||'feed.html';
    const data=restaurantData(card,href);
    const bar=document.createElement('div');
    bar.className='feed-card-actions';
    save.classList.add('feed-card-action');
    prepareSaveButton(save);
    const share=document.createElement('button');
    share.type='button';share.className='share-btn feed-card-action';share.innerHTML=shareSvg;share.dataset.restaurant=JSON.stringify(data);share.setAttribute('aria-label','Sdílet restauraci');share.title='Sdílet';
    const menu=document.createElement('button');
    menu.type='button';menu.className='feed-card-action feed-menu-btn';menu.innerHTML=menuSvg;menu.setAttribute('aria-label','Zobrazit menu');menu.title='Menu';
    menu.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();card.querySelector('.swipe-menu')?.classList.add('active');const feed=document.getElementById('feed');if(feed)feed.style.overflow='hidden';});
    bar.append(save,share,menu);
    card.appendChild(bar);
  }

  function enhanceDesktop(card){
    if(card.dataset.feedActionsReady==='true')return;
    const save=card.querySelector('button[data-save]');
    const share=card.querySelector('.share-btn');
    const detail=card.querySelector('a[href]');
    const content=card.querySelector('.p-5');
    if(!save||!share||!detail||!content)return;
    card.dataset.feedActionsReady='true';
    const href=detail.getAttribute('href')||'feed.html';
    const oldWrap=save.parentElement;
    const bar=document.createElement('div');
    bar.className='feed-card-actions';
    save.className='save-btn feed-card-action';
    prepareSaveButton(save);
    share.className='share-btn feed-card-action';
    share.innerHTML=shareSvg;
    share.title='Sdílet';
    const menu=document.createElement('a');
    menu.className='feed-card-action feed-menu-btn';menu.href=`${href.split('#')[0]}#menu`;menu.innerHTML=menuSvg;menu.setAttribute('aria-label','Zobrazit menu');menu.title='Menu';
    bar.append(save,share,menu);
    content.appendChild(bar);
    if(oldWrap&&oldWrap.children.length===0)oldWrap.remove();
  }

  function enhance(){
    document.querySelectorAll('#feed article[data-restaurant]').forEach(enhanceMobile);
    document.querySelectorAll('#grid [data-restaurant-card]').forEach(enhanceDesktop);
  }

  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();