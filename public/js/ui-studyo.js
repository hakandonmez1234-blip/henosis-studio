// ═══════════════════════════════════════════════════════════════
// UI-STUDYO.JS — Stüdyo Tabı
// İçerir: renderStudyo() → seçili promptlar listesi, master referanslar,
//         face swap, ürün koleksiyonu, motor seçimi, gönder butonu,
//         video pipeline toggle
// Çağırır: buildModelSelect()
// ═══════════════════════════════════════════════════════════════

// ── Custom dropdown callback'leri (Stüdyo) ──
function _setImgMdl(v){S.mdl=v;saveDB();render();}
function _setStudyoVidMdl(v){S.vidMdl=v;saveDB();render();}

function _imgCollectionHTML(){
  var o='';
  o+='<div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:10px;text-transform:uppercase">Ürün Koleksiyonu <span style="font-weight:400;text-transform:none">('+S.imgs.length+' görsel)</span></div>';
  o+='<label class="stüdyo-drop" id="dd-imgs" style="cursor:pointer;display:flex"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Sürükle bırak veya tıkla</span><input type="file" id="fi" multiple accept="image/*" style="display:none" onchange="rf(this.files,\'imgs\');this.value=\'\'"></label>';
  if(S.imgs.length){
    o+='<div class="ig" style="margin-top:10px">';
    S.imgs.forEach(function(img,i){
      o+='<div class="ic"><div class="ic-l">'+h(img.name)+'</div><img src="'+img.url+'"><button class="ic-x" onclick="event.stopPropagation();S.imgs.splice('+i+',1);saveDB();render()">✕</button></div>';
    });
    o+='</div>';
  }
  return o;
}

function renderStudyo(){
  var o='';
  var stMode=S.studioMode||'ref';
  var svSub=S.studioVidSubMode||'i2v';

  var torba=S.promptPool.filter(function(p){return p.selected;});
  var activeInProd=torba.filter(function(p){return p.prodActive!==false;});
  var isVidStudio=stMode==='video';
  var isT2VStudio=isVidStudio&&svSub==='t2v';
  var currentModel=isVidStudio?S.vidMdl:S.mdl;
  var shotCount=isVidStudio
    ?(isT2VStudio?activeInProd.length:activeInProd.length*(S.imgs.length||0))
    :(stMode==='t2i'?activeInProd.length:activeInProd.length*(S.imgs.length||0));
  var basePrice=M[currentModel]?M[currentModel].pn:0;
  var facePrice=(S.masterFace&&!isVidStudio&&stMode==='ref')?0.015:0;
  var totalCost=shotCount*(basePrice+facePrice);
  var _vm=M[S.vidMdl];var _im=M[S.mdl];

    // 1. Seçili promptlar
    o+=`<div class="sec">
      <div class="sec-title" style="margin-bottom:14px">Seçili Promptlar <span class="badge">${activeInProd.length} aktif / ${torba.length}</span></div>`;
    if(!torba.length){
      o+=`<div style="font-size:13px;color:var(--tx-muted);text-align:center;border:1.5px dashed var(--brd);border-radius:var(--rad-md);padding:20px">Torba boş — Yaratım sekmesinden prompt seçin.</div>`;
    }else{
      torba.forEach((p,idx)=>{
        let isActive=p.prodActive!==false;
        let prodLabel=p.productName||p.userInput.split(' ').slice(0,4).join(' ')||'Prompt';
        o+=`<div class="prod-cb-row ${isActive?'active':''}" onclick="toggleProdActive('${p.id}')">
          <div class="prod-cb"></div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
              <span style="font-size:9px;font-weight:800;min-width:20px;height:17px;display:inline-flex;align-items:center;justify-content:center;background:${isActive?'var(--ac-orange)':'var(--brd-soft)'};color:${isActive?'#fff':'var(--tx-muted)'};border-radius:4px;padding:0 5px;flex-shrink:0">${idx+1}</span>
              <span style="font-size:10px;font-weight:700;color:var(--ac-orange);font-family:'SF Mono',monospace;flex-shrink:0">${p.id}</span>
              <span style="font-size:11px;font-weight:600;color:${isActive?'var(--tx-main)':'var(--tx-muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(prodLabel)}</span>
            </div>
            <div style="font-size:11px;color:var(--tx-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;line-height:1.5">${h(p.text)}</div>
          </div>
        </div>`;
      });
    }
    o+=`</div>`;

    // 2. Üretim Modu Toggle
    o+=`<div class="sec" style="padding:14px 16px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:10px;text-transform:uppercase">Üretim Modu</div>
      <div style="display:flex;gap:0;border:1.5px solid var(--brd);border-radius:12px;overflow:hidden">
        <button onclick="S.studioMode='ref';saveDB();render()" style="flex:1;padding:10px 6px;border:none;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;transition:all 0.15s;background:${stMode==='ref'?'var(--ac-orange)':'var(--bg-elevated)'};color:${stMode==='ref'?'#fff':'var(--tx-muted)'}">
          <div style="font-size:15px;margin-bottom:3px">📸</div>
          Referanslı
          <div style="font-size:9px;font-weight:500;margin-top:2px;opacity:0.8">Görsel + prompt</div>
        </button>
        <button onclick="S.studioMode='t2i';saveDB();render()" style="flex:1;padding:10px 6px;border:none;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;transition:all 0.15s;border-left:1.5px solid var(--brd);background:${stMode==='t2i'?'var(--ac-orange)':'var(--bg-elevated)'};color:${stMode==='t2i'?'#fff':'var(--tx-muted)'}">
          <div style="font-size:15px;margin-bottom:3px">✍️</div>
          Text-to-Image
          <div style="font-size:9px;font-weight:500;margin-top:2px;opacity:0.8">Sadece prompt</div>
        </button>
        <button onclick="S.studioMode='video';saveDB();render()" style="flex:1;padding:10px 6px;border:none;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;transition:all 0.15s;border-left:1.5px solid var(--brd);background:${stMode==='video'?'var(--ac-orange)':'var(--bg-elevated)'};color:${stMode==='video'?'#fff':'var(--tx-muted)'}">
          <div style="font-size:15px;margin-bottom:3px">🎬</div>
          Video
          <div style="font-size:9px;font-weight:500;margin-top:2px;opacity:0.8">I2V veya T2V</div>
        </button>
      </div>
    </div>`;

    // 3. Mod panelleri
    o += '<div class="sec">';

    if(stMode==='ref'){
      var refThumbsHTML = S.masterRefs.map(function(mr,i){
        return '<div style="position:relative"><img src="'+mr.url+'" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:1.5px solid var(--brd-soft);display:block"><button onclick="S.masterRefs.splice('+i+',1);saveDB();render()" style="position:absolute;top:-4px;right:-4px;width:15px;height:15px;border-radius:50%;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:8px;display:flex;align-items:center;justify-content:center">✕</button></div>';
      }).join('');
      var faceHTML = S.masterFace
        ? '<div class="fc g10"><img src="'+S.masterFace.url+'" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:1.5px solid var(--ac-orange)"><div><div style="font-size:12px;font-weight:600;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px;color:var(--tx-main)">'+h(S.masterFace.name)+'</div><button class="bg" onclick="S.masterFace=null;saveDB();render()">Kaldır</button></div></div>'
        : '<label class="upload-btn" style="cursor:pointer"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Yüz Yükle<input type="file" id="mface" accept="image/*" style="display:none" onchange="rf(this.files,\'face\');this.value=\'\'"></label>';
      o += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">'
        + '<div><div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:10px;text-transform:uppercase">Master Referanslar</div>'
        + '<div class="fc g8" style="flex-wrap:wrap;align-items:center">'+refThumbsHTML
        + '<label class="upload-btn" style="cursor:pointer"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Ekle<input type="file" id="mfi" accept="image/*" multiple style="display:none" onchange="rf(this.files,\'ref\');this.value=\'\'"></label>'
        + '</div></div>'
        + '<div><div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:10px;text-transform:uppercase">Face Swap</div>'+faceHTML+'</div>'
        + '</div>';
      o += _imgCollectionHTML();

    } else if(stMode==='t2i'){
      o += '<div style="background:rgba(212,100,42,0.06);border:1.5px dashed rgba(212,100,42,0.3);border-radius:12px;padding:16px;text-align:center">'
        + '<div style="font-size:22px;margin-bottom:8px">✍️</div>'
        + '<div style="font-size:12px;font-weight:700;color:var(--tx-main);margin-bottom:4px">Text-to-Image modu aktif</div>'
        + '<div style="font-size:11px;color:var(--tx-muted);line-height:1.5">Ürün görseli gerekmez — her prompt doğrudan modele gönderilir.</div>'
        + '</div>';

    } else if(stMode==='video'){
      var i2vActive = svSub==='i2v' ? 'var(--ac-orange)' : 'var(--bg-elevated)';
      var i2vColor  = svSub==='i2v' ? '#fff' : 'var(--tx-muted)';
      var t2vActive = svSub==='t2v' ? 'var(--ac-orange)' : 'var(--bg-elevated)';
      var t2vColor  = svSub==='t2v' ? '#fff' : 'var(--tx-muted)';
      o += '<div style="margin-bottom:14px">'
        + '<div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">Video Tipi</div>'
        + '<div style="display:flex;gap:0;border:1.5px solid var(--brd);border-radius:10px;overflow:hidden">'
        + '<button onclick="S.studioVidSubMode=\'i2v\';saveDB();render()" style="flex:1;padding:9px 6px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;background:'+i2vActive+';color:'+i2vColor+'">📸 Görsel → Video (I2V)</button>'
        + '<button onclick="S.studioVidSubMode=\'t2v\';saveDB();render()" style="flex:1;padding:9px 6px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;border-left:1.5px solid var(--brd);background:'+t2vActive+';color:'+t2vColor+'">✍️ Metin → Video (T2V)</button>'
        + '</div></div>';

      if(svSub==='i2v'){
        o += _imgCollectionHTML();
      } else {
        o += '<div style="background:rgba(212,100,42,0.06);border:1.5px dashed rgba(212,100,42,0.3);border-radius:12px;padding:14px;text-align:center;margin-bottom:14px">'
          + '<div style="font-size:11px;color:var(--tx-muted)">T2V modda referans görsel gerekmez — prompt\'tan doğrudan video üretilir.</div>'
          + '</div>';
      }

      o += '<div style="margin-bottom:4px">'
        + '<div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px;text-transform:uppercase">Video Motoru</div>'
        + buildModelSelect(S.vidMdl, function(k){return M[k].t==='video'&&(svSub==='t2v'?M[k].subtype==='t2v':!M[k].subtype);}, '_setStudyoVidMdl', 'vid')
        + '</div>';

      var durVM = M[S.vidMdl];
      var durOpts = durVM&&durVM.durOpts&&durVM.durOpts.length ? durVM.durOpts : ['5','10'];
      var durBtns = durOpts.map(function(d){
        var ac = S.vidDur===d ? 'var(--ac-orange)' : 'var(--brd)';
        var bg = S.vidDur===d ? 'rgba(212,100,42,0.1)' : 'var(--bg-elevated)';
        var cl = S.vidDur===d ? 'var(--ac-orange)' : 'var(--tx-muted)';
        return '<button onclick="S.vidDur=\''+d+'\';saveDB();render()" style="padding:5px 14px;border-radius:99px;border:1.5px solid '+ac+';background:'+bg+';color:'+cl+';font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">'+d+'s</button>';
      }).join('');
      o += '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap">'
        + '<span style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;text-transform:uppercase">Süre:</span>'
        + durBtns + '</div>';
    }

    o += '</div>'; // sec

    // 4. Koleksiyon adı + Görsel motor (video modda görsel motor yok)
    o += '<div class="sec">';
    o += '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:6px;text-transform:uppercase">Koleksiyon Adı</div>'
      + '<input class="inp" placeholder="SS26_Butik" value="'+h(S.batch)+'" oninput="S.batch=this.value;saveDB()"></div>';
    if(stMode!=='video'){
      o += '<div style="margin-top:4px"><div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:6px;text-transform:uppercase">Görsel Motoru</div>'
        + buildModelSelect(S.mdl, function(k){return !['video','bgrem','upscale'].includes(M[k].t);}, '_setImgMdl', 'img')
        + '</div>';
    }
    o += '</div>';

    // 5. Gönder butonu
    var btnDisabled = stMode==='video'
      ? (!activeInProd.length || (svSub==='i2v' && !S.imgs.length))
      : (stMode==='t2i' ? !activeInProd.length : (!activeInProd.length || !S.imgs.length));
    var btnLabel = btnDisabled ? 'Kuyruğa Gönder' : 'Kuyruğa Gönder — '+shotCount+' çekim · ~$'+totalCost.toFixed(3);
    o += '<button class="bp" style="width:100%;padding:16px;font-size:14px;margin-top:4px" onclick="buildQ()" '+(btnDisabled?'disabled':'')+'>'+btnLabel+'</button>';

    // 6. Görsel→Video Pipeline (sadece görsel modda)
    if(stMode!=='video'){
      var pBg   = S.vidPipeline ? 'var(--tx-main)' : 'var(--bg-cream)';
      var pBrd  = S.vidPipeline ? 'transparent' : 'var(--brd-soft)';
      var pLbl  = S.vidPipeline ? '#fff' : 'var(--tx-main)';
      var pSub  = S.vidPipeline ? 'rgba(255,255,255,0.5)' : 'var(--tx-muted)';
      var pIcon = S.vidPipeline ? 'rgba(212,100,42,0.3)' : 'rgba(212,100,42,0.1)';
      var togLeft = S.vidPipeline ? '21px' : '3px';
      var togBg   = S.vidPipeline ? 'var(--ac-orange)' : 'var(--brd)';
      var pipeInfo = S.vidPipeline ? ((_im?_im.n:'?')+' → '+(_vm?_vm.n:'?')) : 'Görsel üretilince otomatik video kuyruğuna at';
      o += '<div style="margin-top:12px;background:'+pBg+';border:1.5px solid '+pBrd+';border-radius:var(--rad-md);padding:16px 20px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div style="width:32px;height:32px;border-radius:9px;background:'+pIcon+';display:flex;align-items:center;justify-content:center;">'+IC.vid+'</div>'
        + '<div><div style="font-size:13px;font-weight:700;color:'+pLbl+';">Görsel → Video Pipeline</div>'
        + '<div style="font-size:10px;color:'+pSub+';margin-top:1px">'+pipeInfo+'</div></div></div>'
        + '<div onclick="S.vidPipeline=!S.vidPipeline;saveDB();render()" style="cursor:pointer;flex-shrink:0;">'
        + '<div style="width:42px;height:23px;border-radius:12px;background:'+togBg+';position:relative;transition:background 0.2s;">'
        + '<div style="position:absolute;top:3px;left:'+togLeft+';width:17px;height:17px;border-radius:50%;background:#E8DDD0;box-shadow:0 1px 4px rgba(0,0,0,0.35);transition:left 0.2s;"></div>'
        + '</div></div></div>';
      if(S.vidPipeline){
        var pdOpts = (_vm&&_vm.durOpts?_vm.durOpts:['5','10']).map(function(d){
          var da=S.vidDur===d?'var(--ac-orange)':'rgba(255,255,255,0.15)';
          var db=S.vidDur===d?'rgba(212,100,42,0.25)':'transparent';
          var dc=S.vidDur===d?'var(--ac-orange)':'rgba(255,255,255,0.4)';
          return '<button onclick="S.vidDur=\''+d+'\';saveDB();render()" style="padding:4px 12px;border-radius:99px;border:1.5px solid '+da+';font-size:11px;font-weight:600;cursor:pointer;background:'+db+';color:'+dc+';font-family:inherit;">'+d+'s</button>';
        }).join('');
        o += '<div style="margin-top:12px;background:rgba(255,255,255,0.07);border-radius:10px;padding:12px;">'
          + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">'
          + '<span style="padding:3px 10px;border-radius:99px;background:rgba(212,100,42,0.25);color:var(--ac-warm);font-size:10px;font-weight:600">'+(_im?_im.n:'?')+'</span>'
          + '<span style="color:rgba(255,255,255,0.3);font-size:12px">→</span>'
          + '<span style="padding:3px 10px;border-radius:99px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-size:10px;font-weight:600">'+(_vm?_vm.n:'?')+'</span>'
          + '</div>'
          + '<input placeholder="Kamera yavaşça yaklaşsın..." oninput="S.vidPipelineNote=this.value" value="'+h(S.vidPipelineNote)+'" style="width:100%;padding:8px 12px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.07);color:#fff;font-size:12px;outline:none;box-sizing:border-box;font-family:inherit;">'
          + '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;"><span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);">SÜRE:</span>'+pdOpts+'</div>'
          + '</div>';
      }
      o += '</div>';
    }

  return o;
}