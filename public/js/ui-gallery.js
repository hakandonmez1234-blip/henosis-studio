// ═══════════════════════════════════════════════════════════════
// UI-GALLERY.JS — V2.0
// Galeri Tabı + Lightbox + Revize Modal
// YENİ: tek/çoklu sil, arşiv, indirirken isim değiştirme
// ═══════════════════════════════════════════════════════════════

// ── Seçim durumu (global, state'e değil burada tutuyoruz) ──
var _sel = new Set();          // seçili galeri index'leri
var _selMode = false;          // çoklu seçim modu açık mı
var _galView = 'gallery';      // 'gallery' | 'archive'

// ── İndirme ismi modal state ──
var _dlPending = null;         // { url, defaultName }

// ══════════════════════════════════════════════════════════════
// ANA GALERİ RENDER
// ══════════════════════════════════════════════════════════════
function renderGallery(){
  if (_galView === 'archive') return renderArchivePanel();

  var items = S.gallery || [];
  var o = '';

  // ── Toolbar ──
  o += `<div class="fb mb16" style="flex-wrap:wrap;gap:10px">
    <div class="fc g8">
      <div class="fc" style="background:var(--bg-elevated);border-radius:var(--rad-pill);padding:4px;box-shadow:var(--shadow-float)">
        <button class="bs" style="padding:6px 14px;font-size:12px;${S.galleryView==='folders'?'background:var(--ac-orange);color:#fff;border-color:transparent':''}" onclick="S.galleryView='folders';S.activeFolder=null;saveDB();render()"><i data-lucide="folder" class="icon-xs" style="margin-right:4px"></i>Klasörler</button>
        <button class="bs" style="padding:6px 14px;font-size:12px;${S.galleryView==='all'?'background:var(--ac-orange);color:#fff;border-color:transparent':''}" onclick="S.galleryView='all';S.activeFolder=null;saveDB();render()"><i data-lucide="images" class="icon-xs" style="margin-right:4px"></i>Tümü</button>
      </div>
      <button class="bs" style="padding:6px 14px;font-size:12px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)" onclick="_galView='archive';render()">
        <i data-lucide="archive" class="icon-xs" style="margin-right:4px"></i>Arşiv ${(S.archive&&S.archive.length)?`<span style="font-size:10px;background:rgba(90,143,168,0.15);padding:1px 6px;border-radius:99px;margin-left:4px">${S.archive.length}</span>`:''}
      </button>
    </div>
    <div class="fc g8">
      ${_selMode ? `
        <span style="font-size:12px;color:var(--tx-muted)">${_sel.size} seçili</span>
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="_sel.clear();_selMode=false;render()"><i data-lucide="x" class="icon-xs" style="margin-right:4px"></i>İptal</button>
        <button class="bs" style="font-size:12px;padding:6px 12px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)" onclick="archiveBatch()" ${_sel.size===0?'disabled':''}><i data-lucide="archive" class="icon-xs" style="margin-right:4px"></i>Arşive</button>
        <button class="bs" style="font-size:12px;padding:6px 12px;color:var(--tx-main);border-color:rgba(201,80,80,0.3)" onclick="deleteBatch()" ${_sel.size===0?'disabled':''}><i data-lucide="trash-2" class="icon-xs" style="margin-right:4px"></i>Sil</button>
      ` : `
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="_selMode=true;_sel.clear();render()"><i data-lucide="check-square" class="icon-xs" style="margin-right:4px"></i>Seç</button>
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="exportGalleryZip()"><i data-lucide="download" class="icon-xs" style="margin-right:4px"></i>ZIP</button>
        <button class="bg" style="color:var(--tx-main)" onclick="if(confirm('Tüm galeriyi sil?')){S.gallery=[];saveDB();render()}"><i data-lucide="trash" class="icon-xs" style="margin-right:4px"></i>Temizle</button>
      `}
    </div>
  </div>`;

  o += `<div style="font-size:11px;color:var(--tx-muted);margin-bottom:12px">${items.length} görsel</div>`;

  if (S.activeFolder) {
    o += `<button class="bs mb16" onclick="S.activeFolder=null;render()">← Klasörlere Dön</button>`;
  }

  // ── Klasör görünümü ──
  if (S.galleryView === 'folders' && !S.activeFolder) {
    let groups = {};
    items.forEach(g => { let b = g.batch || 'Genel'; if (!groups[b]) groups[b] = []; groups[b].push(g); });
    o += `<div class="gg">${Object.keys(groups).map(f =>
      `<div class="folder-card" onclick="S.activeFolder='${f}';render()">
        <div class="folder-icon">${IC.folder}</div>
        <div class="folder-info">
          <div class="folder-name">${h(f)}</div>
          <div class="folder-count">${groups[f].length} öğe</div>
        </div>
      </div>`
    ).join('')}</div>`;
    return o;
  }

  // ── Grid görünümü ──
  o += `<div class="gg">`;
  items.forEach((it, i) => {
    if (S.activeFolder && (it.batch || 'Genel') !== S.activeFolder) return;
    var isVid = it.result && (it.result.includes('.mp4') || it.result.includes('video'));
    var sc = it.scores || {};
    var avg = (sc.tutarlilik || 0) + (sc.dogallik || 0) + (sc.yeterlilik || 0);
    var avgVal = (sc.tutarlilik || sc.dogallik || sc.yeterlilik) ? avg / 3 : 0;
    var isSel = _sel.has(i);

    o += `<div class="gc${isSel ? ' gc-selected' : ''}" style="position:relative;${isSel ? 'outline:2px solid var(--ac-orange);outline-offset:2px;border-radius:var(--rad-md)' : ''}"
      onclick="${_selMode ? `toggleGalSel(${i})` : `S.sg=${i};render()`}">`;

    // Seçim checkbox (çoklu modda)
    if (_selMode) {
      o += `<div style="position:absolute;top:7px;left:7px;z-index:5;width:20px;height:20px;border-radius:6px;border:2px solid ${isSel ? 'var(--ac-orange)' : 'rgba(255,255,255,0.5)'};background:${isSel ? 'var(--ac-orange)' : 'rgba(0,0,0,0.4)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;pointer-events:none">
        ${isSel ? '✓' : ''}
      </div>`;
    }

    // Skor badge
    if (avgVal > 0) {
      var col = avgVal >= 7 ? 'var(--green)' : avgVal >= 4 ? 'var(--ac-orange)' : 'var(--red)';
      var bg  = avgVal >= 7 ? 'rgba(74,222,128,0.2)' : avgVal >= 4 ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.2)';
      o += `<div class="gc-score"><span style="background:${bg};color:${col};padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700">${avgVal.toFixed(1)}</span></div>`;
    }

    // Thumbnail
    if (isVid) {
      o += `<div style="aspect-ratio:1;background:var(--bg-cream);display:flex;align-items:center;justify-content:center">${IC.vid_muted}</div>`;
    } else {
      o += `<img src="${it.result}" loading="lazy">`;
    }

    // Alt bilgi + hızlı aksiyon butonları
    o += `<div class="gc-i">
      <div class="gc-n">${it.flagged ? '<i data-lucide="alert-triangle" class="icon-xs" style="margin-right:4px;color:var(--ac-orange)"></i>' : ''}${h(it.ref ? it.ref.name : 'Görsel')}</div>
      <div class="fb">
        <div class="gc-m">${M[it.model] ? M[it.model].n : it.model}</div>
        ${_selMode ? '' : `<div class="fc g4" onclick="event.stopPropagation()">
          <button title="Arşive at" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s;display:flex;align-items:center" onmouseenter="this.style.color='var(--ac-blue)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="archiveSingle(${i})"><i data-lucide="archive" class="icon-xs"></i></button>
          <button title="Sil" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s;display:flex;align-items:center" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="deleteSingle(${i})"><i data-lucide="trash-2" class="icon-xs"></i></button>
        </div>`}
      </div>
    </div>`;

    o += `</div>`;
  });
  o += `</div>`;

  return o;
}

// ══════════════════════════════════════════════════════════════
// ARŞİV PANELİ
// ══════════════════════════════════════════════════════════════
function renderArchivePanel() {
  var items = S.archive || [];
  var o = '';

  o += `<div class="fb mb16" style="flex-wrap:wrap;gap:10px">
    <div class="fc g8">
      <button class="bs" style="font-size:12px;padding:6px 14px" onclick="_galView='gallery';render()">← Galeriye Dön</button>
      <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700">🗄 Arşiv</div>
      <span style="font-size:11px;color:var(--tx-muted)">${items.length} öğe</span>
    </div>
  </div>`;

  if (items.length === 0) {
    o += `<div style="text-align:center;padding:60px 20px;color:var(--tx-muted)">
      <div style="font-size:40px;margin-bottom:12px">🗄</div>
      <div style="font-size:14px">Arşiv boş</div>
      <div style="font-size:12px;margin-top:6px">Galeri görsellerini arşive taşıyabilirsin</div>
    </div>`;
    return o;
  }

  o += `<div class="gg">`;
  items.forEach((it, i) => {
    var isVid = it.result && (it.result.includes('.mp4') || it.result.includes('video'));
    var dateStr = it.archivedAt ? new Date(it.archivedAt).toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '';

    o += `<div class="gc" style="position:relative;opacity:0.88">`;
    if (isVid) {
      o += `<div style="aspect-ratio:1;background:var(--bg-cream);display:flex;align-items:center;justify-content:center">${IC.vid_muted}</div>`;
    } else {
      o += `<img src="${it.result}" loading="lazy">`;
    }
    o += `<div class="gc-i">
      <div class="gc-n" style="font-size:10px">${h(it.ref ? it.ref.name : 'Görsel')}</div>
      <div class="fb" style="margin-top:4px">
        <span style="font-size:9px;color:var(--tx-muted)">${dateStr}</span>
        <div class="fc g4">
          <button title="Geri Getir" style="background:none;border:none;cursor:pointer;font-size:12px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s" onmouseenter="this.style.color='var(--green)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="restoreArchive(${i})">↩</button>
          <button title="İndir" style="background:none;border:none;cursor:pointer;font-size:12px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s" onmouseenter="this.style.color='var(--ac-orange)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="openDownloadModal('${it.result}','${h(it.ref ? it.ref.name : 'gorsel')}')">⬇</button>
          <button title="Kalıcı Sil" style="background:none;border:none;cursor:pointer;font-size:12px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="deleteArchiveItem(${i})">🗑</button>
        </div>
      </div>
    </div></div>`;
  });
  o += `</div>`;

  return o;
}

// ══════════════════════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════════════════════
function renderLightbox(){
  var o = '';
  if (S.sg !== null && S.gallery[S.sg]) {
    var it = S.gallery[S.sg];
    var isVid = it.result && (it.result.includes('.mp4') || it.result.includes('video'));

    o += `<div class="lb" onclick="S.sg=null;render()"><div class="lb-in" onclick="event.stopPropagation()">
      <div class="lb-img-wrap">
        ${isVid
          ? `<video controls autoplay loop class="lb-img"><source src="${it.result}" type="video/mp4"></video>`
          : `<img class="lb-img" src="${it.result}">`}
      </div>
      <div class="lb-b">
        <div class="fb mb14">
          <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(it.ref ? it.ref.name : 'Görsel')}</div>
          <div class="fc g6 flex-shrink-0">
            <span class="badge" style="font-size:10px">${it.strat || ''}</span>
            <span class="badge orange" style="font-size:10px">${M[it.model] ? M[it.model].n : it.model}</span>
          </div>
        </div>

        ${!isVid ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <button class="bp" style="background:var(--green);font-size:12px;padding:10px" onclick="sendToMagicTool(${S.sg},'video','kling25')">Video Yap</button>
          <button class="bp" style="background:var(--ac-orange);font-size:12px;padding:10px" onclick="openRevize(${S.sg})">Revize Et</button>
          <button class="bp" style="background:var(--brd);color:var(--tx-main);font-size:12px;padding:10px" onclick="sendToMagicTool(${S.sg},'bgrem','bgrem')">BG Sil</button>
          <button class="bp" style="background:var(--bg-cream);color:var(--tx-main);border:1.5px solid var(--brd);font-size:12px;padding:10px" onclick="sendToMagicTool(${S.sg},'upscale','upscale')">4K Büyüt</button>
        </div>` : ''}

        <!-- SKORLAMA -->
        <div style="margin-bottom:14px;padding:14px;background:var(--bg-card);border:1px solid var(--brd);border-radius:12px">
          <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:10px">SKORLAMA</div>
          ${(()=>{
            var st=[['tutarlilik','TUTARLILIK','Brief ile sonuç örtüşüyor mu','var(--ac-peach)'],['dogallik','DOGALLIK','AI / Photoshop hissi yok mu','var(--green)'],['yeterlilik','YETERLİLİK','Genel kalite yeterli mi','var(--ac-orange)']];
            return st.map(([type,label,tip,color])=>{
              let val = it.scores ? it.scores[type] || 0 : 0;
              return `<div style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                  <span style="font-size:10px;font-weight:700;color:var(--tx-muted)">${label}</span>
                  <span style="font-size:10px;color:var(--tx-muted)">${tip}</span>
                  <span style="font-size:11px;font-weight:700;color:${val>0?color:'var(--tx-muted)'};min-width:20px;text-align:right">${val>0?val:'-'}</span>
                </div>
                <div class="score-bar" data-gi="${S.sg}" data-type="${type}"onclick="handleScoreClick(event);_bridgeGalleryScoreToLearning(S.gallery[S.sg])" style="cursor:pointer;height:6px;border-radius:99px;background:var(--bg-deep,rgba(0,0,0,0.2));overflow:hidden">
                  <div style="height:100%;width:${val*10}%;background:${color};border-radius:99px;transition:width 0.3s ease"></div>
                </div>
              </div>`;
            }).join('');
          })()}
        </div>

        <!-- NOTLAR -->
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer"
            onclick="document.getElementById('lb-notes-${S.sg}').style.display=document.getElementById('lb-notes-${S.sg}').style.display==='none'?'block':'none'">
            <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px">NOTLAR ${it.notes&&it.notes.length?`<span style="color:var(--ac-peach)">(${it.notes.length})</span>`:''}</div>
            <div style="font-size:10px;color:var(--tx-muted)">+ Ekle / Gör</div>
          </div>
          <div id="lb-notes-${S.sg}" style="display:none">
            ${it.notes&&it.notes.length?`<div style="margin-bottom:8px;max-height:120px;overflow-y:auto">${it.notes.map(n=>`
              <div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:8px;padding:8px 10px;margin-bottom:5px">
                <div style="font-size:10px;color:var(--tx-muted);margin-bottom:3px">${new Date(n.ts).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
                <div style="font-size:11px;color:var(--tx-main);line-height:1.5">${h(n.text)}</div>
              </div>`).join('')}</div>`:''}
            <div style="display:flex;gap:6px">
              <textarea id="lb-note-input-${S.sg}" class="inp" style="min-height:52px;flex:1;font-size:12px;resize:none"
                placeholder="Gözlemini yaz... (Enter ile ekle)"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addGalleryNote(${S.sg},this.value);this.value=''}"></textarea>
            </div>
          </div>
        </div>

        <!-- ALT AKSIYONLAR -->
        <div class="fc g8" style="flex-wrap:wrap">
          <button class="bs" style="flex:1;min-width:60px;font-size:12px;padding:8px" onclick="window.open('${it.result}','_blank')">Aç</button>
          <button class="bp" style="flex:2;min-width:100px;font-size:12px;padding:8px;display:flex;align-items:center;justify-content:center;gap:4px"
            onclick="openDownloadModal('${it.result}','${h(it.ref ? it.ref.name : 'gorsel')}_v${S.sg}')"><i data-lucide="download" style="width:14px;height:14px"></i> İndir</button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--green);border-color:rgba(74,222,128,0.3)"
            title="Projeye Kaydet" onclick="openProjectSaveModal(${S.sg})"><i data-lucide="folder-plus" style="width:14px;height:14px"></i></button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)"
            title="Arşive at" onclick="archiveSingle(${S.sg});S.sg=null;render()"><i data-lucide="archive" style="width:14px;height:14px"></i></button>
          <button class="bs" style="font-size:12px;padding:8px;border-color:${it.flagged?'var(--red)':'var(--brd)'};color:${it.flagged?'var(--red)':'var(--tx-muted)'}"
            onclick="S.gallery[${S.sg}].flagged=!S.gallery[${S.sg}].flagged;saveDB();render()"><i data-lucide="flag" style="width:14px;height:14px"></i></button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--red);border-color:rgba(201,80,80,0.3)"
            onclick="deleteSingle(${S.sg});S.sg=null;render()"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          <button class="bg" onclick="S.sg=null;render()"><i data-lucide="x" style="width:14px;height:14px"></i></button>
        </div>
      </div>
    </div></div>`;
  }
  return o;
}

// ══════════════════════════════════════════════════════════════
// İNDİRME İSİM MODAL
// ══════════════════════════════════════════════════════════════
function renderDownloadModal() {
  if (!_dlPending) return '';

  return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)"
    onclick="_dlPending=null;render()">
    <div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:var(--rad-lg);padding:28px;width:360px;max-width:90vw;box-shadow:var(--shadow-soft)"
      onclick="event.stopPropagation()">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px"><i data-lucide="download" style="width:18px;height:18px"></i> İndir</div>
      <div style="font-size:11px;color:var(--tx-muted);margin-bottom:20px">Dosya adını düzenleyebilirsin. Uzantı otomatik eklenir.</div>
      <div style="margin-bottom:18px">
        <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px">DOSYA ADI</div>
        <div style="display:flex;align-items:center;background:var(--bg-cream);border:1.5px solid transparent;border-radius:var(--rad-sm);overflow:hidden;transition:border-color 0.2s"
          onfocusin="this.style.borderColor='var(--ac-orange)'" onfocusout="this.style.borderColor='transparent'">
          <input id="dl-name-inp" type="text" value="${_dlPending.defaultName}"
            style="flex:1;padding:11px 14px;background:transparent;border:none;color:var(--tx-main);font-size:13px;font-family:inherit;outline:none"
            onkeydown="if(event.key==='Enter')confirmDownload()">
          <span style="padding:0 14px;font-size:12px;color:var(--tx-muted);flex-shrink:0">.png</span>
        </div>
      </div>
      <div class="fc g8">
        <button class="bs" style="flex:1;font-size:13px;padding:10px" onclick="_dlPending=null;render()">İptal</button>
        <button class="bp" style="flex:2;font-size:13px;padding:10px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="confirmDownload()"><i data-lucide="download" style="width:14px;height:14px"></i> İndir</button>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// REVİZE MODAL — Yapılandırılmış Geri Bildirim Sistemi
// ══════════════════════════════════════════════════════════════
function renderRevize(){
  var o = '';
  if (!S.revizeOpen || S.revizeIdx === null || !S.gallery[S.revizeIdx]) return o;
  
  var ri = S.gallery[S.revizeIdx];
  var rs = S.revizeStructured;
  
  o += `<div class="revize-modal" onclick="if(!S.revizeRunning){closeRevizeModal()}">
    <div class="revize-inner" onclick="event.stopPropagation()">
      <div class="revize-header">
        <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px">Hedefli Revize</div>
        <div style="font-size:12px;color:var(--tx-muted)">${h(ri.ref ? ri.ref.name : '')} — Daha az maliyet, daha iyi sonuç</div>
      </div>
      
      <div class="revize-body">`;
      
  // ── 1. Görsel ve Maske Seçimi ──
  o += `<div style="display:grid;grid-template-columns:120px 1fr;gap:16px;margin-bottom:20px;align-items:start">
    <div style="position:relative">
      <img src="${ri.result}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;box-shadow:var(--shadow-float);cursor:pointer" onclick="initMaskCanvas()" title="Düzenlemek için alan seç">
      ${rs.maskPreview ? `<div style="position:absolute;top:4px;right:4px;background:var(--ac-orange);color:#fff;font-size:9px;padding:2px 6px;border-radius:99px">Maske var</div>` : ''}
      <div style="font-size:10px;color:var(--tx-muted);text-align:center;margin-top:6px">Görsele tıkla → alan seç</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">1. Görsel Türü</div>
      <select class="inp" style="font-size:12px;padding:8px;margin-bottom:12px" onchange="S.revizeStructured.imageType=this.value;generateRevizePrompt();render()">
        <option value="" ${!rs.imageType?'selected':''}>Görsel türü seç...</option>
        <option value="urun" ${rs.imageType==='urun'?'selected':''}>Ürün Görseli</option>
        <option value="banner" ${rs.imageType==='banner'?'selected':''}>Banner</option>
        <option value="sosyal" ${rs.imageType==='sosyal'?'selected':''}>Sosyal Medya Postu</option>
        <option value="sahne" ${rs.imageType==='sahne'?'selected':''}>Sahne/Render</option>
        <option value="diger" ${rs.imageType==='diger'?'selected':''}>Diğer</option>
      </select>
    </div>
  </div>`;
  
  // ── 2. Alan Seçimi ──
  o += `<div style="margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">2. Seçtiğin Alan Nedir?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <button class="rs-btn ${rs.selectedArea==='insan'?'active':''}" onclick="setRevizeArea('insan')">İnsan / Model</button>
      <button class="rs-btn ${rs.selectedArea==='urun'?'active':''}" onclick="setRevizeArea('urun')">Ürün</button>
      <button class="rs-btn ${rs.selectedArea==='arkaplan'?'active':''}" onclick="setRevizeArea('arkaplan')">Arka Plan</button>
      <button class="rs-btn ${rs.selectedArea==='aksesuar'?'active':''}" onclick="setRevizeArea('aksesuar')">Aksesuar</button>
      <button class="rs-btn ${rs.selectedArea==='detay'?'active':''}" onclick="setRevizeArea('detay')">Detay Bölgesi</button>
      <button class="rs-btn ${rs.selectedArea==='diger'?'active':''}" onclick="setRevizeArea('diger')">Diğer ↓</button>
    </div>
    ${rs.selectedArea==='diger' ? `<input class="inp" placeholder="Alanı tanımla..." value="${h(rs.selectedAreaCustom)}" oninput="S.revizeStructured.selectedAreaCustom=this.value;generateRevizePrompt()" style="font-size:12px;padding:8px;margin-top:4px">` : ''}
  </div>`;
  
  // ── 3. Sorun Tipi ──
  o += `<div style="margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">3. Sorun Nedir?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <button class="rs-btn ${rs.problemType==='anatomik'?'active':''}" onclick="setRevizeProblem('anatomik')">Anatomik Hata</button>
      <button class="rs-btn ${rs.problemType==='isik'?'active':''}" onclick="setRevizeProblem('isik')">Işık Hatası</button>
      <button class="rs-btn ${rs.problemType==='kompozisyon'?'active':''}" onclick="setRevizeProblem('kompozisyon')">Kompozisyon Bozuk</button>
      <button class="rs-btn ${rs.problemType==='stil'?'active':''}" onclick="setRevizeProblem('stil')">Stil Uyumsuz</button>
      <button class="rs-btn ${rs.problemType==='kalite'?'active':''}" onclick="setRevizeProblem('kalite')">Kalite Düşük</button>
      <button class="rs-btn ${rs.problemType==='diger'?'active':''}" onclick="setRevizeProblem('diger')">Diğer ↓</button>
    </div>
    ${rs.problemType ? `<input class="inp" placeholder="Detay ekle (opsiyonel)..." value="${h(rs.problemDetail)}" oninput="S.revizeStructured.problemDetail=this.value;generateRevizePrompt()" style="font-size:12px;padding:8px;margin-top:4px">` : ''}
  </div>`;
  
  // ── 4. İstenen Sonuç ──
  o += `<div style="margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">4. Nasıl Olmasını İstiyorsun?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <button class="rs-btn ${rs.desiredOutcome==='sade'?'active':''}" onclick="setRevizeOutcome('sade')">Daha Sade</button>
      <button class="rs-btn ${rs.desiredOutcome==='gercekci'?'active':''}" onclick="setRevizeOutcome('gercekci')">Daha Gerçekçi</button>
      <button class="rs-btn ${rs.desiredOutcome==='profesyonel'?'active':''}" onclick="setRevizeOutcome('profesyonel')">Daha Profesyonel</button>
      <button class="rs-btn ${rs.desiredOutcome==='minimal'?'active':''}" onclick="setRevizeOutcome('minimal')">Daha Minimal</button>
      <button class="rs-btn ${rs.desiredOutcome==='diger'?'active':''}" onclick="setRevizeOutcome('diger')" style="grid-column:span 2">Manuel Giriş ↓</button>
    </div>
    ${rs.desiredOutcome==='diger' ? `<input class="inp" placeholder="Tercihini yaz..." value="${h(rs.desiredOutcomeCustom)}" oninput="S.revizeStructured.desiredOutcomeCustom=this.value;generateRevizePrompt()" style="font-size:12px;padding:8px;margin-top:4px">` : ''}
  </div>`;
  
  // ── 5. Oluşan Prompt (Önizleme) ──
  if (rs.generatedPrompt) {
    o += `<div style="background:var(--bg-cream);border:1.5px dashed var(--brd-soft);border-radius:12px;padding:12px;margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);margin-bottom:6px">Üretilen Prompt</div>
      <div style="font-size:11px;color:var(--tx-main);line-height:1.5">${h(rs.generatedPrompt)}</div>
    </div>`;
  }
  
  // ── Öneriler (Learning) ──
  var suggestions = getRevizeSuggestions();
  if (suggestions.length > 0) {
    o += `<div style="margin-bottom:16px;padding:12px;background:rgba(212,100,42,0.08);border-radius:10px">
      <div style="font-size:10px;font-weight:700;color:var(--ac-orange);margin-bottom:6px">💡 Önceki Benzer Düzeltmeler</div>
      <div style="font-size:11px;color:var(--tx-main)">
        ${suggestions.slice(0, 2).map(s => `<div style="margin-bottom:4px;cursor:pointer" onclick="applyRevizeSuggestion('${s.id}')">• ${h(s.area)} → ${h(s.outcome)} (başarı: ${s.successRate}%)</div>`).join('')}
      </div>
    </div>`;
  }
  
  // ── Butonlar ──
  o += `<div class="fc g10">
    <button class="bs" style="flex:1" onclick="closeRevizeModal()" ${S.revizeRunning ? 'disabled' : ''}>İptal</button>
    <button class="bp" style="flex:2" onclick="runStructuredRevize()" ${S.revizeRunning || !rs.generatedPrompt ? 'disabled' : ''}>
      ${S.revizeRunning ? '<span class="spinner"></span> İşleniyor...' : (rs.useInpainting && rs.maskPreview ? 'Inpaint & Kuyruğa At' : 'Revize & Kuyruğa At')}
    </button>
  </div>`;
  
  // ── Maske Canvas Modal ──
  if (rs.active) {
    o += `<div class="mask-modal" onclick="event.stopPropagation()">
      <div style="background:var(--bg-card);border-radius:var(--rad-lg);padding:20px;max-width:90vw;max-height:90vh;overflow:auto">
        <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:12px">Düzenlenecek Alanı Seç</div>
        <div style="font-size:11px;color:var(--tx-muted);margin-bottom:12px">Farenle görsel üzerinde alan çiz. Kırmızı alan değiştirilecek bölgeyi gösterir.</div>
        <div style="position:relative;display:inline-block">
          <canvas id="maskCanvas" style="border-radius:8px;cursor:crosshair;max-width:85vw;max-height:70vh;width:auto;height:auto;display:block"></canvas>
          <div style="position:absolute;bottom:10px;left:10px;display:flex;gap:8px">
            <button onclick="clearMask()" style="padding:6px 12px;font-size:11px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:6px;cursor:pointer">Temizle</button>
            <button onclick="invertMask()" style="padding:6px 12px;font-size:11px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:6px;cursor:pointer">Ters Çevir</button>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="bs" onclick="closeMaskModal()">İptal</button>
          <button class="bp" onclick="saveMask()">Maskeyi Kaydet</button>
        </div>
      </div>
    </div>`;
  }
  
  o += `</div></div></div>`;
  
  return o;
}

// ══════════════════════════════════════════════════════════════
// AKSİYON FONKSİYONLARI
// ══════════════════════════════════════════════════════════════

// Çoklu seçim toggle
function toggleGalSel(i) {
  if (_sel.has(i)) _sel.delete(i); else _sel.add(i);
  render();
}

// Tek sil
async function deleteSingle(i) {
  if (!confirm('Bu görseli silmek istiyor musun?')) return;
  try {
    const r = await fetch(`/api/gallery/${i}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      S.gallery.splice(i, 1);
      if (S.sg === i) S.sg = null;
      else if (S.sg !== null && S.sg > i) S.sg--;
      render();
    } else { alert('Silme hatası: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// Çoklu sil
async function deleteBatch() {
  if (_sel.size === 0) return;
  if (!confirm(`${_sel.size} görseli silmek istiyor musun?`)) return;
  try {
    const indices = [..._sel];
    const r = await fetch('/api/gallery/delete-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indices })
    });
    const d = await r.json();
    if (d.success) {
      [...indices].sort((a,b)=>b-a).forEach(i => S.gallery.splice(i, 1));
      _sel.clear(); _selMode = false;
      S.sg = null;
      render();
    } else { alert('Hata: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// Tek arşive
async function archiveSingle(i) {
  try {
    const r = await fetch(`/api/gallery/archive/${i}`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
      const item = S.gallery.splice(i, 1)[0];
      item.archivedAt = new Date().toISOString();
      if (!S.archive) S.archive = [];
      S.archive.push(item);
      if (S.sg === i) S.sg = null;
      else if (S.sg !== null && S.sg > i) S.sg--;
      render();
    } else { alert('Arşiv hatası: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// Çoklu arşive
async function archiveBatch() {
  if (_sel.size === 0) return;
  try {
    const indices = [..._sel];
    const r = await fetch('/api/gallery/archive-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indices })
    });
    const d = await r.json();
    if (d.success) {
      if (!S.archive) S.archive = [];
      [...indices].sort((a,b)=>b-a).forEach(i => {
        const item = S.gallery.splice(i, 1)[0];
        item.archivedAt = new Date().toISOString();
        S.archive.push(item);
      });
      _sel.clear(); _selMode = false;
      S.sg = null;
      render();
    } else { alert('Hata: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// Arşivden geri getir
async function restoreArchive(i) {
  try {
    const r = await fetch(`/api/archive/restore/${i}`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
      if (!S.gallery) S.gallery = [];
      const item = S.archive.splice(i, 1)[0];
      delete item.archivedAt;
      S.gallery.push(item);
      render();
    } else { alert('Geri getirme hatası: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// Arşivden kalıcı sil
async function deleteArchiveItem(i) {
  if (!confirm('Arşiv öğesini kalıcı olarak silmek istiyor musun?')) return;
  try {
    const r = await fetch(`/api/archive/${i}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      S.archive.splice(i, 1);
      render();
    } else { alert('Silme hatası: ' + (d.error || '')); }
  } catch(e) { alert('Sunucu hatası: ' + e.message); }
}

// ── İndirme isim modal ──
function openDownloadModal(url, defaultName) {
  _dlPending = { url, defaultName };
  render();
  setTimeout(() => {
    var inp = document.getElementById('dl-name-inp');
    if (inp) { inp.focus(); inp.select(); }
  }, 80);
}

function confirmDownload() {
  if (!_dlPending) return;
  var inp = document.getElementById('dl-name-inp');
  var name = (inp ? inp.value.trim() : '') || _dlPending.defaultName;
  downloadSingle(_dlPending.url, name);
  _dlPending = null;
  render();
}

// ══════════════════════════════════════════════════════════════
// YAPILANDIRILMIŞ REVİZE — Maske & Prompt Sistemi
// ══════════════════════════════════════════════════════════════

var _maskCtx = null;
var _maskDrawing = false;
var _maskCanvasEl = null;

function openRevize(galIdx) {
  S.revizeOpen = true;
  S.revizeIdx = galIdx;
  // Reset structured state
  S.revizeStructured = {
    active:false,
    imageType:'',
    selectedArea:'',
    selectedAreaCustom:'',
    problemType:'',
    problemDetail:'',
    desiredOutcome:'',
    desiredOutcomeCustom:'',
    maskCanvas:null,
    maskPreview:null,
    generatedPrompt:'',
    useInpainting:true
  };
  render();
}

function closeRevizeModal() {
  S.revizeOpen = false;
  S.revizeIdx = null;
  S.revizeStructured.active = false;
  render();
}

function setRevizeArea(area) {
  S.revizeStructured.selectedArea = area;
  generateRevizePrompt();
  render();
}

function setRevizeProblem(problem) {
  S.revizeStructured.problemType = problem;
  generateRevizePrompt();
  render();
}

function setRevizeOutcome(outcome) {
  S.revizeStructured.desiredOutcome = outcome;
  generateRevizePrompt();
  render();
}

// ── Template Tabanlı Prompt Üretimi ──
function generateRevizePrompt() {
  var rs = S.revizeStructured;
  if (!rs.imageType || !rs.selectedArea || !rs.problemType || !rs.desiredOutcome) {
    rs.generatedPrompt = '';
    return;
  }
  
  // Mapping tablosu
  var typeMap = {urun:'product image',banner:'banner',sosyal:'social media post',sahne:'scene/render',diger:'image'};
  var areaMap = {insan:'human/model',urun:'product',arkaplan:'background',aksesuar:'accessory',detay:'detail area'};
  var problemMap = {
    anatomik:'anatomical error',
    isik:'lighting issue', 
    kompozisyon:'composition problem',
    stil:'style mismatch',
    kalite:'quality issue'
  };
  var outcomeMap = {sade:'cleaner',gercekci:'more realistic',profesyonel:'more professional',minimal:'more minimal'};
  
  var type = typeMap[rs.imageType] || 'image';
  var area = areaMap[rs.selectedArea] || rs.selectedAreaCustom || 'selected area';
  var problem = problemMap[rs.problemType] || rs.problemDetail || 'issue';
  var outcome = outcomeMap[rs.desiredOutcome] || rs.desiredOutcomeCustom || 'improved';
  
  // Template
  var templates = [
    `Fix the ${area} in this ${type}. Issue: ${problem}. Make it ${outcome}. Keep overall composition consistent.`,
    `Correct ${problem} in ${area} of ${type}. Transform to be ${outcome}. Preserve surrounding elements.`,
    `Improve ${area}: ${problem}. Target: ${outcome}. Maintain original context.`
  ];
  
  // Detay varsa ekle
  var prompt = templates[0];
  if (rs.problemDetail && rs.problemType !== 'diger') {
    prompt += ` Specifically: ${rs.problemDetail}.`;
  }
  
  rs.generatedPrompt = prompt;
}

// ── Maske Canvas Sistemi ──
function initMaskCanvas() {
  S.revizeStructured.active = true;
  render();
  setTimeout(setupMaskCanvas, 100);
}

function setupMaskCanvas() {
  _maskCanvasEl = document.getElementById('maskCanvas');
  if (!_maskCanvasEl) return;
  
  var ctx = _maskCanvasEl.getContext('2d');
  _maskCtx = ctx;
  
  // Görseli yükle ve canvas'a çiz
  var img = new Image();
  img.crossOrigin = 'anonymous';
  var ri = S.gallery[S.revizeIdx];
  img.src = ri ? ri.result : '';
  
  img.onload = function() {
    // Canvas boyutunu görsele göre ayarla
    _maskCanvasEl.width = img.naturalWidth || 512;
    _maskCanvasEl.height = img.naturalHeight || 512;
    
    // Görseli çiz
    ctx.drawImage(img, 0, 0);
    
    // Yarı saydam siyah overlay ekle
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, _maskCanvasEl.width, _maskCanvasEl.height);
    ctx.globalAlpha = 1.0;
  };
  
  img.onerror = function() {
    // Görsel yüklenemezse beyaz arka plan
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 512, 512);
  };
  
  // Event listeners
  _maskCanvasEl.addEventListener('mousedown', startMaskDraw);
  _maskCanvasEl.addEventListener('mousemove', drawMask);
  _maskCanvasEl.addEventListener('mouseup', stopMaskDraw);
  _maskCanvasEl.addEventListener('mouseleave', stopMaskDraw);
  
  // Touch desteği
  _maskCanvasEl.addEventListener('touchstart', handleTouch, {passive:false});
  _maskCanvasEl.addEventListener('touchmove', handleTouch, {passive:false});
  _maskCanvasEl.addEventListener('touchend', stopMaskDraw);
}

function handleTouch(e) {
  e.preventDefault();
  var touch = e.touches[0];
  var rect = _maskCanvasEl.getBoundingClientRect();
  var scaleX = (_maskCanvasEl.width || 512) / rect.width;
  var scaleY = (_maskCanvasEl.height || 512) / rect.height;
  var x = (touch.clientX - rect.left) * scaleX;
  var y = (touch.clientY - rect.top) * scaleY;
  
  if (e.type === 'touchstart') {
    _maskDrawing = true;
    drawMaskPoint(x, y);
  } else if (_maskDrawing) {
    drawMaskPoint(x, y);
  }
}

function startMaskDraw(e) {
  _maskDrawing = true;
  var rect = _maskCanvasEl.getBoundingClientRect();
  var scaleX = (_maskCanvasEl.width || 512) / rect.width;
  var scaleY = (_maskCanvasEl.height || 512) / rect.height;
  var x = (e.clientX - rect.left) * scaleX;
  var y = (e.clientY - rect.top) * scaleY;
  drawMaskPoint(x, y);
}

function drawMask(e) {
  if (!_maskDrawing) return;
  var rect = _maskCanvasEl.getBoundingClientRect();
  var scaleX = (_maskCanvasEl.width || 512) / rect.width;
  var scaleY = (_maskCanvasEl.height || 512) / rect.height;
  var x = (e.clientX - rect.left) * scaleX;
  var y = (e.clientY - rect.top) * scaleY;
  drawMaskPoint(x, y);
}

function drawMaskPoint(x, y) {
  if (!_maskCtx) return;
  var brushSize = Math.max(10, (_maskCanvasEl.width || 512) / 30);
  _maskCtx.globalCompositeOperation = 'source-over';
  _maskCtx.fillStyle = '#FF0000';
  _maskCtx.beginPath();
  _maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
  _maskCtx.fill();
}

function stopMaskDraw() {
  _maskDrawing = false;
}

function clearMask() {
  if (!_maskCtx || !_maskCanvasEl) return;
  // Görseli yeniden yükle
  var img = new Image();
  img.crossOrigin = 'anonymous';
  var ri = S.gallery[S.revizeIdx];
  img.src = ri ? ri.result : '';
  img.onload = function() {
    _maskCtx.drawImage(img, 0, 0);
    _maskCtx.globalAlpha = 0.4;
    _maskCtx.fillStyle = '#000000';
    _maskCtx.fillRect(0, 0, _maskCanvasEl.width, _maskCanvasEl.height);
    _maskCtx.globalAlpha = 1.0;
  };
}

function invertMask() {
  if (!_maskCtx || !_maskCanvasEl) return;
  var imageData = _maskCtx.getImageData(0, 0, _maskCanvasEl.width, _maskCanvasEl.height);
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    // Kırmızı alanları beyaz, diğerini siyah yap
    if (data[i] > 200 && data[i+1] < 50 && data[i+2] < 50) {
      data[i] = 255; data[i+1] = 255; data[i+2] = 255;
    } else {
      data[i] = 0; data[i+1] = 0; data[i+2] = 0;
    }
  }
  _maskCtx.putImageData(imageData, 0, 0);
  _maskCtx.globalAlpha = 0.3;
  _maskCtx.fillStyle = '#000000';
  _maskCtx.fillRect(0, 0, _maskCanvasEl.width, _maskCanvasEl.height);
  _maskCtx.globalAlpha = 1.0;
}

function saveMask() {
  if (!_maskCanvasEl) return;
  var w = _maskCanvasEl.width || 512;
  var h = _maskCanvasEl.height || 512;
  // Canvas'ı base64'e çevir
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  var tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(_maskCanvasEl, 0, 0);
  
  var imageData = tempCtx.getImageData(0, 0, w, h);
  var data = imageData.data;
  
  // Sadece kırmızı kanalı maske olarak kaydet (beyaz = maske, siyah = koru)
  for (var i = 0; i < data.length; i += 4) {
    if (data[i] > 200 && data[i+1] < 50 && data[i+2] < 50) {
      data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255;
    } else {
      data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255;
    }
  }
  tempCtx.putImageData(imageData, 0, 0);
  
  // Maskeyi base64 olarak kaydet
  S.revizeStructured.maskCanvas = tempCanvas.toDataURL('image/png');
  S.revizeStructured.maskPreview = tempCanvas.toDataURL('image/png');
  S.revizeStructured.active = false;
  render();
}

function closeMaskModal() {
  S.revizeStructured.active = false;
  render();
}

// ── Revize Öğrenme Sistemi ──
function getRevizeSuggestions() {
  if (!S.revizeHistory || S.revizeHistory.length === 0) return [];
  
  var rs = S.revizeStructured;
  if (!rs.selectedArea) return [];
  
  // Benzer alan ve sorun tipindeki geçmiş kayıtları bul
  var matches = S.revizeHistory.filter(h => 
    h.area === rs.selectedArea && 
    (h.problem === rs.problemType || h.successRate > 70)
  );
  
  return matches.sort((a, b) => b.successRate - a.successRate);
}

function applyRevizeSuggestion(id) {
  var suggestion = S.revizeHistory.find(h => h.id === id);
  if (!suggestion) return;
  
  S.revizeStructured.problemType = suggestion.problem;
  S.revizeStructured.desiredOutcome = suggestion.outcome;
  generateRevizePrompt();
  render();
}

function saveRevizeToHistory(galIdx, success) {
  var rs = S.revizeStructured;
  if (!rs.selectedArea || !rs.problemType) return;
  
  var record = {
    id: 'rev_' + Date.now(),
    timestamp: Date.now(),
    galleryId: S.gallery[galIdx]?.id,
    imageType: rs.imageType,
    area: rs.selectedArea,
    areaCustom: rs.selectedAreaCustom,
    problem: rs.problemType,
    problemDetail: rs.problemDetail,
    outcome: rs.desiredOutcome,
    outcomeCustom: rs.desiredOutcomeCustom,
    prompt: rs.generatedPrompt,
    hasMask: !!rs.maskCanvas,
    success: success,
    successRate: success ? 100 : 0
  };
  
  if (!S.revizeHistory) S.revizeHistory = [];
  S.revizeHistory.unshift(record);
  if (S.revizeHistory.length > 100) S.revizeHistory = S.revizeHistory.slice(0, 100);
  
  saveDB();
}

// ── Yapılandırılmış Revize Çalıştır ──
async function runStructuredRevize() {
  if (S.revizeRunning) return;
  
  var rs = S.revizeStructured;
  if (!rs.generatedPrompt) {
    toast('Lütfen tüm alanları doldurun');
    return;
  }
  
  S.revizeRunning = true;
  render();
  
  try {
    var ri = S.gallery[S.revizeIdx];
    var model = S.mdl;
    
    // Maske varsa inpainting yap, yoksa normal revize
    var useInpaint = rs.useInpainting && rs.maskCanvas;
    
    // Kuyruk item'ı oluştur
    var item = {
      id: 'q_' + Date.now(),
      ref: {url: ri.result, name: ri.ref?.name || 'revize'},
      prompt: rs.generatedPrompt,
      model: useInpaint ? 'f2proedit' : model, // Inpainting için pro edit
      strat: 'Revize: ' + rs.problemType,
      status: 'pending',
      isRevision: true,
      originalIdx: S.revizeIdx,
      maskUrl: rs.maskCanvas,
      useInpainting: useInpaint
    };
    
    S.queue.push(item);
    saveDB();
    
    // Geçmişe kaydet (başarı henüz bilinmiyor, varsayılan 50%)
    saveRevizeToHistory(S.revizeIdx, true);
    
    toast('Revize kuyruğa atıldı' + (useInpaint ? ' (Inpainting)' : ''));
    closeRevizeModal();
    
    // Queue işlemini başlat
    if (!S.run && typeof startQueue === 'function') startQueue();
    else if (!S.run && typeof runAll === 'function') runAll();
    
  } catch (e) {
    toast('Hata: ' + e.message);
    console.error(e);
  } finally {
    S.revizeRunning = false;
    render();
  }
}

// Eski runRevize fonksiyonu (geriye uyumluluk)
async function runRevize() {
  // Yeni sisteme yönlendir
  if (!S.revizeStructured.generatedPrompt) {
    toast('Lütfen önce revize detaylarını seçin');
    return;
  }
  runStructuredRevize();
}