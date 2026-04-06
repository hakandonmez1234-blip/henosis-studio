// ═══════════════════════════════════════════════════════════════
// UI-CORE.JS — Ortak Yardımcılar + Ana render() İskeleti
// Bağımlılıklar: config.js (M, STRATEGIES vb.), state.js (S), utils.js (h, toast)
// Çağırdıkları: renderHazirla(), renderStudyo(), renderQueue(),
//               renderGallery(), renderLearn(), renderSettings()
//               renderLightbox(), renderRevize(), renderHermes()
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// UI.JS — Arayüz Çizimi ve Başlatıcı
// ═══════════════════════════════════════════════════════════════

// ── CUSTOM DROPDOWN SİSTEMİ ──
// Tüm native <select>'lerin yerine geçer. Tam stillenebilir, gruplu, info kartlı.

var _cdOpen=null; // şu an açık dropdown id'si

function _closeAllDropdowns(){
  document.querySelectorAll('.cd-menu').forEach(m=>m.style.display='none');
  _cdOpen=null;
}

document.addEventListener('click',function(e){
  if(!e.target.closest('.cd-wrap'))_closeAllDropdowns();
});

// buildCustomSelect: genel amaçlı
// groups: [{label, items:[{value, label, sub, info, color, badge}]}]
// selectedValue, onSelectFn (string — global fn adı, value alır), id
function buildCustomSelect(id, groups, selectedValue, onSelectFn, opts){
  opts=opts||{};
  // Seçili item'ı bul
  var selItem=null;
  groups.forEach(g=>g.items&&g.items.forEach(it=>{if(it.value===selectedValue)selItem=it;}));
  var selLabel=selItem?(selItem.label||selectedValue):'Seç...';
  var selSub=selItem&&selItem.sub?selItem.sub:'';
  var selColor=selItem&&selItem.color?selItem.color:'var(--ac-orange)';

  var o=`<div class="cd-wrap" id="cdw-${id}" style="${opts.style||''}">
    <div class="cd-trigger" onclick="
      var m=document.getElementById('cdm-${id}');
      var isOpen=m.style.display==='block';
      _closeAllDropdowns();
      if(!isOpen){m.style.display='block';_cdOpen='${id}';}
    ">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${selLabel}</div>
        ${selSub?`<div style="font-size:10px;color:var(--tx-muted);margin-top:1px">${selSub}</div>`:''}
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="cd-menu" id="cdm-${id}" style="display:none">`;

  groups.forEach(g=>{
    if(g.label)o+=`<div class="cd-group-label">${g.label}</div>`;
    (g.items||[]).forEach(it=>{
      var isSelected=it.value===selectedValue;
      var avgDur=typeof getModelAvgDuration==='function'?getModelAvgDuration(it.value):null;
      var avgScore=typeof getModelAvgScore==='function'?getModelAvgScore(it.value):null;
      o+=`<div class="cd-item ${isSelected?'cd-selected':''}" onclick="_closeAllDropdowns();${onSelectFn}('${it.value}')">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          ${it.color?`<div style="width:8px;height:8px;border-radius:50%;background:${it.color};flex-shrink:0"></div>`:''}
          ${isSelected?`<div style="color:var(--green);flex-shrink:0;font-size:10px">✓</div>`:'<div style="width:14px;flex-shrink:0"></div>'}
          <div style="min-width:0;flex:1">
            <div style="font-size:12px;font-weight:${isSelected?'700':'500'};color:${isSelected?'var(--ac-orange)':'var(--tx-main)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.label}</div>
            ${it.sub?`<div style="font-size:10px;color:var(--tx-muted);margin-top:1px">${it.sub}</div>`:''}
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;align-items:center">
            ${avgDur?`<span style="font-size:9px;color:var(--ac-peach);background:rgba(251,146,60,0.1);padding:1px 5px;border-radius:4px">~${avgDur}s</span>`:''}
            ${avgScore?`<span style="font-size:9px;color:var(--green);background:rgba(74,222,128,0.1);padding:1px 5px;border-radius:4px">${avgScore}</span>`:''}
            ${it.badge?`<span style="font-size:9px;color:var(--tx-muted);background:var(--bg-card);padding:1px 5px;border-radius:4px;border:1px solid var(--br)">${it.badge}</span>`:''}
          </div>
        </div>
      </div>`;
    });
  });

  o+=`</div></div>`;
  return o;
}

// Model dropdown — favori modeller önce, sonra kategorilere göre
function buildModelSelect(selectedKey, filterFn, onchangeFnName, favType){
  var favKeys = favType==='vid' ? S.favVidModels : S.favImgModels;
  var allKeys = Object.keys(M).filter(filterFn);
  var favFiltered = favKeys.filter(k => allKeys.includes(k));
  var others = allKeys.filter(k => !favFiltered.includes(k));
  var cats={};
  others.forEach(function(k){var c=M[k].cat||M[k].t;if(!cats[c])cats[c]=[];cats[c].push(k);});
  var catOrder=['Flux 2','Kontext','Flux 1','Gemini','Seedream','Recraft','video'];
  var groups=[];
  if(favFiltered.length){
    groups.push({label:'★ Favorilerim',items:favFiltered.map(k=>({value:k,label:M[k].n,sub:M[k].p,badge:M[k].p}))});
  }
  catOrder.forEach(function(cat){
    if(!cats[cat])return;
    groups.push({label:cat,items:cats[cat].map(k=>({value:k,label:M[k].n,sub:M[k].p,badge:M[k].p}))});
  });
  Object.keys(cats).forEach(function(cat){
    if(catOrder.includes(cat))return;
    groups.push({label:cat,items:cats[cat].map(k=>({value:k,label:M[k].n,sub:M[k].p,badge:M[k].p}))});
  });
  var id='mdl-'+(favType||'img')+'-'+Math.random().toString(36).slice(2,6);
  return buildCustomSelect(id, groups, selectedKey, onchangeFnName, {style:'width:100%'});
}

// 3-kriter yıldız widget
function buildCritStars(promptId, scores, criterion, label){
  var val=scores&&scores[criterion]?scores[criterion]:0;
  var stars='';
  for(var i=1;i<=5;i++){
    stars+=`<div class="crit-star ${i<=val?'on':''}" onclick="setPromptScore('${promptId}','${criterion}',${i});event.stopPropagation()">●</div>`;
  }
  return `<div class="crit-row"><div class="crit-label">${label}</div><div class="crit-stars">${stars}</div></div>`;
}

// ── SVG İKON SABİTLERİ ──
var IC={
  bolt:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  check:'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  img:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  vid:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  vid_white:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  vid_muted:'<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  folder:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ac-orange)" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  img_dark:'<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" style="margin-bottom:8px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  bolt_dark:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--tx-main)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
};

function render(){
  
  var app=document.getElementById('app');var o='';
  var dbSyncing=S.dbStatus==='Kaydediliyor...';
  var dbIcon=S.dbStatus==='Aktif'?IC.check:'';

  // ── HEADER ──
  o+=`<div class="hdr">
    <div class="logo-wrap">
      <div class="logo"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%">
        <path d="M23,7 C15,5 7,10 6,19 C5,28 10,38 18,42 C25,45 34,42 38,35 C42,28 41,17 36,11 C32,6 29,8 23,7 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M34,11 C28,8 21,12 19,20 C17,28 20,38 28,42 C35,45 43,40 45,32 C47,24 44,14 39,10 C36,8 37,13 34,11 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <g clip-path="url(#hlo)">
          <path d="M34,11 C28,8 21,12 19,20 C17,28 20,38 28,42 C35,45 43,40 45,32 C47,24 44,14 39,10 C36,8 37,13 34,11 Z" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.0"/>
        </g>
      </svg></div>
    </div>
    <div class="hdr-center">
      <div class="hdr-title"><i data-lucide="sparkles" class="icon-sm" style="margin-right:8px"></i>Henosis Studio</div>
      <div class="hdr-ver">demo0.1</div>
    </div>
    <div class="hdr-right">
      <button class="hermes-btn" onclick="openHermes()">
        <i data-lucide="wand-2" style="margin-right:6px"></i>HERMES
      </button>
      <div class="hdr-db ${dbSyncing?'syncing':''}"><i data-lucide="database" style="margin-right:4px"></i>${S.dbStatus}</div>
      <div class="hdr-cost"><i data-lucide="coins" style="margin-right:4px"></i>$${S.totalSpent.toFixed(2)}</div>
      ${(()=>{
        const userJson = localStorage.getItem('hns_user');
        const userEmail = userJson ? JSON.parse(userJson).email : '';
        return userEmail ? `<div style="display:flex;align-items:center;gap:8px;padding:4px 12px;background:var(--bg-elev);border-radius:var(--rad-pill);border:1px solid var(--brd)">
        <i data-lucide="user" class="icon-xs"></i>
        <span style="font-size:11px;color:var(--tx-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${userEmail}</span>
        <button onclick="window.doLogout()" style="background:none;border:none;cursor:pointer;color:var(--tx-muted);padding:0;font-family:inherit;display:flex;align-items:center" title="Çıkış yap"><i data-lucide="log-out" class="icon-xs"></i></button>
      </div>` : '';
      })()}
    </div>
  </div>`;

  // ── TABS ──
  var qc=S.queue.filter(q=>q.status==='pending').length;
  var tabs=[
    {id:'hazirla',l:'Yaratım',icon:'compass'},
    {id:'uretim',l:'Stüdyo',icon:'layout-grid'},
    {id:'queue',l:'Kuyruk',icon:'clock',badge:qc||''},
    {id:'gallery',l:'Galeri',icon:'image',badge:S.gallery.length||''},
    {id:'learn',l:'Hafıza',icon:'brain-circuit'},
    {id:'settings',l:'Ayarlar',icon:'settings-2'}
  ];
  o+='<div class="tabs">';
  tabs.forEach((t,i)=>{
    o+=`<button class="tb ${S.tab===t.id?'on':''}" onclick="S.tab='${t.id}';render()" style="animation:slide-in-right 0.4s var(--ease-spring) ${i*0.05}s backwards"><i data-lucide="${t.icon}" class="icon-sm" style="margin-right:6px"></i>${t.l}${t.badge?`<span class="tb-badge">${t.badge}</span>`:''}</button>`;
  });
  o+='</div><div class="cnt">';

  // ── TAB DİSPATCHER — her modül kendi renderXxx() fonksiyonunu sağlar ──
  if(S.tab==='hazirla'&&typeof renderHazirla==='function')  o+=renderHazirla();
  if(S.tab==='uretim'&&typeof renderStudyo==='function')   o+=renderStudyo();
  if(S.tab==='queue'&&typeof renderQueue==='function')    o+=renderQueue();
  if(S.tab==='gallery'&&typeof renderGallery==='function')  o+=renderGallery();
  if(S.tab==='learn'&&typeof renderLearn==='function')    o+=renderLearn();
  if(S.tab==='settings'&&typeof renderSettings==='function') o+=renderSettings();

  o+='</div>'; // cnt kapanış

  // ── MODALLER (her zaman render edilir, state'e göre açılır) ──
  if(typeof renderLightbox==='function') o+=renderLightbox();
  if(typeof renderRevize==='function') o+=renderRevize();
  if(typeof renderHermes==='function') o+=renderHermes();
  o+=renderProjectSaveModal();
  o+=renderMemoryModal();

  app.innerHTML=o;

  // Lucide ikonlarını oluştur
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Custom dropdown CSS — bir kez inject et
  if(!document.getElementById('cd-styles')){
    var s=document.createElement('style');s.id='cd-styles';
    s.textContent=`
      .cd-wrap{position:relative;width:100%}
      /* ═══ IMAGE GRID — Krem Fiziksel ═══ */
      .ig { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-top: 20px; }
      .ic { 
        position: relative; 
        border-radius: var(--rad-sm); 
        overflow: hidden; 
        border: 1px solid var(--brd); 
        aspect-ratio: 1; 
        transition: all 0.4s var(--ease-spring);
        animation: spring-in 0.5s var(--ease-spring) backwards;
      }
      .ic:hover { 
        transform: translateY(-6px) scale(1.02);
        box-shadow: var(--shadow-float); 
        border-color: var(--brd-strong);
        z-index: 2;
      }
      .ic img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease-smooth); }
      .ic:hover img { transform: scale(1.08); }
      .ic-l { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px; background: linear-gradient(transparent, rgba(44,36,25,0.8)); font-size: 10px; color: var(--bg-elev); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ic-x { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: var(--bg-elev); color: var(--tx-main); border: 1px solid var(--brd); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; z-index: 3; transition: all 0.2s var(--ease-spring); opacity: 0; transform: scale(0.8); }
      .ic:hover .ic-x { opacity: 1; transform: scale(1); }
      .ic-x:hover { background: var(--tx-main); color: var(--bg-elev); border-color: var(--tx-main); transform: scale(1.1); }
      .cd-selected{background:rgba(212,100,42,0.08)}
      .cd-menu::-webkit-scrollbar{width:4px}
      .cd-menu::-webkit-scrollbar-track{background:transparent}
      .cd-menu::-webkit-scrollbar-thumb{background:var(--br);border-radius:4px}
    `;
  }
  setTimeout(bindDragDrops,0);

  // Kuyruk kartı spinner patch
  setTimeout(function(){
    S.queue.forEach(function(it,i){
      if(it.status!=='generating')return;
      var card=document.querySelector('.qi.generating');if(!card)return;
      if(card.querySelector('.ps-item-ring'))return;
      var qt=card.querySelector('.qt');if(!qt)return;
      var sec=it._startedAt?Math.floor((Date.now()-it._startedAt)/1000):0;
      var deg=(sec*30)%360;
      var ring=document.createElement('div');
      ring.id='ps-item-ring-'+i;ring.className='ps-item-ring';
      ring.style.background=`conic-gradient(var(--ac-orange) ${deg}deg, rgba(184,92,30,0.12) ${deg}deg)`;
      ring.innerHTML=`<div class="ps-item-ring-inner"></div>`;
      var timer=document.createElement('div');
      timer.id='ps-item-timer-'+i;timer.className='ps-item-timer';timer.textContent=_formatSec(sec);
      var btn=card.querySelector('button');
      if(btn){card.insertBefore(ring,btn);card.insertBefore(timer,btn);}
      else{card.appendChild(ring);card.appendChild(timer);}
      // Bu kodu render() fonksiyonunun en sonuna veya sayfa sonuna ekle
      function renderWrapper() {
       render(); // Mevcut render fonksiyonun
       if (window.lucide) {
      lucide.createIcons();
    }
}
    });
  },0);
}

// ═══════════════════════════════════════════════════════════════
// PROJE KAYIT MODALI
// ═══════════════════════════════════════════════════════════════
function renderProjectSaveModal() {
  if (!S.prjSaveModal) return '';
  var it = S.prjSaveGalIdx !== null ? S.gallery[S.prjSaveGalIdx] : null;
  var suggestedTitle = it && it.ref ? it.ref.name : (S.conceptBrief ? S.conceptBrief.split(' ').slice(0,4).join(' ') : '');

  return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)"
    onclick="S.prjSaveModal=false;S.prjSaveGalIdx=null;render()">
    <div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:var(--rad-lg);padding:28px;width:400px;max-width:92vw;box-shadow:var(--shadow-soft)"
      onclick="event.stopPropagation()">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px"><i data-lucide="folder-plus" style="width:18px;height:18px"></i> Projeye Kaydet</div>
      <div style="font-size:11px;color:var(--tx-muted);margin-bottom:20px">Bu üretimi hafızana kaydet. Aylar sonra "o sirke firması" yazınca bulabilirsin.</div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:6px">PROJE BAŞLIĞI *</div>
          <input id="prj-title-inp" class="inp" type="text" placeholder="Sirke Firması — Meyve Patlama Banner" value="${h(suggestedTitle)}"
            style="font-size:13px;padding:10px 14px"
            onkeydown="if(event.key==='Enter')document.getElementById('prj-client-inp').focus()">
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:6px">MÜŞTERİ / MARKA</div>
          <input id="prj-client-inp" class="inp" type="text" placeholder="Akova Sirke, Nike, kendi projesi..."
            style="font-size:13px;padding:10px 14px"
            onkeydown="if(event.key==='Enter')document.getElementById('prj-note-inp').focus()">
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:6px">NOT</div>
          <textarea id="prj-note-inp" class="inp" placeholder="Ne işe yaradı? Müşteri ne dedi? Tekrar kullanmak için ne hatırlamalısın?"
            style="font-size:12px;min-height:64px;resize:none"></textarea>
        </div>
      </div>

      ${it && it.result && !it.result.includes('.mp4') ? `<div style="display:flex;gap:10px;align-items:center;margin-bottom:20px;padding:10px;background:var(--bg-cream);border-radius:10px">
        <img src="${it.result}" style="width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0">
        <div style="font-size:11px;color:var(--tx-muted)">Bu görsel projenin temsili görseli olarak kaydedilecek.</div>
      </div>` : ''}

      <div class="fc g8">
        <button class="bs" style="flex:1;font-size:13px;padding:11px" onclick="S.prjSaveModal=false;S.prjSaveGalIdx=null;render()">İptal</button>
        <button class="bp" style="flex:2;font-size:13px;padding:11px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="saveProject(document.getElementById('prj-title-inp').value,document.getElementById('prj-client-inp').value,document.getElementById('prj-note-inp').value,S.prjSaveGalIdx)">
          <i data-lucide="folder-plus" style="width:14px;height:14px"></i> Kaydet
        </button>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// HAFIZA MODALI — Geçmiş Projeler
// ═══════════════════════════════════════════════════════════════
function renderMemoryModal() {
  if (!S.memModal) return '';
  var projects = S.projectMemory || [];
  var q = (S.memSearchQ || '').toLowerCase();
  var filtered = q.length > 1
    ? projects.filter(p =>
        (p.title||'').toLowerCase().includes(q) ||
        (p.client||'').toLowerCase().includes(q) ||
        (p.tags||[]).some(t => t.toLowerCase().includes(q)) ||
        (p.semanticSummary||'').toLowerCase().includes(q) ||
        (p.rawConcept||'').toLowerCase().includes(q))
    : projects;

  return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)"
    onclick="S.memModal=false;S.memSearchQ='';render()">
    <div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:var(--rad-lg);padding:24px;width:480px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:var(--shadow-soft)"
      onclick="event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-shrink:0">
        <div>
          <div style="font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px"><i data-lucide="archive" style="width:18px;height:18px"></i> Yaratıcı Hafıza</div>
          <div style="font-size:10px;color:var(--tx-muted);margin-top:2px">${projects.length} proje kaydedildi</div>
        </div>
        <button onclick="S.memModal=false;S.memSearchQ='';render()" style="background:none;border:none;cursor:pointer;color:var(--tx-muted);font-size:18px;padding:4px">✕</button>
      </div>

      <input class="inp" type="text" placeholder="Proje ara... müşteri, konsept, etiket"
        value="${h(S.memSearchQ||'')}"
        oninput="S.memSearchQ=this.value;render()"
        style="font-size:13px;padding:10px 14px;margin-bottom:14px;flex-shrink:0">

      <div style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px">
        ${filtered.length === 0 ? `<div style="text-align:center;padding:40px 20px;color:var(--tx-muted)">
          <div style="font-size:32px;margin-bottom:10px;display:flex;align-items:center;justify-content:center"><i data-lucide="archive" style="width:32px;height:32px;opacity:0.4"></i></div>
          <div style="font-size:13px">${projects.length === 0 ? 'Henüz proje kaydedilmedi.<br><span style="font-size:11px">Galeri\'deki bir görselde <i data-lucide="folder-plus" style="width:16px;height:16px"></i> butonuna bas.</span>' : 'Eşleşen proje bulunamadı'}</div>
        </div>` : filtered.map(prj => {
          var dateStr = prj.savedAt ? new Date(prj.savedAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'2-digit'}) : '';
          var isActive = S.activeProjectRef && S.activeProjectRef.id === prj.id;
          return `<div style="padding:14px;background:${isActive?'rgba(212,100,42,0.08)':'var(--bg-cream)'};border:1.5px solid ${isActive?'rgba(212,100,42,0.5)':'var(--brd)'};border-radius:12px;cursor:pointer;transition:all 0.15s"
            onmouseenter="this.style.borderColor='var(--ac-orange)'"
            onmouseleave="this.style.borderColor='${isActive?'rgba(212,100,42,0.5)':'var(--brd)'}'">
            <div style="display:flex;gap:10px;align-items:flex-start">
              ${prj.imageUrl && !prj.imageUrl.includes('.mp4') ? `<img src="${prj.imageUrl}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0">` : `<div style="width:44px;height:44px;background:var(--bg-deep);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center"><i data-lucide="folder" style="width:20px;height:20px;opacity:0.5"></i></div>`}
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  <div style="font-size:13px;font-weight:700;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(prj.title)}</div>
                  ${isActive ? `<span style="font-size:9px;background:var(--ac-orange);color:#fff;padding:1px 6px;border-radius:99px;flex-shrink:0">Aktif</span>` : ''}
                </div>
                ${prj.client ? `<div style="font-size:11px;color:var(--tx-muted)">${h(prj.client)}</div>` : ''}
                ${prj.semanticSummary ? `<div style="font-size:10px;color:var(--tx-muted);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${h(prj.semanticSummary)}</div>` : ''}
                ${(prj.tags||[]).length ? `<div style="margin-top:5px;display:flex;gap:3px;flex-wrap:wrap">${(prj.tags||[]).slice(0,5).map(t=>`<span style="font-size:9px;background:rgba(212,100,42,0.1);color:var(--ac-orange);padding:1px 6px;border-radius:99px">${h(t)}</span>`).join('')}</div>` : ''}
              </div>
              <div style="font-size:9px;color:var(--tx-muted);flex-shrink:0;text-align:right">
                ${dateStr}<br>
                ${prj.avgScore > 0 ? `<span style="color:var(--green)">★ ${prj.avgScore.toFixed(1)}</span>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:6px;margin-top:10px">
              <button onclick="applyProjectRef('${prj.id}');S.memModal=false;S.memSearchQ='';S.tab='hazirla';render()" style="flex:1;padding:7px;background:var(--ac-orange);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit">
                ✓ Bu Projeyi Referans Al
              </button>
              <button onclick="if(confirm('Projeyi sil?')){S.projectMemory.splice(S.projectMemory.indexOf(S.projectMemory.find(p=>p.id==='${prj.id}')),1);saveDB();render()}" style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-size:11px;color:var(--red);font-family:inherit;display:flex;align-items:center"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}