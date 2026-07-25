// Vizuálně stabilní načítání GURMAO bez bliknutí celé stránky.
(function initPerformanceFix(){
  const style=document.createElement('style');
  style.id='gurmao-performance-fix';
  style.textContent=`
    body{opacity:1!important;transition:none!important}
    @media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    body.gurmao-restaurants-loading #restaurantsList{min-height:420px}
    .gurmao-skeleton-card{min-width:0;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:#0e0f0d}
    .gurmao-skeleton-image,.gurmao-skeleton-line{background:linear-gradient(90deg,rgba(255,255,255,.035) 20%,rgba(255,255,255,.085) 38%,rgba(255,255,255,.035) 56%);background-size:220% 100%;animation:gurmaoSkeleton 1.25s ease-in-out infinite}
    .gurmao-skeleton-image{height:174px}
    .gurmao-skeleton-body{padding:15px 16px 18px}
    .gurmao-skeleton-line{height:13px;border-radius:999px;margin-top:10px}
    .gurmao-skeleton-line:first-child{width:58%;height:16px;margin-top:0}.gurmao-skeleton-line:nth-child(2){width:78%}.gurmao-skeleton-line:nth-child(3){width:42%}
    @keyframes gurmaoSkeleton{to{background-position:-120% 0}}
    @media(max-width:768px){.gurmao-skeleton-image{height:210px}}
  `;
  document.head.appendChild(style);

  if(!/\/restaurace\.html$/i.test(location.pathname)) return;

  if(!document.querySelector('link[data-gurmao-hero-preload]')){
    const preload=document.createElement('link');
    preload.rel='preload';
    preload.as='image';
    preload.href='images/gurmao-hero-restaurant.jpg';
    preload.dataset.gurmaoHeroPreload='true';
    document.head.appendChild(preload);
  }

  const start=()=>{
    const list=document.getElementById('restaurantsList');
    if(!list||list.children.length) return;
    document.body.classList.add('gurmao-restaurants-loading');
    const count=window.matchMedia('(max-width:768px)').matches?3:8;
    list.innerHTML=Array.from({length:count},()=>`<article class="gurmao-skeleton-card" aria-hidden="true"><div class="gurmao-skeleton-image"></div><div class="gurmao-skeleton-body"><div class="gurmao-skeleton-line"></div><div class="gurmao-skeleton-line"></div><div class="gurmao-skeleton-line"></div></div></article>`).join('');
    const observer=new MutationObserver(()=>{
      if(list.querySelector('.restaurant-card,.restaurant-row')||!list.querySelector('.gurmao-skeleton-card')){
        document.body.classList.remove('gurmao-restaurants-loading');
        observer.disconnect();
      }
    });
    observer.observe(list,{childList:true});
    window.setTimeout(()=>document.body.classList.remove('gurmao-restaurants-loading'),8000);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
