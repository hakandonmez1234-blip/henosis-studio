// ═══════════════════════════════════════════════════════════════
// UI-SETTINGS.JS — Ayarlar Tabı + Hermes Modal
// renderSettings(): API anahtarları (Fal.ai + Anthropic, .env varsa disabled),
//                   favori görsel modelleri grid (tıklanabilir kart),
//                   favori video modelleri grid,
//                   Telegram bot token + chat ID,
//                   veri yönetimi (hafıza sil, harcama sıfırla, galeri sil)
// renderHermes(): koyu modal — model seçici, görsel yükleme,
//                 not inputu, çalıştır butonu
// ═══════════════════════════════════════════════════════════════

function renderSettings(){
  var o='';

    o+=`<div class="sec"><div class="sec-title">API Anahtarları</div>
      <div class="mb16"><div style="font-size:13px;font-weight:500;margin-bottom:8px">Fal.ai API Key</div><input class="inp" type="password" placeholder="Backend'de tanımlıysa boş bırak" value="${h(S.key)}" oninput="S.key=this.value;saveDB()" ${S.envFalKey?'disabled':''}>${S.envFalKey?'<div style="font-size:11px;color:var(--green);margin-top:4px">.env dosyasından yüklendi</div>':''}</div>
      <div><div style="font-size:13px;font-weight:500;margin-bottom:8px">Anthropic API Key</div><input class="inp" type="password" placeholder="Backend'de tanımlıysa boş bırak" value="${h(S.claudeKey)}" oninput="S.claudeKey=this.value;saveDB()" ${S.envClaudeKey?'disabled':''}>${S.envClaudeKey?'<div style="font-size:11px;color:var(--green);margin-top:4px">.env dosyasından yüklendi</div>':''}</div>
    </div>

    <div class="sec">
      <div class="sec-title">Favori Görsel Modelleri
        <span style="font-size:10px;color:var(--tx-muted);font-family:'Inter',sans-serif;font-weight:400">Arayüzde önce bunlar görünür</span>
      </div>
      <div class="model-grid">`;
    var imgModelKeys=Object.keys(M).filter(k=>!['video','bgrem','upscale'].includes(M[k].t));
    imgModelKeys.forEach(function(k){
      var m=M[k];
      var isActive=S.favImgModels.includes(k);
      o+=`<div class="model-card ${isActive?'active':''}" onclick="
        var idx=S.favImgModels.indexOf('${k}');
        if(idx>-1)S.favImgModels.splice(idx,1);
        else S.favImgModels.push('${k}');
        saveDB();render()">
        ${isActive?'<div class="model-card-active-dot"></div>':''}
        <div class="model-card-top">
          <div class="model-card-name">${h(m.n)}</div>
          <div class="model-card-price">${h(m.p)}</div>
        </div>
        <div class="model-card-cat">${h(m.cat||m.t)}</div>
        <div class="model-card-desc">${h(m.desc||'')}</div>
      </div>`;
    });
    o+=`</div></div>

    <div class="sec">
      <div class="sec-title">Favori Video Modelleri
        <span style="font-size:10px;color:var(--tx-muted);font-family:'Inter',sans-serif;font-weight:400">Video sekmesinde önce bunlar görünür</span>
      </div>
      <div class="model-grid">`;
    var vidModelKeys=Object.keys(M).filter(k=>M[k].t==='video');
    vidModelKeys.forEach(function(k){
      var m=M[k];
      var isActive=S.favVidModels.includes(k);
      o+=`<div class="model-card ${isActive?'active':''}" onclick="
        var idx=S.favVidModels.indexOf('${k}');
        if(idx>-1)S.favVidModels.splice(idx,1);
        else S.favVidModels.push('${k}');
        saveDB();render()">
        ${isActive?'<div class="model-card-active-dot"></div>':''}
        <div class="model-card-top">
          <div class="model-card-name">${h(m.n)}</div>
          <div class="model-card-price">${h(m.p)}</div>
        </div>
        <div class="model-card-cat">${m.subtype==='t2v'?'T2V (Görsel Gereksiz)':'I2V'} · ${h(m.durOpts&&m.durOpts.length?m.durOpts.join('/')+'s':'sabit süre')}</div>
        <div class="model-card-desc">${h(m.desc||'')}</div>
      </div>`;
    });
    o+=`</div></div>

    <div class="sec"><div class="sec-title">Telegram Bildirimleri</div>
      <div class="mb12"><input class="inp" type="password" placeholder="Bot Token" value="${h(S.tgToken)}" oninput="S.tgToken=this.value;saveDB()"></div>
      <input class="inp" placeholder="Chat ID" value="${h(S.tgChatId)}" oninput="S.tgChatId=this.value;saveDB()">
    </div>
    <div class="sec"><div class="sec-title">Veri Yönetimi</div>
      <div class="fc g12 flex-wrap">
        <button class="bs" style="border-color:var(--red);color:var(--red)" onclick="if(confirm('Stil hafızasını sıfırla?')){S.styleMemory=[];saveDB();S.activeStyle=null;render()}">Hafızayı Sil</button>
        <button class="bs" style="border-color:var(--red);color:var(--red)" onclick="if(confirm('Harcama sayacını sıfırla?')){S.totalSpent=0;saveDB();render()}">Harcama Sıfırla</button>
        <button class="bs" style="border-color:var(--red);color:var(--red)" onclick="if(confirm('Tüm galeriyi sil?')){S.gallery=[];saveDB();render()}">Galeriyi Sil</button>
      </div>
    </div>`;
  return o;
}

function renderHermes(){
  var o='';
  if(S.hermesOpen){
    var imgModels=Object.keys(M).filter(k=>!['bgrem','upscale'].includes(M[k].t));
    o+=`<div class="hermes-modal" onclick="if(!S.hermesRunning)closeHermes()"><div class="hermes-inner" onclick="event.stopPropagation()">
      <div class="hermes-head">
        <div class="hermes-logo">${IC.bolt_dark}</div>
        <div class="hermes-title">Hermes</div>
        <div class="hermes-sub">Görsel yükle → Prompt üret → Anında üret</div>
      </div>
      <div class="hermes-body">
        <span class="hermes-label">MODEL</span>
        <select class="hermes-model-sel" onchange="S.hermesModel=this.value">
          ${imgModels.map(k=>`<option value="${k}" ${S.hermesModel===k?'selected':''}>${M[k].n} — ${M[k].p}</option>`).join('')}
        </select>
        <span class="hermes-label">ÜRÜN GÖRSELİ</span>
        ${S.hermesImg
          ?`<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px;background:rgba(255,255,255,0.06);border-radius:12px">
              <img src="${S.hermesImg.url}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0">
              <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(S.hermesImg.name)}</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">Yüklendi</div></div>
              <button style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:20px;line-height:1;padding:4px" onclick="S.hermesImg=null;render()">✕</button>
            </div>`
          :`<div id="dd-hermes" class="hermes-drop" onclick="document.getElementById('hermes-fi').click()">
              ${IC.img_dark}
              <div style="font-size:13px;color:rgba(255,255,255,0.4)">Sürükle veya tıkla</div>
            </div>
            <input type="file" id="hermes-fi" accept="image/*" style="display:none" onchange="rf(this.files,'hermes');this.value=''">`}
        <span class="hermes-label">NOT <span style="opacity:0.4;font-weight:400;font-size:10px">(opsiyonel)</span></span>
        <input class="hermes-inp" placeholder="Özel yön... siyah arka plan, minimalist stüdyo..." oninput="S.hermesNote=this.value" value="${h(S.hermesNote)}">
        <button class="hermes-go" onclick="runHermes()" ${(S.hermesRunning||!S.hermesImg)?'disabled':''}>
          ${S.hermesRunning?'<span class="spinner" style="border-color:rgba(232,221,208,0.15);border-top-color:var(--tx-main);width:14px;height:14px"></span> Analiz ediliyor...':'Hermes\'i Çalıştır'}
        </button>
        <button class="hermes-cancel" onclick="if(!S.hermesRunning)closeHermes()">İptal</button>
      </div>
    </div></div>`;
  }
  return o;
}
