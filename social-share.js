void import('./home-city-header.js').catch(error => console.error('Home city header failed:', error));
void import('./performance-fix.js').catch(error => console.error('Performance fix failed:', error));

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

// Katalog kuchařů: ponechat na kartě pouze hlavní tlačítko „Profil kuchaře“.
(function removeDuplicateChefDetailButtons(){
  if(!/\bkuchar\.html$/.test(location.pathname)) return;

  const clean = () => {
    document.querySelectorAll('.chef-card, .chef-row').forEach(card => {
      card.querySelectorAll('a, button').forEach(control => {
        if(control.classList.contains('chef-detail') || control.classList.contains('chef-image')) return;
        const label = String(control.textContent || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('cs');
        if(/^(detail|detail kuchaře|zobrazit detail)(\s*[→›»])?$/.test(label)) control.remove();
      });
    });
  };

  const start = () => {
    clean();
    const grid = document.getElementById('chefsGrid');
    if(grid) new MutationObserver(clean).observe(grid,{childList:true,subtree:true});
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
