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
        <button class="bs" style="padding:6px 14px;font-size:12px;${S.galleryView==='folders'?'background:var(--ac-orange);color:#fff;border-color:transparent':''}" onclick="S.galleryView='folders';S.activeFolder=null;saveDB();render()">Klasörler</button>
        <button class="bs" style="padding:6px 14px;font-size:12px;${S.galleryView==='all'?'background:var(--ac-orange);color:#fff;border-color:transparent':''}" onclick="S.galleryView='all';S.activeFolder=null;saveDB();render()">Tümü</button>
      </div>
      <button class="bs" style="padding:6px 14px;font-size:12px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)" onclick="_galView='archive';render()">
        🗄 Arşiv ${(S.archive&&S.archive.length)?`<span style="font-size:10px;background:rgba(90,143,168,0.15);padding:1px 6px;border-radius:99px;margin-left:4px">${S.archive.length}</span>`:''}
      </button>
    </div>
    <div class="fc g8">
      ${_selMode ? `
        <span style="font-size:12px;color:var(--tx-muted)">${_sel.size} seçili</span>
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="_sel.clear();_selMode=false;render()">İptal</button>
        <button class="bs" style="font-size:12px;padding:6px 12px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)" onclick="archiveBatch()" ${_sel.size===0?'disabled':''}>🗄 Arşive</button>
        <button class="bs" style="font-size:12px;padding:6px 12px;color:var(--red);border-color:rgba(201,80,80,0.3)" onclick="deleteBatch()" ${_sel.size===0?'disabled':''}>🗑 Sil</button>
      ` : `
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="_selMode=true;_sel.clear();render()">✓ Seç</button>
        <button class="bs" style="font-size:12px;padding:6px 12px" onclick="exportGalleryZip()">ZIP</button>
        <button class="bg" style="color:var(--red)" onclick="if(confirm('Tüm galeriyi sil?')){S.gallery=[];saveDB();render()}">Temizle</button>
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
      <div class="gc-n">${it.flagged ? '⚠ ' : ''}${h(it.ref ? it.ref.name : 'Görsel')}</div>
      <div class="fb">
        <div class="gc-m">${M[it.model] ? M[it.model].n : it.model}</div>
        ${!_selMode ? `<div class="fc g4" onclick="event.stopPropagation()">
          <button title="Arşive at" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s" onmouseenter="this.style.color='var(--ac-blue)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="archiveSingle(${i})">🗄</button>
          <button title="Sil" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;color:var(--tx-muted);transition:color 0.2s" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--tx-muted)'" onclick="deleteSingle(${i})">🗑</button>
        </div>` : ''}
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
          <button class="bp" style="flex:2;min-width:100px;font-size:12px;padding:8px"
            onclick="openDownloadModal('${it.result}','${h(it.ref ? it.ref.name : 'gorsel')}_v${S.sg}')">⬇ İndir</button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--green);border-color:rgba(74,222,128,0.3)"
            title="Projeye Kaydet" onclick="openProjectSaveModal(${S.sg})">📁</button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--ac-blue);border-color:rgba(90,143,168,0.3)"
            title="Arşive at" onclick="archiveSingle(${S.sg});S.sg=null;render()">🗄</button>
          <button class="bs" style="font-size:12px;padding:8px;border-color:${it.flagged?'var(--red)':'var(--brd)'};color:${it.flagged?'var(--red)':'var(--tx-muted)'}"
            onclick="S.gallery[${S.sg}].flagged=!S.gallery[${S.sg}].flagged;saveDB();render()">⚠</button>
          <button class="bs" style="font-size:12px;padding:8px;color:var(--red);border-color:rgba(201,80,80,0.3)"
            onclick="deleteSingle(${S.sg});S.sg=null;render()">🗑</button>
          <button class="bg" onclick="S.sg=null;render()">✕</button>
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
      <div style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;margin-bottom:4px">⬇ İndir</div>
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
        <button class="bp" style="flex:2;font-size:13px;padding:10px" onclick="confirmDownload()">⬇ İndir</button>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// REVİZE MODAL
// ══════════════════════════════════════════════════════════════
function renderRevize(){
  var o = '';
  if (S.revizeOpen && S.revizeIdx !== null && S.gallery[S.revizeIdx]) {
    var ri = S.gallery[S.revizeIdx];
    o += `<div class="revize-modal" onclick="if(!S.revizeRunning){S.revizeOpen=false;render()}">
      <div class="revize-inner" onclick="event.stopPropagation()">
        <div class="revize-header">
          <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px">Revize Et & Yeniden Üret</div>
          <div style="font-size:12px;color:var(--tx-muted)">${h(ri.ref ? ri.ref.name : '')} — seçili model: <strong>${M[S.mdl] ? M[S.mdl].n : '?'}</strong></div>
        </div>
        <div class="revize-body">
          <div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">
            <img src="${ri.result}" style="width:80px;height:80px;border-radius:12px;object-fit:cover;flex-shrink:0;box-shadow:var(--shadow-float)">
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">MEVCUT PROMPT</div>
              <div style="font-size:11px;color:var(--tx-main);line-height:1.6;background:var(--bg-cream);padding:10px;border-radius:10px;max-height:80px;overflow-y:auto">${h(ri.prompt)}</div>
            </div>
          </div>
          <div style="margin-bottom:16px">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px">Revize Notu <span style="color:var(--tx-muted);font-weight:400">(opsiyonel)</span></div>
            <textarea class="inp" style="min-height:80px" placeholder="örn: Arka planı sade yap, ışığı sıcaklaştır..."
              oninput="S.revizeNote=this.value">${h(S.revizeNote)}</textarea>
          </div>
          <div class="fc g10">
            <button class="bs" style="flex:1" onclick="if(!S.revizeRunning){S.revizeOpen=false;render()}">İptal</button>
            <button class="bp" style="flex:2" onclick="runRevize()" ${S.revizeRunning ? 'disabled' : ''}>
              ${S.revizeRunning ? '<span class="spinner"></span> Düşünüyor...' : 'Revize & Kuyruğa At'}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
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