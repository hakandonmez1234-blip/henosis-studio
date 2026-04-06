// ═══════════════════════════════════════════════════════════════
// UI-HAZIRLA.JS — Yaratım Tabı
// İçerir: renderHazirla() → Sahne Mimari Paneli, konsept görseller,
//         brief textarea, LLM seçici, prompt odağı, strateji,
//         adet input, üret butonu, video alt sekmeler (I2V/T2V/Edit),
//         stil hafızası, havuz + torba listeleri
// Çağırır: buildModelSelect(), renderVideoTemplates(), renderVideoEditPipeline()
// ═══════════════════════════════════════════════════════════════

// ── Yaratıcı Hafıza UI Yardımcıları ──

function _renderActiveProjectRef() {
  if (!S.activeProjectRef) return '';
  var prj = S.activeProjectRef;
  return `<div style="display:flex;align-items:flex-start;gap:10px;background:rgba(212,100,42,0.08);border:1.5px solid rgba(212,100,42,0.35);border-radius:12px;padding:10px 14px">
    <div style="font-size:16px;flex-shrink:0;margin-top:1px;color:var(--ac-orange)"><i data-lucide="folder-open" style="width:16px;height:16px"></i></div>
    <div style="flex:1;min-width:0">
      <div style="font-size:10px;font-weight:700;color:var(--ac-orange);letter-spacing:0.8px;margin-bottom:2px">AKTİF PROJE REFERANSİ</div>
      <div style="font-size:12px;font-weight:600;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(prj.title)}</div>
      ${prj.client ? `<div style="font-size:11px;color:var(--tx-muted)">${h(prj.client)}</div>` : ''}
      ${(prj.tags||[]).length ? `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${(prj.tags||[]).slice(0,5).map(t=>`<span style="font-size:9px;background:rgba(212,100,42,0.12);color:var(--ac-orange);padding:2px 7px;border-radius:99px;font-weight:600">${h(t)}</span>`).join('')}</div>` : ''}
      ${prj.interpretation ? `<div style="font-size:10px;color:var(--tx-muted);margin-top:4px;font-style:italic">"${h(prj.interpretation.substring(0,80))}..."</div>` : ''}
    </div>
    <button onclick="clearProjectRef()" style="background:none;border:none;cursor:pointer;color:var(--tx-muted);font-size:14px;padding:0;flex-shrink:0;line-height:1" title="Referansı kaldır">✕</button>
  </div>`;
}

function _renderBriefInterpretation() {
  if (S.briefInterpreting) {
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-cream);border-radius:10px;border:1px solid var(--brd)">
      <span class="spinner" style="width:12px;height:12px;border-width:2px"></span>
      <span style="font-size:11px;color:var(--tx-muted)">Hafıza aranıyor ve brief yorumlanıyor...</span>
    </div>`;
  }
  if (!S.briefInterpretation) return '';
  var bi = S.briefInterpretation;
  var o = '';

  // Hafıza eşleşmesi
  if (bi.type === 'memory_match' && bi.projectTitle) {
    o += `<div style="background:rgba(74,222,128,0.06);border:1.5px solid rgba(74,222,128,0.3);border-radius:12px;padding:10px 14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;color:var(--green)"><i data-lucide="lightbulb" style="width:14px;height:14px"></i></span>
        <span style="font-size:10px;font-weight:700;color:var(--green);letter-spacing:0.8px">HAFIZADAN EŞLEŞTİ</span>
        <span style="font-size:9px;color:var(--tx-muted);margin-left:auto">%${Math.round((bi.confidence||0.7)*100)} benzerlik</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--tx-main);margin-bottom:3px">${h(bi.projectTitle)}</div>
      <div style="font-size:11px;color:var(--tx-muted);margin-bottom:10px">${h(bi.reason||'')}</div>
      <div style="display:flex;gap:6px">
        <button onclick="applyProjectRef('${bi.projectId}')" style="flex:1;padding:7px;background:var(--green);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit">
          ✓ Direktifleri Uygula
        </button>
        <button onclick="S.briefInterpretation=null;render()" style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-size:11px;color:var(--tx-muted);font-family:inherit">✕</button>
      </div>
    </div>`;
  }

  // Brief yorumu
  if (bi.interpretation) {
    o += `<div style="background:rgba(90,143,168,0.06);border:1.5px solid rgba(90,143,168,0.3);border-radius:12px;padding:10px 14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;color:var(--ac-blue)"><i data-lucide="sparkles" style="width:14px;height:14px"></i></span>
        <span style="font-size:10px;font-weight:700;color:var(--ac-blue);letter-spacing:0.8px">KİŞİSEL BRİEF YORUMLANDI</span>
      </div>
      <div style="font-size:11px;color:var(--tx-muted);line-height:1.5;margin-bottom:10px;font-style:italic">"${h(bi.interpretation)}"</div>
      <div style="display:flex;gap:6px">
        <button onclick="applyInterpretationOnly()" style="flex:1;padding:7px;background:var(--ac-blue);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit">
          ✓ Bu Yorumu Kullan
        </button>
        <button onclick="S.briefInterpretation=null;render()" style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-size:11px;color:var(--tx-muted);font-family:inherit">✕</button>
      </div>
    </div>`;
  }

  return o;
}

// ── Custom dropdown callback'leri ──
function _setLlm(v){S.llm=v;saveDB();render();}
function _setPromptFocus(v){S.promptFocus=v;saveDB();render();}
function _setActiveStrat(v){S.activeStrat=v==='auto'?'auto':v;saveDB();render();}
function _setVidMdl(v){S.vidMdl=v;saveDB();render();}
function _setT2vMdl(v){S.t2vMdl=v;saveDB();render();}

// ── Sihirli Prompt Paneli ──
function _renderMagicPanel(){
  var hasImg = S.conceptImgs && S.conceptImgs.length > 0;
  var hasProfile = S.journal && S.journal.profile && S.journal.profile.trim().length > 0;
  var learningActive = S.learningData && S.learningData.distilled && S.learningData.distilled.length > 0;
  var scored = S.learningData && S.learningData.records ? S.learningData.records.filter(function(r){return r.scores&&(_recordAvg&&_recordAvg(r)>0);}).length : 0;

  var badges = '';
  if (hasProfile) badges += `<div style="font-size:9px;font-weight:700;background:rgba(212,100,42,0.08);color:rgba(212,100,42,0.8);padding:3px 8px;border-radius:99px;border:1px solid rgba(212,100,42,0.15)">KİŞİSEL</div>`;
  if (learningActive) badges += `<div style="font-size:9px;font-weight:700;background:rgba(212,100,42,0.06);color:rgba(212,100,42,0.6);padding:3px 8px;border-radius:99px;border:1px solid rgba(212,100,42,0.12)">${scored} üretim</div>`;

  return `<div style="margin-top:14px;border:1.5px solid rgba(212,100,42,0.18);border-radius:14px;overflow:hidden;background:rgba(212,100,42,0.03);box-shadow:0 2px 8px rgba(0,0,0,0.04)">
    <div style="padding:12px 16px 10px;display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none" onclick="S.magicOpen=!S.magicOpen;render()">
      <span style="font-size:18px;line-height:1;display:flex;align-items:center;color:rgba(212,100,42,0.75)"><i data-lucide="wand-2" style="width:18px;height:18px"></i></span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:800;color:var(--tx-muted);letter-spacing:0.4px">SİHİRLİ PROMPT</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:1px">Ürünü gör, içini oku, sana özel yaz</div>
      </div>
      ${badges}
      <span style="font-size:11px;color:var(--tx-muted);transition:transform 0.2s;display:inline-block;transform:rotate(${S.magicOpen?'180':'0'}deg)">▼</span>
    </div>
    ${S.magicOpen ? `<div style="border-top:1px solid rgba(212,100,42,0.1);padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px">
      ${!hasImg ? `<div style="font-size:11px;color:rgba(212,100,42,0.9);background:rgba(212,100,42,0.08);border:1px solid rgba(212,100,42,0.2);border-radius:9px;padding:8px 12px;text-align:center">
        Sihirli mod için yukarıdan bir ürün görseli yükle
      </div>` : ''}
      ${hasProfile
        ? `<div style="font-size:10px;color:rgba(0,0,0,0.75);background:rgba(212,100,42,0.05);border:1px solid rgba(212,100,42,0.12);border-radius:9px;padding:9px 12px;line-height:1.6">
            <span style="font-weight:700;opacity:0.6;letter-spacing:0.3px;font-size:9px;color:rgba(212,100,42,0.8)">KİŞİSEL PROFİL · </span><span style="color:rgba(0,0,0,0.7)">${h((S.journal.profile||'').substring(0,160))}…</span>
           </div>`
        : `<div style="font-size:10px;color:var(--tx-muted);background:var(--bg-elevated);border:1px solid var(--brd);border-radius:9px;padding:9px 12px;line-height:1.5">
            Hafıza sekmesine git → bir günce sorusunu yanıtla → sistem senin yaratıcı dilinle prompt yazar
           </div>`
      }
      <button onclick="magicPrompt()" ${!hasImg||S.isGenerating?'disabled':''} style="width:100%;padding:15px;border:none;border-radius:12px;background:${hasImg&&!S.isGenerating?'linear-gradient(135deg,rgba(212,100,42,0.85),rgba(180,85,35,0.85))':'var(--bg-cream)'};color:${hasImg&&!S.isGenerating?'#fff':'var(--tx-muted)'};font-size:14px;font-weight:800;cursor:${hasImg&&!S.isGenerating?'pointer':'default'};font-family:inherit;letter-spacing:0.3px;transition:opacity 0.15s;box-shadow:${hasImg&&!S.isGenerating?'0 2px 8px rgba(212,100,42,0.25)':'none'}" ${hasImg&&!S.isGenerating?'onmouseenter="this.style.opacity=\'0.9\'" onmouseleave="this.style.opacity=\'1\'"':''}>
        ${S.isGenerating&&S.genPhase?'<span style="display:inline-flex;align-items:center;gap:8px"><span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,0.3)"></span>'+h(S.genPhase)+'</span>':'<span style="display:flex;align-items:center;gap:6px"><i data-lucide="wand-2" style="width:16px;height:16px"></i> Yaratıcı Prompt Üret</span>'}
      </button>
    </div>` : ''}
  </div>`;
}

function renderHazirla(){
  var o='';


    if(S.isGenerating&&S.genPhase)o+=`<div style="background:linear-gradient(135deg,var(--ac-orange),var(--ac-peach));color:#fff;padding:14px 24px;border-radius:var(--rad-md);margin-bottom:16px;display:flex;align-items:center;gap:12px;font-weight:600"><span class="spinner"></span>${h(S.genPhase)}</div>`;

    o+=`<div class="sec sec-glow">
      <div class="fb mb20">
        <div class="sec-title" style="margin:0">Sahne Mimari Paneli</div>
        <div class="mode-toggle">
          <button class="mode-btn ${S.mode==='image'?'active':''}" onclick="S.mode='image';saveDB();render()">
            ${IC.img}Görsel
          </button>
          <button class="mode-btn ${S.mode==='video'?'active':''}" onclick="S.mode='video';saveDB();render()">
            ${IC.vid}Video
          </button>
        </div>
      </div>`;

    // Konsept görseller
    o+=`<div style="margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap">`;
    o+=S.conceptImgs.map((ci,i)=>`<div class="ic" style="width:80px;height:80px;border-color:var(--ac-orange);flex-shrink:0"><img src="${ci.url}"><button class="ic-x" onclick="S.conceptImgs.splice(${i},1);saveDB();render()">✕</button></div>`).join('');
    o+=`<div id="dd-concept" class="upload-mini" onclick="document.getElementById('ci').click()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>Görsel</span>
    </div><input type="file" id="ci" accept="image/*" multiple style="display:none" onchange="rf(this.files,'concept');this.value=''"></div>`;

    o+=`<div style="display:flex;flex-direction:column;gap:14px">

      ${_renderActiveProjectRef()}

      <div style="position:relative">
        <textarea id="brief-textarea" class="inp"
          placeholder="${S.promptFocus==='director'
            ? '40 pandomim sanatçısı şapkayı takmış, stüdyoda, karşıdan çekim, pro reklam. İstediğin kadar detay ver — sahneyi, kişileri, atmosferi, tonu...'
            : 'Örnek: Pembe kutu şampuan, minimalist beyaz stüdyo, sabah ışığı, ürün odaklı çekim, marka: HairCare Pro...'}"
          oninput="S.conceptBrief=this.value;saveDB()"
          onblur="triggerMemorySearch(this.value)"
          style="min-height:${S.promptFocus==='director'?'120':'100'}px;font-size:15px;padding-right:44px">${h(S.conceptBrief)}</textarea>
        <button onclick="S.memModal=true;render()" title="Yaratıcı Hafıza — Geçmiş projelerden ilham al"
          style="position:absolute;top:8px;right:8px;background:${S.projectMemory&&S.projectMemory.length?'rgba(212,100,42,0.15)':'var(--bg-cream)'};border:1px solid ${S.projectMemory&&S.projectMemory.length?'rgba(212,100,42,0.4)':'var(--brd)'};border-radius:8px;padding:5px 7px;cursor:pointer;font-size:13px;color:${S.projectMemory&&S.projectMemory.length?'var(--ac-orange)':'var(--tx-muted)'};transition:all 0.2s;display:flex;align-items:center;gap:3px"
          onmouseenter="this.style.background='rgba(212,100,42,0.2)'" onmouseleave="this.style.background='${S.projectMemory&&S.projectMemory.length?'rgba(212,100,42,0.15)':'var(--bg-cream)'}'">
          <i data-lucide="archive" style="width:14px;height:14px"></i>${S.projectMemory&&S.projectMemory.length?`<span style="font-size:9px;margin-left:2px">${S.projectMemory.length}</span>`:''}
        </button>
      </div>

      ${_renderBriefInterpretation()}

      <div class="fc g10" style="flex-wrap:wrap;gap:10px">
        ${buildCustomSelect('llm-sel',[{items:[{value:'claude-sonnet-4-6',label:'Sonnet 4.6',sub:'Hızlı & Verimli'},{value:'claude-opus-4-6',label:'Opus 4.6',sub:'En Güçlü'}]}],S.llm,'_setLlm',{style:'flex:1;min-width:140px'})}`;

    if(S.mode==='image'){
      o+=`${buildCustomSelect('focus-sel',[{items:[
        {value:'product',label:'Ürün Odaklı',sub:'Ürün merkez'},
        {value:'scene',label:'Banner Odaklı',sub:'Sahne ağırlıklı'},
        {value:'free',label:'Özgür',sub:'Yaratıcı serbest'},
        {value:'director',label:'Yönetmen Brief',sub:'Sahne senin, sistem çevirir'}
      ]}],S.promptFocus,'_setPromptFocus',{style:'flex:1;min-width:160px'})}
        ${S.promptFocus==='director'
          ? `<div style="flex:1;min-width:160px;padding:10px 14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.3);border-radius:var(--rad-md);font-size:11px;color:rgba(124,58,237,0.9);font-weight:600;display:flex;align-items:center;gap:5px">
              <i data-lucide="video" style="width:14px;height:14px"></i> Strateji yok — brief birincil direktif
            </div>`
          : (()=>{
              var stratGroups=[{label:'',items:[{value:'auto',label:'Karma (Hepsi)',sub:'Tüm stratejiler rotasyonu'}]}];
              if(typeof STRATEGY_GROUPS!=='undefined'){
                STRATEGY_GROUPS.forEach(g=>{
                  stratGroups.push({label:g.group,items:g.items.map(item=>{
                    var idx=STRATEGIES.findIndex(s=>s.name===item.name);
                    return {value:idx.toString(),label:item.name,color:STRATEGIES[idx]&&STRATEGIES[idx].color};
                  })});
                });
              }
              return buildCustomSelect('strat-sel',stratGroups,S.activeStrat==='auto'?'auto':S.activeStrat.toString(),'_setActiveStrat',{style:'flex:1;min-width:160px'});
            })()
        }`;
    }

    o+=`<div class="fc g8" style="background:var(--bg-cream);padding:4px 12px;border-radius:var(--rad-pill);border:1px solid var(--brd);flex-shrink:0">
          <span style="font-size:12px;color:var(--tx-muted)">Adet</span>
          <input type="number" min="1" max="10" class="inp" style="width:50px;padding:6px;border:none;background:transparent;font-weight:700;text-align:center" value="${S.genCount}" oninput="S.genCount=this.value">
        </div>
        <button class="bp" style="flex:1;min-width:130px" onclick="generatePrompts()" ${S.isGenerating?'disabled':''}>
          ${S.isGenerating?'<span class="spinner"></span> '+h(S.genPhase||'...'):'<i data-lucide="sparkles" style="margin-right:6px"></i>'+(S.mode==='video'?'Video Üret':'Fikir Üret')}
        </button>
      </div>

      ${S.mode==='image'?_renderMagicPanel():''}

    </div>`;

    // Video stratejileri
    if(S.mode==='video'){
      // ── Video Alt Sekme Seçici ──
      o+=`<div style="margin-top:20px;border-top:1px solid var(--brd);padding-top:20px">
        <div style="display:flex;gap:6px;margin-bottom:18px;background:var(--bg-cream);border-radius:12px;padding:4px;">
          <button style="flex:1;padding:8px 4px;border-radius:9px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:5px;background:${S.vidSubMode==='i2v'?'var(--bg-elevated)':'transparent'};color:${S.vidSubMode==='i2v'?'var(--ac-orange)':'var(--tx-muted)'};box-shadow:${S.vidSubMode==='i2v'?'var(--shadow-float)':'none'}" onclick="S.vidSubMode='i2v';saveDB();render()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Görsel → Video
          </button>
          <button style="flex:1;padding:8px 4px;border-radius:9px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:5px;background:${S.vidSubMode==='t2v'?'var(--bg-elevated)':'transparent'};color:${S.vidSubMode==='t2v'?'var(--ac-orange)':'var(--tx-muted)'};box-shadow:${S.vidSubMode==='t2v'?'var(--shadow-float)':'none'}" onclick="S.vidSubMode='t2v';saveDB();render()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
            Metin → Video
          </button>
          <button style="flex:1;padding:8px 4px;border-radius:9px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:5px;background:${S.vidSubMode==='edit'?'var(--bg-elevated)':'transparent'};color:${S.vidSubMode==='edit'?'var(--ac-orange)':'var(--tx-muted)'};box-shadow:${S.vidSubMode==='edit'?'var(--shadow-float)':'none'}" onclick="S.vidSubMode='edit';saveDB();render()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Edit Pipeline
          </button>
        </div>`;

      // ── I2V: Görsel → Video ──
      if(S.vidSubMode==='i2v'){
        o+=`<div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:12px;letter-spacing:1px">VİDEO MODELİ (I2V)</div>
        <div style="font-size:11px;color:var(--tx-muted);background:rgba(212,100,42,0.06);border-radius:10px;padding:8px 12px;margin-bottom:12px;border:1px solid rgba(212,100,42,0.12)"><strong>I2V:</strong> Stüdyo'dan görsel seç, video stratejisi belirle, kuyruğa gönder. Üretilen videolar Edit Pipeline'a aktarılabilir.</div>`;
        o+=buildModelSelect(S.vidMdl, k=>M[k].t==='video'&&!M[k].subtype, "_setVidMdl", 'vid');
        o+=`<div style="margin-top:14px;font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:10px;letter-spacing:1px">VİDEO STRATEJİSİ</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">`;
        // VIDEO_STRATEGIES.forEach döngüsünün içindeki kısmı şu şekilde güncelle:
VIDEO_STRATEGIES.forEach(vs => {
  var isA = S.activeVidStrat === vs.id;
  // İkon haritası (vs.id'ye göre ikon eşleştirme)
  const iconMap = {
    'reklam': 'megaphone',
    'kullanim': 'hand',
    'orbit': 'rotate-3d',
    'reveal': 'sparkles',
    'atmosfer': 'clapperboard',
    'studio360': 'box',
    'unboxing': 'package-open',
    'tekstil': 'wind',
    'sosyal9x16': 'smartphone'
  };
  const iconName = iconMap[vs.id] || 'video';

  o += `<div class="strat-card ${isA ? 'active' : ''}" onclick="S.activeVidStrat='${vs.id}';saveDB();render()">
    <div class="strat-icon" style="background:${vs.color}22;color:${vs.color}">
      <i data-lucide="${iconName}" style="width:18px;height:18px"></i>
    </div>
    <div class="strat-name">${vs.name}</div>
    <div class="strat-desc">${vs.prompt.substring(0, 50)}...</div>
  </div>`;
});
        o+=`</div>
          <div style="margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:var(--tx-muted)">SÜRE:</span>
            ${(()=>{const vm=M[S.vidMdl];const opts=vm&&vm.durOpts&&vm.durOpts.length?vm.durOpts:['5','10'];return opts.map(d=>`<button class="dur-btn ${S.vidDur===d?'active':''}" onclick="S.vidDur='${d}';saveDB();render()">${d}s</button>`).join('');})()}
          </div>`;
      }

      // ── T2V: Metin → Video ──
       if(S.vidSubMode==='t2v'){
        // Model seçici
        o+=`<div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:12px;letter-spacing:1px">VİDEO MODELİ (T2V — Görsel Gereksiz)</div>`;
        o+=buildModelSelect(S.t2vMdl||'kling25t', k=>M[k].t==='video'&&M[k].subtype==='t2v', "_setT2vMdl", 'vid');
 
        // Süre seçici
        o+=`<div style="margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px">
          <span style="font-size:11px;font-weight:700;color:var(--tx-muted)">SÜRE:</span>
          ${(()=>{const vm=M[S.t2vMdl||'kling25t'];const opts=vm&&vm.durOpts&&vm.durOpts.length?vm.durOpts:['5','10'];return opts.map(d=>`<button class="dur-btn ${S.vidDur===d?'active':''}" onclick="S.vidDur='${d}';saveDB();render()">${d}s</button>`).join('');})()}
        </div>`;
 
        // ── AKİŞ SEÇİCİ: Şablon mu, Strateji mi? ──
        var t2vFlow = S.t2vFlow || 'strategy';
        o+=`<div style="display:flex;gap:0;margin-bottom:16px;border:1.5px solid var(--brd);border-radius:10px;overflow:hidden">
          <button onclick="S.t2vFlow='strategy';saveDB();render()" style="flex:1;padding:8px 0;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:background 0.15s;background:${t2vFlow==='strategy'?'var(--ac-orange)':'var(--bg-elevated)'};color:${t2vFlow==='strategy'?'#fff':'var(--tx-muted)'};display:flex;align-items:center;justify-content:center;gap:6px">
            <i data-lucide="film" class="icon-xs"></i>Strateji ile Üret
          </button>
          <button onclick="S.t2vFlow='template';saveDB();render()" style="flex:1;padding:8px 0;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:background 0.15s;background:${t2vFlow==='template'?'var(--ac-orange)':'var(--bg-elevated)'};color:${t2vFlow==='template'?'#fff':'var(--tx-muted)'};display:flex;align-items:center;justify-content:center;gap:6px">
            <i data-lucide="layout-template" class="icon-xs"></i>Şablon ile Üret
          </button>
        </div>`;
 
        // ── AKIŞ A: Strateji ──
        if(t2vFlow==='strategy'){
          o+=`<div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:10px;letter-spacing:1px">VİDEO STRATEJİSİ SEÇ</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">`;
          VIDEO_STRATEGIES.forEach(vs=>{
            var isA=S.activeVidStrat===vs.id;
            o+=`<div class="strat-card ${isA?'active':''}" onclick="S.activeVidStrat='${vs.id}';saveDB();render()">
              <div class="strat-icon" style="background:${vs.color}22;color:${vs.color}">${vs.icon}</div>
              <div class="strat-name">${vs.name}</div>
              <div class="strat-desc">${vs.prompt.substring(0,50)}...</div>
            </div>`;
          });
          o+=`</div>`;
 
          // Seçili strateji için metin alanları
          if(S.activeVidStrat){
            var selStrat=VIDEO_STRATEGIES.find(v=>v.id===S.activeVidStrat);
            var stratFields=getStrategyFields(S.activeVidStrat);
            if(!S.videoTemplateFields)S.videoTemplateFields={};
            o+=`<div style="margin-top:14px;background:var(--bg-card);border:1.5px solid rgba(212,100,42,0.2);border-radius:14px;padding:14px">
              <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:5px">
                <i data-lucide="type" style="width:12px;height:12px"></i> ${selStrat?selStrat.name:''} — METİN ALANLARI
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">`;
            stratFields.forEach(f=>{
              var val=S.videoTemplateFields[f.key]||'';
              o+=`<div>
                <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:4px">${h(f.label).toUpperCase()}</div>
                <input class="inp" placeholder="${h(f.placeholder)}" value="${h(val)}" style="font-size:12px;width:100%;box-sizing:border-box"
                  oninput="if(!S.videoTemplateFields)S.videoTemplateFields={};S.videoTemplateFields['${f.key}']=this.value;saveDB()">
                ${f.hint?`<div style="font-size:9px;color:var(--tx-muted);margin-top:3px">${h(f.hint)}</div>`:''}
              </div>`;
            });
            o+=`</div>
              <div style="font-size:10px;color:var(--tx-muted);line-height:1.6;border-top:1px solid var(--brd);padding-top:10px">
                Alanları doldurup <strong>"Fikir Üret"</strong> butonuna bas. Claude bu metin alanlarını prompt içine entegre eder.
              </div>
            </div>`;
          }
        }
 
        // ── AKIŞ B: Şablon ──
        if(t2vFlow==='template'){
          o+=renderVideoTemplates();
        }
 
        // T2V açıklama notu — her iki akışta da göster
        o+=`<div style="margin-top:14px;padding:12px 14px;background:rgba(212,100,42,0.06);border-radius:12px;border:1px solid rgba(212,100,42,0.15)">
          <div style="font-size:11px;font-weight:700;color:var(--ac-orange);margin-bottom:6px">T2V Nasıl Çalışır?</div>
          <div style="font-size:11px;color:var(--tx-muted);line-height:1.6">Ürün görseli yüklemene gerek yok. Prompt'u havuzdan seç, model sadece metinle video üretir. Sahne, kamera, ışık — hepsini yazarak kontrol edersin.</div>
        </div>`;
      }
 


      // ── EDIT PIPELINE: Klipler → FFmpeg → Final Video ──
      if(S.vidSubMode==='edit'){
        o+=renderVideoEditPipeline();
      }

      o+=`</div>`;
    }

    // Stil hafızası
    if(S.styleMemory.length&&S.mode==='image'){
      o+=`<div style="margin-top:16px;border-top:1px solid var(--brd);padding-top:16px">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:8px;letter-spacing:1px">AKTİF STİL</div>
        <div style="display:flex;flex-wrap:wrap">
          <span class="style-chip ${S.activeStyle===null?'active':''}" onclick="S.activeStyle=null;saveDB();render()">Serbest</span>`;
      S.styleMemory.forEach(st=>{o+=`<span class="style-chip ${S.activeStyle===st.id?'active':''}" onclick="S.activeStyle='${st.id}';saveDB();render()">${h(st.name)}</span>`;});
      o+=`</div></div>`;
    }
    o+=`</div>`; // sec-glow end

    // ── Prompt Listesi (Havuz + Torba birleşik) ──
    if(S.poolFilter===undefined) S.poolFilter='all';
    if(S.poolSort===undefined)   S.poolSort='newest';

    var torbadakiler = S.promptPool.filter(p=>p.selected);
    var filtered = S.promptPool.filter(p=>{
      if(S.poolFilter==='image') return p.type==='image'||!p.type;
      if(S.poolFilter==='video') return p.type==='video';
      return true;
    });
    if(S.poolSort==='scored'){
      filtered=filtered.slice().sort((a,b)=>{
        var sa=(a.scores&&a.scores.felt_right)||0;
        var sb=(b.scores&&b.scores.felt_right)||0;
        return sb-sa;
      });
    }else{
      // Seçililer önce, sonra yeniden eskiye
      filtered=filtered.slice().sort((a,b)=>{
        if(a.selected&&!b.selected)return -1;
        if(!a.selected&&b.selected)return 1;
        return 0;
      });
    }

    o+=`<div class="sec">`;

    // Başlık + filtreler + torba özeti — STICKY
    o+=`<div class="pool-sticky-hdr">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div class="sec-title" style="margin:0;font-size:14px">
          Prompt Havuzu
          <span class="badge">${S.promptPool.length}</span>
          ${torbadakiler.length?`<span class="badge orange" style="margin-left:4px">${torbadakiler.length} seçili</span>`:''}
        </div>
        <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
          ${['all','image','video'].map(f=>`
            <button onclick="S.poolFilter='${f}';render()"
              style="padding:3px 10px;border-radius:99px;border:1.5px solid ${S.poolFilter===f?'var(--ac-orange)':'var(--brd)'};background:${S.poolFilter===f?'rgba(212,100,42,0.1)':'transparent'};color:${S.poolFilter===f?'var(--ac-orange)':'var(--tx-muted)'};font-size:9px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px">
              ${f==='all'?'Tümü':f==='image'?'Görsel':'Video'}
            </button>`).join('')}
          <button onclick="S.poolSort=S.poolSort==='newest'?'scored':'newest';render()"
            style="padding:3px 10px;border-radius:99px;border:1.5px solid var(--brd);background:transparent;color:var(--tx-muted);font-size:9px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px">
            ${S.poolSort==='newest'?'Yeni':'Puanlı'}
          </button>
          ${S.promptPool.length?`<button onclick="if(confirm('Tüm listeyi temizle?')){S.promptPool=[];saveDB();render()}" style="padding:3px 8px;border-radius:99px;border:1.5px solid rgba(201,79,79,0.3);background:transparent;color:var(--red);font-size:9px;font-weight:700;cursor:pointer;font-family:inherit">Temizle</button>`:''}
        </div>
      </div>
      ${torbadakiler.length?`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(212,100,42,0.07);border:1.5px solid rgba(212,100,42,0.25);border-radius:10px;margin-top:10px">
        <span style="font-size:12px;font-weight:700;color:var(--ac-orange);flex:1">${torbadakiler.length} prompt seçili</span>
        <button onclick="buildQ()" style="padding:6px 14px;border-radius:8px;border:none;background:var(--ac-orange);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px"><i data-lucide="play" style="width:12px;height:12px"></i> Kuyruğa Gönder</button>
        <button onclick="S.promptPool.forEach(p=>{p.selected=false});saveDB();render()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg-elevated);color:var(--tx-muted);font-size:11px;cursor:pointer;font-family:inherit">✕</button>
      </div>`:''}
    </div>`;
 
    // Manuel ekle kutusu
    o+=`<div style="background:var(--bg-cream);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid var(--brd-soft)">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);margin-bottom:8px;letter-spacing:0.5px">MANUEL PROMPT EKLE</div>
      <textarea id="manual-prompt-ta" class="inp" style="min-height:72px;font-size:12px;padding:10px;resize:vertical" placeholder="Prompt metnini yaz veya yapıştır..."></textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="manual-prompt-name" class="inp" style="flex:1;font-size:11px;padding:6px 10px" placeholder="Ürün adı (opsiyonel)">
        <button class="bs" onclick="addManualPrompt()" style="flex-shrink:0;padding:6px 14px;font-size:11px">+ Ekle</button>
        <button class="bp" onclick="addManualPromptToTorba()" style="flex-shrink:0;padding:6px 14px;font-size:11px">+ Seçili Ekle</button>
      </div>
    </div>`;

    // Birleşik prompt listesi
    o+=`<div style="display:flex;flex-direction:column;gap:6px">`;

    if(!filtered.length){
      o+=`<div style="text-align:center;padding:32px 0;color:var(--tx-muted);font-size:12px">
        ${S.promptPool.length?'Bu filtre için prompt yok.':'Henüz prompt üretilmedi — "Fikir Üret" butonuna bas.'}
      </div>`;
    }

    // Session gruplamak için yardımcı
    var seenSessions = {};

    filtered.forEach((p,i)=>{
      var isExp    = S.expandedPrompt===p.id;
      var isSec    = p.selected; // torba'da mı?
      var hasScores= p.scores && p.scores.felt_right>0;
      var prodLabel= p.productName || (p.userInput?p.userInput.split(' ').slice(0,4).join(' '):'') || 'Prompt';
      var isVid    = p.type==='video';
      var scoreVal = (p.scores&&p.scores.felt_right)||0;
      var refThumb = p.refThumbs&&p.refThumbs[0]?p.refThumbs[0]:null;
      var linkedOutputs = S.gallery.filter(g=>g.promptId&&g.promptId===p.id);

      // ── Session başlığı ──
      var sessionId = p.genSessionId||'';
      if(sessionId && !seenSessions[sessionId]){
        seenSessions[sessionId]=true;
        var sessionMs=parseInt((sessionId||'').replace('sess-',''))||0;
        var sessionLabel=sessionMs?new Date(sessionMs).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}):'';
        var sessionBrief=p.brief?p.brief.substring(0,40):p.userInput?p.userInput.substring(0,40):'';
        var sessionCount=filtered.filter(x=>x.genSessionId===sessionId).length;
        o+=`<div style="display:flex;align-items:center;gap:8px;margin-top:${i===0?'0':'8px'};margin-bottom:4px">
          <div style="height:1px;flex:1;background:var(--brd)"></div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            ${sessionLabel?`<span style="font-size:9px;color:var(--tx-muted);font-weight:600">${sessionLabel}</span>`:''}
            ${sessionBrief?`<span style="font-size:9px;color:var(--tx-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(sessionBrief)}${sessionBrief.length>=40?'…':''}</span>`:''}
            <span style="font-size:9px;background:var(--bg-card);border:1px solid var(--brd);border-radius:99px;padding:1px 7px;color:var(--tx-muted)">${sessionCount}</span>
          </div>
          <div style="height:1px;flex:1;background:var(--brd)"></div>
        </div>`;
      }

      o+=`<div style="border-radius:12px;border:1.5px solid ${isSec?'var(--ac-orange)':isExp?'rgba(212,100,42,0.4)':'var(--brd-soft)'};background:${isSec?'rgba(212,100,42,0.04)':isExp?'rgba(212,100,42,0.02)':'var(--bg-cream)'};overflow:hidden;transition:all 0.15s">

        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer" onclick="S.expandedPrompt='${isExp?'':p.id}';render()">

          <!-- Seçim checkbox -->
          <div onclick="event.stopPropagation();togglePromptSelect('${p.id}')"
            style="width:22px;height:22px;border-radius:6px;border:2px solid ${isSec?'var(--ac-orange)':'var(--brd)'};background:${isSec?'var(--ac-orange)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all 0.15s">
            ${isSec?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':''}
          </div>

          <!-- Referans thumbnail veya tür ikonu -->
          ${refThumb
            ? `<div style="width:32px;height:32px;border-radius:7px;overflow:hidden;flex-shrink:0;border:1px solid var(--brd)"><img src="${refThumb}" style="width:100%;height:100%;object-fit:cover"></div>`
            : `<div style="width:26px;height:26px;border-radius:7px;background:${isVid?'rgba(192,100,42,0.12)':'rgba(42,100,192,0.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${isVid?'<i data-lucide="film" style="width:14px;height:14px;color:rgba(192,100,42,0.8)"></i>':'<i data-lucide="image" style="width:14px;height:14px;color:rgba(42,100,192,0.8)"></i>'}</div>`
          }

          <!-- Bilgiler -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <span style="font-size:12px;font-weight:700;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">${h(prodLabel)}</span>
              <span style="font-size:9px;padding:1px 6px;border-radius:99px;background:${p.color}20;color:${p.color};border:1px solid ${p.color}40;white-space:nowrap;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;max-width:80px">${h(p.stratName||'')}</span>
              ${hasScores?`<span style="font-size:9px;padding:1px 5px;border-radius:99px;background:rgba(58,158,106,0.12);color:var(--green);flex-shrink:0">${scoreVal>0?'★'.repeat(Math.round(scoreVal/2)):'✓'}</span>`:''}
              ${linkedOutputs.length?`<span style="font-size:9px;padding:1px 5px;border-radius:99px;background:rgba(90,143,168,0.12);color:var(--ac-blue);flex-shrink:0" title="${linkedOutputs.length} çıktı üretildi">⬡ ${linkedOutputs.length}</span>`:''}
            </div>
            <div style="font-size:11px;color:var(--tx-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(p.text.substring(0,80))}${p.text.length>80?'…':''}</div>
          </div>

          <!-- Sil butonu -->
          <div onclick="event.stopPropagation()">
            <button onclick="deletePrompt('${p.id}')"
              style="padding:4px 8px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg-elevated);color:var(--tx-muted);font-size:10px;cursor:pointer;font-family:inherit">
              ✕
            </button>
          </div>
        </div>

        <!-- Expand: tam prompt + düzenleme -->
        ${isExp?`<div style="border-top:1px solid var(--brd-soft);padding:12px">

          <!-- BAĞLAM: referanslar + brief -->
          ${(p.refThumbs&&p.refThumbs.length)||(p.brief&&p.brief.trim())?`<div style="margin-bottom:12px;background:var(--bg-elevated);border-radius:10px;padding:10px;border:1px solid var(--brd-soft)">
            <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:8px;letter-spacing:0.5px">ÜRETIM BAĞLAMI</div>
            ${p.refThumbs&&p.refThumbs.length?`<div style="display:flex;gap:6px;margin-bottom:${p.brief?'8px':'0'}">
              ${p.refThumbs.map(t=>`<div style="width:52px;height:52px;border-radius:8px;overflow:hidden;border:1px solid var(--brd);flex-shrink:0"><img src="${t}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}
            </div>`:''}
            ${p.brief&&p.brief.trim()?`<div style="font-size:10px;color:var(--tx-muted);line-height:1.5;font-style:italic">"${h(p.brief)}"</div>`:''}
          </div>`:''}

          <!-- ÇIKTILAR: galeri bağlantıları -->
          ${linkedOutputs.length?`<div style="margin-bottom:12px;background:var(--bg-elevated);border-radius:10px;padding:10px;border:1px solid var(--brd-soft)">
            <div style="font-size:9px;font-weight:700;color:var(--ac-blue);margin-bottom:8px;letter-spacing:0.5px">BU PROMPTTAN ÜRETILENLER (${linkedOutputs.length})</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${linkedOutputs.slice(0,8).map(g=>{
                var isVideo=g.result&&(g.result.includes('.mp4')||g.result.includes('video'));
                return `<div style="position:relative;width:52px;height:52px;border-radius:8px;overflow:hidden;border:1px solid var(--brd);cursor:pointer" onclick="S.tab='gallery';render()" title="${h(g.model||'')}">
                  ${isVideo
                    ?`<div style="width:100%;height:100%;background:#111;display:flex;align-items:center;justify-content:center"><i data-lucide="play" style="width:20px;height:20px;color:#fff"></i></div>`
                    :`<img src="${g.result}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
                  }
                </div>`;
              }).join('')}
              ${linkedOutputs.length>8?`<div style="font-size:9px;color:var(--tx-muted);align-self:center">+${linkedOutputs.length-8}</div>`:''}
            </div>
          </div>`:''}

          <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:6px;letter-spacing:0.5px">PROMPT METNİ</div>
          <textarea
            style="width:100%;min-height:120px;font-size:12px;line-height:1.7;padding:10px;border-radius:10px;border:1.5px solid var(--brd);background:var(--bg-elevated);color:var(--tx-main);font-family:inherit;resize:vertical;box-sizing:border-box"
            oninput="updatePromptText('${p.id}',this.value)"
            onblur="saveDB()"
          >${h(p.text)}</textarea>

          <!-- Puanlama -->
          <div style="margin-top:10px;background:var(--bg-elevated);border-radius:10px;padding:10px;border:1px solid var(--brd-soft)">
            <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:8px;letter-spacing:0.5px">ÖĞRENİM PUANI</div>
            ${buildCritStars(p.id,p.scores,'prompt_consistency','Prompt Tutarlılık')}
            ${buildCritStars(p.id,p.scores,'product_consistency','Ürün Tutarlılık')}
            ${buildCritStars(p.id,p.scores,'felt_right','İçime Sindi')}
            <button onclick="savePromptScores('${p.id}')"
              style="margin-top:8px;width:100%;padding:7px;border-radius:8px;border:none;background:var(--ac-orange);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
              Kaydet & Öğret
            </button>
          </div>

          <div style="display:flex;gap:8px;margin-top:10px">
            <button onclick="togglePromptSelect('${p.id}')"
              style="flex:1;padding:7px;border-radius:8px;border:1.5px solid ${isSec?'rgba(201,79,79,0.35)':'var(--ac-orange)'};background:${isSec?'rgba(201,79,79,0.06)':'rgba(212,100,42,0.08)'};color:${isSec?'var(--red)':'var(--ac-orange)'};font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
              ${isSec?'✕ Seçimi Kaldır':'✓ Seç (Kuyruğa)'}
            </button>
            <button onclick="navigator.clipboard&&navigator.clipboard.writeText(S.promptPool.find(x=>x.id==='${p.id}')?.text||'');toast('Kopyalandı!')"
              style="padding:7px 12px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg-elevated);color:var(--tx-muted);font-size:11px;cursor:pointer;font-family:inherit">
              Kopyala
            </button>
            <button onclick="deletePrompt('${p.id}')"
              style="padding:7px 12px;border-radius:8px;border:1.5px solid rgba(201,79,79,0.3);background:var(--bg-elevated);color:var(--red);font-size:11px;cursor:pointer;font-family:inherit">
              Sil
            </button>
          </div>
        </div>`:''}
      </div>`;
    });

    o+=`</div>`; // prompt listesi
    o+=`</div>`; // sec
  return o;
}