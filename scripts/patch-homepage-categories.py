from pathlib import Path

index_path = Path('index.html')
css_path = Path('global.css')
html = index_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

old = '''  <div class="relative mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm">
    <span class="mr-1 text-white/45">Oblíbené chutě:</span>
    <a href="restaurace.html?q=pizza" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Pizza</a>
    <a href="restaurace.html?q=sushi" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Sushi</a>
    <a href="restaurace.html?q=burger" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Burger</a>
    <a href="restaurace.html?q=steak" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Steak</a>
    <a href="restaurace.html?q=vegan" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Vegan</a>
    <a href="restaurace.html?q=brunch" class="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/75 transition hover:border-gurmaogold hover:text-gurmaogold">Brunch</a>
  </div>'''

icons = {
'pizza':'<path d="M9 20 20 5c3 5 3 10 0 15-4 2-8 2-11 0Z"/><path d="M12 17c3 1 6 1 9 0"/><circle cx="15" cy="13" r="1"/><circle cx="18" cy="9" r="1"/>',
'burger':'<path d="M5 10c1-4 4-6 7-6s6 2 7 6H5Z"/><path d="M4 13h16M5 16h14M5 19h14l-1 2H6l-1-2Z"/>',
'sushi':'<ellipse cx="9" cy="9" rx="5" ry="3"/><path d="M4 9v5c0 2 2 3 5 3s5-1 5-3V9M18 4 11 20M21 5l-7 16"/>',
'steak':'<path d="M5 14c0-6 5-10 11-9 5 1 7 5 4 9-3 5-8 7-13 6-2-1-3-3-2-6Z"/><path d="M10 10c2-2 5-2 7-1M9 15c3 1 6 1 8-1"/>',
'vegan':'<path d="M12 21C6 18 5 11 6 5c5 1 9 4 10 9"/><path d="M13 21c0-7 3-12 8-15 1 7-2 13-8 15Z"/><path d="M9 10c3 3 4 6 4 11"/>',
'brunch':'<path d="M5 10h12v5c0 4-3 6-6 6s-6-2-6-6v-5Z"/><path d="M17 12h2c2 0 3 1 3 3s-1 3-4 3h-1M8 7c-1-2 1-3 0-5M12 7c-1-2 1-3 0-5M16 7c-1-2 1-3 0-5"/>',
'italian':'<path d="M4 16c4-7 12-9 16-3-2 6-8 8-16 3Z"/><path d="M7 16c3-2 7-3 11-2M9 10c2 1 4 1 6 0"/>',
'mexican':'<path d="M4 17c2-6 6-9 8-9s6 3 8 9H4Z"/><path d="M7 17h10M9 11l3 3 3-3"/>',
'czech':'<path d="M4 18h16M6 18v-6h12v6M8 12V8h8v4M10 8V5h4v3"/>',
'pub':'<path d="M5 7h11v12H7c-1 0-2-1-2-2V7Z"/><path d="M16 9h3c2 0 3 2 3 4s-1 4-4 4h-2M8 4v3M11 4v3M14 4v3"/>',
'fine':'<path d="M4 18h16M6 18c0-6 3-10 6-10s6 4 6 10M12 5v3M9 5h6"/>',
'romance':'<path d="M12 21S4 16 4 10c0-3 2-5 5-5 2 0 3 1 3 2 1-1 2-2 4-2 3 0 5 2 5 5 0 6-9 11-9 11Z"/>',
'spicy':'<path d="M6 18c6 1 11-3 12-11-4 2-8 2-11 0 2 4 1 8-1 11Z"/><path d="M17 7c1-2 2-3 4-3"/>',
'breakfast':'<path d="M4 18h16M6 18a6 6 0 0 1 12 0M12 5v3M5 10l3 2M19 10l-3 2"/>',
'business':'<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V4h6v3M4 12h16"/>',
'family':'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="12" cy="13" r="3"/><path d="M3 21c0-4 2-6 5-6M21 21c0-4-2-6-5-6M7 21c0-4 2-6 5-6s5 2 5 6"/>',
'garden':'<path d="M12 21v-9M12 12c-4 0-7-3-7-7 4 0 7 3 7 7ZM12 16c4 0 7-3 7-7-4 0-7 3-7 7Z"/>',
'evening':'<path d="M4 19h16M6 19v-7h5v7M13 19V9h5v10M8 9h1M15 12h1M15 15h1"/><path d="M5 6c3 1 5 0 7-3"/>',
'michelin':'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>'
}

def item(key, label, query):
    return f'<a class="taste-item" href="restaurace.html?q={query}"><svg viewBox="0 0 24 24" aria-hidden="true">{icons[key]}</svg><span>{label}</span></a>'

cuisine = [('pizza','Pizza','pizza'),('burger','Burger','burger'),('sushi','Sushi','sushi'),('steak','Steak','steak'),('vegan','Vegan','vegan'),('brunch','Brunch','brunch'),('italian','Italská','italská'),('mexican','Mexická','mexická'),('czech','Česká','česká'),('pub','Pivnice','pivnice'),('fine','Fine Dining','fine dining')]
moods = [('romance','Romantika','romantika'),('spicy','Pikantní','pikantní'),('breakfast','Snídaně','snídaně'),('business','Business lunch','business lunch'),('family','Rodina','rodina'),('garden','Zahrádka','zahrádka'),('evening','Večer','večer'),('michelin','Michelin','michelin')]
new = '''  <div class="hero-discovery relative">
    <div class="hero-count">Prohledáváme <strong>2 480</strong> restaurací po celé ČR</div>
    <div class="taste-heading"><span>Podle kuchyně</span></div>
    <div class="taste-grid taste-grid-cuisine">''' + ''.join(item(*x) for x in cuisine) + '''</div>
    <div class="taste-heading taste-heading-mood"><span>Podle nálady a příležitosti</span></div>
    <div class="taste-grid taste-grid-mood">''' + ''.join(item(*x) for x in moods) + '''<a class="taste-more" href="restaurace.html">Zobrazit více<br>kategorií →</a></div>
  </div>'''

if old not in html:
    raise SystemExit('Original category block not found')
html = html.replace(old, new, 1)

marker = '/* ===== HERO DISCOVERY 2026 ===== */'
if marker in css:
    css = css.split(marker)[0].rstrip() + '\n\n'
css += r'''/* ===== HERO DISCOVERY 2026 ===== */
.hero-discovery{position:relative;width:min(1240px,92vw);margin-top:16px}
.hero-count{text-align:center;color:rgba(255,255,255,.86);font-size:15px;margin-bottom:10px}
.hero-count strong{color:#e4bd3d;font-weight:600}
.taste-heading{display:flex;align-items:center;gap:18px;color:#d4af37;font-size:19px;margin:6px 0 8px}
.taste-heading::before,.taste-heading::after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(212,175,55,.55),transparent)}
.taste-grid{display:grid;align-items:start}
.taste-grid-cuisine{grid-template-columns:repeat(11,minmax(0,1fr));gap:4px}
.taste-grid-mood{grid-template-columns:repeat(9,minmax(0,1fr));gap:6px}
.taste-item{min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;padding:4px 2px;color:rgba(255,255,255,.9);font-size:13px;line-height:1.15;text-align:center;transition:.2s ease}
.taste-item svg{width:32px;height:32px;fill:none;stroke:#d4af37;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px rgba(212,175,55,.16))}
.taste-item:hover{color:#f0d27a;transform:translateY(-2px)}
.taste-heading-mood{margin-top:9px}
.taste-more{align-self:center;border:1px solid rgba(212,175,55,.55);border-radius:18px;padding:10px 8px;color:#e7c44f;font-size:13px;line-height:1.45;text-align:center;transition:.2s ease}
.taste-more:hover{background:rgba(212,175,55,.1);border-color:#d4af37}
.hero-discovery + #heroCTA{margin-top:12px!important}
@media (min-width:1024px){
  .hero-bg{min-height:calc(100dvh - 65px)!important;padding-top:24px!important;padding-bottom:18px!important}
  .hero-bg h1{font-size:clamp(3rem,5.4vw,5.35rem)!important}
  .hero-bg h1 + p{margin-top:16px!important}
  .hero-bg form[role="search"]{margin-top:20px!important}
  #heroCTA{margin-top:12px!important}
  #heroCTA a{padding-top:6px;padding-bottom:6px}
}
@media (min-width:1024px) and (max-height:820px){
  .hero-bg{padding-top:14px!important;padding-bottom:10px!important}
  .hero-bg h1{font-size:clamp(2.8rem,4.8vw,4.7rem)!important}
  .hero-bg h1 + p{margin-top:10px!important;font-size:1rem!important}
  .hero-bg form[role="search"]{margin-top:14px!important}
  .hero-discovery{margin-top:10px}
  .hero-count{margin-bottom:5px;font-size:14px}
  .taste-heading{margin:3px 0 5px;font-size:16px}
  .taste-item svg{width:27px;height:27px}
  .taste-item{font-size:12px;gap:3px;padding:2px}
  .taste-heading-mood{margin-top:5px}
  .taste-more{padding:7px 5px;font-size:12px}
  .hero-discovery + #heroCTA{margin-top:6px!important}
}
@media (max-width:1023px){
  .hero-discovery{width:min(760px,94vw)}
  .taste-grid-cuisine{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 4px}
  .taste-grid-mood{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 4px}
  .taste-heading{margin-top:16px}
}
@media (max-width:520px){
  .taste-grid-cuisine,.taste-grid-mood{grid-template-columns:repeat(3,minmax(0,1fr))}
  .taste-item svg{width:30px;height:30px}
  .taste-more{min-height:58px;display:grid;place-items:center}
}
'''

index_path.write_text(html, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
