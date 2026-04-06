// ═══════════════════════════════════════════════════════════════
// UI-QUEUE.JS — V2.0
// Düzeltmeler:
//   • Progress bar sadece aktif batch'i (son "Başlat"tan sonrakileri) sayar
//   • done/error öğeler bar'ı kirletmez
//   • İptal butonu — çalışan sorguyu durdurur, öğeyi pending'e döndürür
//   • Tek öğe iptal + tüm kuyruğu durdur
//   • Durum badge'leri tutarlı
//   • Hata mesajı expandable
// ═══════════════════════════════════════════════════════════════

// Aktif AbortController'ları tutan map: queueIndex → AbortController
window._queueAborts = window._queueAborts || {};

// runAll() bu flag'e bakarak durup durmayacağına karar verir
window._stopRequested = false;

function renderQueue(){
  var q = S.queue || [];
  var pendQ  = q.filter(it => it.status === 'pending').length;
  var doneQ  = q.filter(it => it.status === 'done').length;
  var errorQ = q.filter(it => it.status === 'error').length;
  var runQ   = q.filter(it => it.status === 'running').length;

  // Aktif batch: son çalıştırmadan bu yana işlenenler
  // Bunun için her öğeye batchId atıyoruz (runAll'da set edilir)
  // Eğer batchId yoksa hepsi aynı batch sayılır
  var activeBatch = q.filter(it => it.batchId && it.batchId === (S.currentBatchId || it.batchId));
  var batchBase   = activeBatch.length > 0 ? activeBatch : q;
  var batchDone   = batchBase.filter(it => it.status === 'done' || it.status === 'error').length;
  var pb          = batchBase.length > 0 ? Math.round((batchDone / batchBase.length) * 100) : 0;

  var o = '';

  // ── Üst toolbar ──
  o += `<div class="fb mb16" style="flex-wrap:wrap;gap:10px">
    <div class="fc g8">
      <span class="badge"><i data-lucide="clock" class="icon-xs" style="margin-right:4px"></i>${pendQ}</span>
      <span class="badge" style="background:rgba(74,175,122,0.12);color:var(--green)"><i data-lucide="check-circle" class="icon-xs" style="margin-right:4px"></i>${doneQ}</span>
      <span class="badge" style="background:rgba(201,79,79,0.1);color:var(--red)"><i data-lucide="x-circle" class="icon-xs" style="margin-right:4px"></i>${errorQ}</span>
      ${runQ > 0 ? `<span class="badge" style="background:rgba(90,143,168,0.15);color:var(--accent);animation:pulse 1.2s infinite"><i data-lucide="zap" class="icon-xs" style="margin-right:4px"></i>${runQ} işleniyor</span>` : ''}
    </div>
    <div class="fc g8">
      ${S.run ? `
        <button class="bs" style="padding:8px 14px;color:var(--tx-main);border-color:rgba(201,80,80,0.35)"
          onclick="stopQueue()"><i data-lucide="square" class="icon-xs" style="margin-right:4px"></i>Durdur</button>
      ` : ''}
      <button class="bs" style="padding:8px 14px"
        onclick="S.queue=S.queue.filter(q=>q.status!=='done');saveDB(true);render()"><i data-lucide="eye-off" class="icon-xs" style="margin-right:4px"></i>Bitenleri Gizle</button>
      <button class="bg" style="color:var(--tx-main)"
        onclick="if(confirm('Kuyruğu tamamen boşalt?')){stopQueue();S.queue=[];S.run=false;S.currentBatchId=null;saveDB(true);render()}"><i data-lucide="trash-2" class="icon-xs" style="margin-right:4px"></i>Boşalt</button>
    </div>
  </div>`;

  // ── Progress bar (sadece aktif batch) ──
  if (q.length > 0) {
    o += `<div style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:10px;color:var(--tx-muted)">
        ${S.run ? `İşleniyor — ${batchDone}/${batchBase.length}` : `${batchDone}/${batchBase.length} tamamlandı`}
      </div>
      <div style="font-size:10px;color:var(--tx-muted)">${pb}%</div>
    </div>
    <div class="pb" style="margin-bottom:20px;height:5px;background:var(--bg-cream);border-radius:99px;overflow:hidden">
      <div class="pf" style="width:${pb}%;height:100%;background:${pb===100?'var(--green)':'var(--ac-orange)'};border-radius:99px;transition:width 0.4s ease"></div>
    </div>`;
  }

  // ── Kuyruk öğeleri ──
  if (q.length > 0) {
    o += q.map((it, i) => {
      var isVid    = M[it.model] && M[it.model].t === 'video';
      var isRun    = it.status === 'running';
      var isDone   = it.status === 'done';
      var isError  = it.status === 'error';
      var isPend   = it.status === 'pending';

      // Durum renk/ikon
      var statusDot = isRun   ? 'background:var(--ac-blue);animation:pulse 1s infinite'
                    : isDone  ? 'background:var(--green)'
                    : isError ? 'background:var(--red)'
                    :           'background:var(--tx-muted);opacity:0.4';

      // Öğe arka plan
      var itemBg = isRun   ? 'border-color:rgba(90,143,168,0.25);background:rgba(90,143,168,0.04)'
                 : isError ? 'border-color:rgba(201,80,80,0.22);background:rgba(201,80,80,0.04)'
                 : isDone  ? 'border-color:rgba(74,175,122,0.18);background:rgba(74,175,122,0.03)'
                 :           '';

      // Hata mesajı (kısaltılmış, tıklanınca genişler)
      var errId = `err-${i}`;
      var errBlock = isError && it.result ? `
        <div style="margin-top:6px">
          <div id="${errId}-short" style="font-size:10px;color:var(--tx-main);cursor:pointer;display:flex;align-items:center;gap:4px"
            onclick="document.getElementById('${errId}-full').style.display='block';this.style.display='none'">
            <i data-lucide="alert-circle" class="icon-xs"></i>${h(it.result.substring(0,60))}${it.result.length>60?'… (detay)':''}
          </div>
          <div id="${errId}-full" style="display:none;font-size:10px;color:var(--tx-main);word-break:break-word;line-height:1.5">${h(it.result)}</div>
        </div>` : '';

      // Süre tahmini
      var avgDur = typeof getModelAvgDuration === 'function' ? getModelAvgDuration(it.model) : null;

      return `<div class="qi ${it.status}" style="${itemBg}">
        <div class="sd" style="${statusDot};width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px"></div>

        <div class="qt" style="flex-shrink:0"><img src="${it.ref.url}" style="width:48px;height:48px;object-fit:cover;border-radius:8px"></div>

        <div style="flex:1;min-width:0">
          <div class="fc g8 mb4">
            <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${h(it.ref.name)}</span>
            <span class="badge">${it.stratName || 'Özel'}</span>
          </div>
          <div style="font-size:11px;color:var(--tx-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px">${h(it.prompt)}</div>
          <div class="fc g6">
            <span style="font-size:10px;color:var(--tx-muted);background:var(--bg-card);border:1px solid var(--brd);padding:2px 7px;border-radius:6px">${M[it.model] ? M[it.model].n : it.model}</span>
            ${avgDur ? `<span style="font-size:10px;color:var(--ac-peach);background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2);padding:2px 7px;border-radius:6px">~${avgDur}s</span>` : ''}
            ${isRun ? `<span style="font-size:10px;color:var(--ac-blue)">işleniyor…</span>` : ''}
          </div>
          ${errBlock}
        </div>

        <!-- Sonuç thumbnail -->
        ${isDone && it.result ? (
          isVid
            ? `<div class="qt" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:var(--bg-card);border-radius:10px;flex-shrink:0">${IC.vid_white || '▶'}</div>`
            : `<div class="qt" style="width:56px;height:56px;flex-shrink:0;border-radius:10px;overflow:hidden"><img src="${it.result}" style="width:100%;height:100%;object-fit:cover"></div>`
        ) : ''}

        <!-- Aksiyon butonları -->
        <div class="fc g4" style="flex-shrink:0">
          ${isRun ? `
            <button class="bg" style="padding:6px 10px;color:var(--red)" title="Bu sorguyu iptal et"
              onclick="cancelSingleJob(${i})">✕</button>
          ` : ''}
          ${(isDone || isError) ? `
            <button class="bg" style="padding:6px 10px" title="Tekrar dene"
              onclick="requeueItem(${i})">↺</button>
          ` : ''}
          ${isPend ? `
            <button class="bg" style="padding:6px 10px;color:var(--red)" title="Kuyruktan çıkar"
              onclick="if(confirm('Bu öğeyi kuyruktan çıkar?')){S.queue.splice(${i},1);saveDB(true);render()}">✕</button>
          ` : ''}
        </div>
      </div>`;
    }).join('');
  } else {
    o += `<div class="uz">Kuyruk boş.</div>`;
  }

  // ── Başlat butonu ──
  if (pendQ > 0 && !S.run) {
    o += `<button class="bp" style="margin-top:24px;width:100%;padding:18px;font-size:15px" onclick="startQueue()">
      ▶ Üretimi Başlat (${pendQ} öğe)
    </button>`;
  } else if (S.run) {
    o += `<div style="margin-top:24px;display:flex;gap:10px">
      <button class="bp" style="flex:1;padding:14px;font-size:14px;opacity:0.6" disabled>
        <span class="spinner"></span> İşleniyor…
      </button>
      <button class="bs" style="padding:14px 20px;color:var(--red);border-color:rgba(201,80,80,0.35)"
        onclick="stopQueue()">Durdur</button>
    </div>`;
  }

  return o;
}

// ══════════════════════════════════════════════════════════════
// KUYRUK KONTROL FONKSİYONLARI
// ══════════════════════════════════════════════════════════════

// runAll() yerine artık startQueue() kullanılır (mevcut runAll() varsa onu çağır)
function startQueue() {
  window._stopRequested = false;
  // Yeni batch ID oluştur — bu batch'teki öğelere atanır
  S.currentBatchId = 'batch_' + Date.now();
  S.queue.filter(it => it.status === 'pending').forEach(it => {
    it.batchId = S.currentBatchId;
  });
  saveDB(true);
  if (typeof runAll === 'function') runAll();
}

// Tüm kuyruğu durdur
function stopQueue() {
  window._stopRequested = true;
  S.run = false;
  // Çalışan tüm AbortController'ları tetikle
  Object.values(window._queueAborts).forEach(ctrl => {
    try { ctrl.abort(); } catch(e) {}
  });
  window._queueAborts = {};
  // running → pending'e döndür (iptal edildi, tekrar denenebilir)
  S.queue.forEach(it => {
    if (it.status === 'running') {
      it.status = 'pending';
      it.result = null;
    }
  });
  saveDB(true);
  render();
}

// Tek öğeyi iptal et (çalışırken)
function cancelSingleJob(i) {
  var it = S.queue[i];
  if (!it) return;
  // AbortController varsa tetikle
  if (window._queueAborts[i]) {
    try { window._queueAborts[i].abort(); } catch(e) {}
    delete window._queueAborts[i];
  }
  it.status = 'pending';
  it.result = null;
  // Eğer başka pending yoksa run durumunu kapat
  var stillRunning = S.queue.some(q => q.status === 'running');
  if (!stillRunning) S.run = false;
  saveDB(true);
  render();
}

// Tamamlanan/hatalı öğeyi yeniden kuyruğa al
function requeueItem(i) {
  var it = S.queue[i];
  if (!it) return;
  it.status = 'pending';
  it.result = null;
  it.batchId = S.currentBatchId || null;
  saveDB(true);
  render();
}

// runAll() içinde çağrılacak yardımcı — abort controller kaydet
function registerJobAbort(idx, controller) {
  window._queueAborts[idx] = controller;
}
function unregisterJobAbort(idx) {
  delete window._queueAborts[idx];
}

// CSS animasyonu (pulse) — eğer yoksa ekle
(function(){
  if (!document.getElementById('queue-pulse-style')) {
    var s = document.createElement('style');
    s.id = 'queue-pulse-style';
    s.textContent = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`;
    document.head.appendChild(s);
  }
})();