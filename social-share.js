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

// Feed: stejný spodní panel jako na kartách Restaurace — Zavolat, Trasa, Menu.
(function initFeedRestaurantActions(){
  if(!/\bfeed\.html$/.test(location.pathname) && !document.getElementById('feed') && !document.getElementById('grid')) return;

  const style=document.createElement('style');
  style.id='gurmao-feed-card-actions-style';
  style.textContent=`
    .feed-card-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;height:56px;border-top:1px solid rgba(255,255,255,.13);background:#0d0e0c;position:relative;z-index:20}
    .feed-card-action{min-width:0;height:56px;border:0;border-radius:0;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;gap:9px;font:600 13px/1 Inter,sans-serif;text-decoration:none;cursor:pointer;transition:background .18s,color .18s}
    .feed-card-action+.feed-card-action{border-left:1px solid rgba(255,255,255,.13)}
    .feed-card-action:hover,.feed-card-action:focus-visible{background:rgba(216,173,52,.08);color:#f3c94a;outline:none}
    .feed-card-action svg{width:18px;height:18px;flex:0 0 18px;pointer-events:none}
    #feed .feed-card-actions{position:absolute;left:0;right:0;bottom:0}
    #feed article>a .absolute.left-6{left:24px!important;right:24px!important;bottom:82px!important}
    #feed article>.save-btn{display:none!important}
    #grid [data-restaurant-card]{display:flex;flex-direction:column}
    #grid [data-restaurant-card]>.p-5{display:flex;flex:1;flex-direction:column;padding-bottom:0!important}
    #grid [data-restaurant-card] .feed-card-actions{margin-top:auto;margin-left:-20px;width:calc(100% + 40px)}
    #grid [data-restaurant-card] .flex.gap-2.flex-shrink-0{display:none!important}
    @media(max-width:420px){.feed-card-action{gap:7px;font-size:12px}#feed article>a .absolute.left-6{left:18px!important;right:18px!important;bottom:78px!important}}
  `;
  document.head.appendChild(style);

  const phoneSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"></path></svg><span>Zavolat</span>';
  const routeSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>Trasa</span>';
  const menuSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg><span>Menu</span>';

  function readCardData(card){
    const detail=card.querySelector(':scope > a[href], a[href]');
    const href=detail?.getAttribute('href')||'feed.html';
    const name=card.querySelector('.text-3xl,.text-xl')?.textContent?.trim()||'Restaurace';
    const meta=card.querySelector('[class~="text-white/70"],[class~="text-white/60"]')?.textContent?.trim()||'';
    const city=meta.split('·')[0]?.trim()||'';
    const phone=card.dataset.phone||card.querySelector('[data-phone]')?.dataset.phone||'';
    return {href,name,city,phone};
  }

  function makeAction(tag,className,html,href,label){
    const node=document.createElement(tag);
    node.className=`feed-card-action ${className}`;
    node.innerHTML=html;
    node.setAttribute('aria-label',label);
    if(tag==='a') node.href=href;
    return node;
  }

  function removeLegacyDetailButton(card){
    const footer=card.querySelector('.swipe-menu .sticky.bottom-0');
    if(!footer) return;
    [...footer.querySelectorAll('a')].forEach(link=>{
      if(/zobrazit celý detail/i.test(link.textContent||'')) link.remove();
    });
    const actions=footer.querySelector('.max-w-2xl');
    if(actions) actions.classList.remove('space-y-3');
  }

  function buildBar(card,isMobile){
    removeLegacyDetailButton(card);
    if(card.dataset.feedRestaurantActionsReady==='true') return;
    const {href,name,city,phone}=readCardData(card);
    const detailBase=href.split('#')[0];
    const bar=document.createElement('div');
    bar.className='feed-card-actions';

    const callHref=phone?`tel:${phone.replace(/[^+\d]/g,'')}`:`${detailBase}#kontakt`;
    const routeHref=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`.trim())}`;
    const call=makeAction('a','feed-call-btn',phoneSvg,callHref,'Zavolat do restaurace');
    const route=makeAction('a','feed-route-btn',routeSvg,routeHref,'Zobrazit trasu');
    route.target='_blank';
    route.rel='noopener';
    const menu=makeAction(isMobile?'button':'a','feed-menu-btn',menuSvg,`${detailBase}#menu`,'Zobrazit menu');

    if(isMobile){
      menu.type='button';
      menu.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        card.querySelector('.swipe-menu')?.classList.add('active');
        const feed=document.getElementById('feed');
        if(feed) feed.style.overflow='hidden';
      });
    }

    bar.append(call,route,menu);
    const content=card.querySelector('.p-5');
    if(content) content.appendChild(bar); else card.appendChild(bar);
    card.dataset.feedRestaurantActionsReady='true';
  }

  function enhance(){
    document.querySelectorAll('#feed article[data-restaurant]').forEach(card=>buildBar(card,true));
    document.querySelectorAll('#grid [data-restaurant-card]').forEach(card=>buildBar(card,false));
  }

  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance,{once:true}); else enhance();
})();