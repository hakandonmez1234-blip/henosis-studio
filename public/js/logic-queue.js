// ═══════════════════════════════════════════════════════════════
// LOGIC-QUEUE.JS — Kuyruk Yönetimi, Çalıştırma, Export, Widget
// ═══════════════════════════════════════════════════════════════

// opts: { direct: true } → DOM textarea'dan oku, { prompts: [...], batch: '...' } → doğrudan array ver
function buildQ(opts){
  opts=opts||{};
  var bn=opts.batch||S.batch||'Koleksiyon_'+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});

  // ── Doğrudan prompt array'i verilmişse ──
  if(opts.prompts){
    var imgs=S.imgs.length?S.imgs:[{name:'T2I',_textToImage:true}];
    imgs.forEach(function(img){
      opts.prompts.forEach(function(pt){
        var isT2I=img._textToImage||S.studioMode==='t2i';
        var ref=isT2I?{name:img.name||pt.productName||'T2I',_textToImage:true}:img;
        S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:ref,prompt:(pt.text||pt).replace(/\{isim\}/gi,ref.name),status:'pending',result:null,batch:bn,model:S.mdl,stratName:pt.stratName||'Manuel',promptId:pt.id||''});
      });
    });
    S.tab='queue';saveDB(true);render();return;
  }

  // ── DOM textarea'dan oku (eski buildQDirect) ──
  if(opts.direct){
    var ta=document.getElementById('direct-prompt-ta');
    var bn_el=document.getElementById('direct-batch-name');
    if(!ta||!ta.value.trim())return toast('Prompt boş.');
    if(!S.imgs.length)return alert('Görsel yükleyin.');
    var promptText=ta.value.trim();
    bn=(bn_el&&bn_el.value.trim())||('Direkt_'+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}));
    S.imgs.forEach(function(img){S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:img,prompt:promptText.replace(/\{isim\}/gi,img.name),status:'pending',result:null,batch:bn,model:S.mdl,stratName:'Manuel'});});
    ta.value='';S.tab='queue';saveDB(true);render();toast('Kuyruğa eklendi!');return;
  }

  // ── Ana mod: torba'daki seçili promptlar ──
  var activeProdPrompts=S.promptPool.filter(p=>p.selected&&p.prodActive!==false);
  if(!activeProdPrompts.length)return alert('Kuyruğa eklenecek aktif prompt yok.');

  if(S.studioMode==='t2i'){
    activeProdPrompts.forEach(p=>{
      var pname=p.productName||p.userInput||'Görsel';
      S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:{name:pname,_textToImage:true},prompt:p.text.replace(/\{isim\}/gi,pname),status:'pending',result:null,batch:bn,model:S.mdl,stratName:p.stratName,vidDur:S.vidDur,promptId:p.id||''});
    });
  }else if(S.studioMode==='video'){
    var svSub=S.studioVidSubMode||'i2v';
    var chosenVidMdl=(svSub==='t2v'&&S.t2vMdl)?S.t2vMdl:S.vidMdl;
    if(svSub==='i2v'){
      if(!S.imgs.length)return alert('I2V modu için ürün görseli yükleyin.');
      S.imgs.forEach(function(img){
        activeProdPrompts.forEach(function(p){
          S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:img,prompt:p.text.replace(/\{isim\}/gi,img.name),status:'pending',result:null,batch:bn,model:chosenVidMdl,stratName:p.stratName,vidDur:S.vidDur,promptId:p.id||''});
        });
      });
    }else{
      activeProdPrompts.forEach(function(p){
        var pname=p.productName||p.userInput||'Video';
        S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:{name:pname,_textToVideo:true},prompt:p.text.replace(/\{isim\}/gi,pname),status:'pending',result:null,batch:bn,model:chosenVidMdl,stratName:p.stratName,vidDur:S.vidDur,promptId:p.id||''});
      });
    }
  }else{
    if(!S.imgs.length)return alert('Stüdyo Setup\'ta ürün görseli yükleyin.');
    S.imgs.forEach(img=>{
      activeProdPrompts.forEach(p=>{
        var isVid=p.type==='video';
        var chosenVidMdl=(S.vidSubMode==='t2v'&&S.t2vMdl)?S.t2vMdl:S.vidMdl;
        var refObj=isVid&&S.vidSubMode==='t2v'?Object.assign({},img,{_textToVideo:true}):img;
        S.queue.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),ref:refObj,prompt:p.text.replace(/\{isim\}/gi,img.name),status:'pending',result:null,batch:bn,model:isVid?chosenVidMdl:S.mdl,stratName:p.stratName,vidDur:S.vidDur,promptId:p.id||''});
      });
    });
  }
  S.tab='queue';saveDB(true);render();
}

async function runAll(){
  if(!S.envFalKey&&(!S.key||!S.key.trim())){alert('Fal.ai Key eksik!');S.tab='settings';render();return;}
  var pend=S.queue.filter(q=>q.status==='pending');if(!pend.length)return;S.run=true;saveDB(true);render();
  _qTimer={start:Date.now(),itemStart:Date.now(),interval:null,totalInterval:null};
  _startCornerWidget();
  var cost=0;
  for(var i=0;i<pend.length;i++){
    if(!S.run){toast("Kuyruk durduruldu!");break;}
    var it=pend[i];it.status='generating';it._startedAt=Date.now();saveDB(true);render();
    try{
      it.result=await generate(it);var mType=M[it.model]?M[it.model].t:'';
      var duration=it._startedAt?Math.round((Date.now()-it._startedAt)/1000):0;
      if(S.masterFace&&mType!=='video'&&mType!=='bgrem'&&mType!=='upscale'){it.result=await faceSwap(it.result,S.masterFace.url);cost+=0.015;}
      it.status='done';delete it._startedAt;
      S.gallery.unshift({id:it.id,ref:it.ref,prompt:it.prompt,status:'done',result:it.result,batch:it.batch,model:it.model,strat:it.stratName,flagged:false,note:'',duration:duration,promptId:it.promptId||'',scores:{tutarlilik:0,dogallik:0,yeterlilik:0},isRevision:it.isRevision||false,originalIdx:it.originalIdx||null,maskUrl:it.maskUrl||null});
      _updateModelStats(it.model,duration);
      if(M[it.model])cost+=M[it.model].pn;saveDB(true);
    }catch(e){it.status='error';it.result=e.message;delete it._startedAt;saveDB(true);}
    render();if(i<pend.length-1)await new Promise(r=>setTimeout(r,500));
  }
  _stopCornerWidget();addSpent(cost);S.run=false;saveDB(true);render();toast('Kuyruk tamamlandı!');
  if(S.tgToken&&S.tgChatId&&pend.length>0){
    fetch('/api/telegram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:S.tgToken,chatId:S.tgChatId,text:`Prime Studio: ${pend.length} işlem tamamlandı!`})}).catch(()=>{});
  }
}

// ═══ EXPORT / İNDİRME ═══

async function exportGalleryZip(){
  var zip=new JSZip();var count=0;toast("Arşiv hazırlanıyor...");
  for(var i=0;i<S.gallery.length;i++){
    var item=S.gallery[i];
    if(item.result&&!item.result.includes('blob:')){
      try{var resp=await fetch(item.result,{mode:'cors'});var blob=await resp.blob();var ext=blob.type.includes('video')?'.mp4':'.png';var folder=zip.folder(item.batch||"Genel");folder.file((item.flagged?'Revize_':'')+item.ref.name+'_'+i+ext,blob);count++;}catch(e){}
    }
  }
  if(!count){alert("İndirilecek dosya yok.");return;}
  var content=await zip.generateAsync({type:"blob"});var url=URL.createObjectURL(content);var a=document.createElement('a');a.href=url;a.download="Koleksiyon.zip";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);toast('ZIP indirildi!');
}

async function downloadSingle(url,filename){
  toast("İndiriliyor...");
  try{const resp=await fetch(url,{mode:'cors'});const blob=await resp.blob();const ext=blob.type.includes('video')?'.mp4':'.png';const objUrl=URL.createObjectURL(blob);const a=document.createElement('a');a.href=objUrl;a.download=filename+ext;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(objUrl);}catch(e){alert("Hata: "+e.message);}
}

// ═══ ZAMANLAYICI & WIDGET ═══

var _qTimer={start:null,itemStart:null,interval:null,totalInterval:null};

function _startCornerWidget(){
  _stopCornerWidget();
  var el=document.createElement('div');el.id='ps-corner-widget';
  el.innerHTML=_buildWidgetHTML('','0s',0,0);document.body.appendChild(el);
  _qTimer.totalInterval=setInterval(function(){
    var widget=document.getElementById('ps-corner-widget');if(!widget||!S.run)return;
    var totalSec=Math.floor((Date.now()-_qTimer.start)/1000);
    var doneQ=S.queue.filter(q=>q.status==='done').length;var totalQ=S.queue.length;
    var activeItem=S.queue.find(q=>q.status==='generating');
    var itemSec=activeItem&&activeItem._startedAt?Math.floor((Date.now()-activeItem._startedAt)/1000):0;
    var itemName=activeItem?activeItem.ref.name:'';var modelName=activeItem&&M[activeItem.model]?M[activeItem.model].n:'';
    widget.innerHTML=_buildWidgetHTML(itemName,_formatSec(totalSec),doneQ,totalQ,itemSec,modelName);
  },1000);
  _qTimer.interval=setInterval(function(){
    if(!S.run)return;
    S.queue.forEach(function(it,i){
      if(it.status!=='generating'||!it._startedAt)return;
      var sec=Math.floor((Date.now()-it._startedAt)/1000);
      var el=document.getElementById('ps-item-timer-'+i);if(el)el.textContent=_formatSec(sec);
      var ring=document.getElementById('ps-item-ring-'+i);
      if(ring){var deg=(sec*30)%360;ring.style.background=`conic-gradient(var(--ac-orange) ${deg}deg, rgba(212,100,42,0.12) ${deg}deg)`;}
    });
  },1000);
}

function _stopCornerWidget(){
  clearInterval(_qTimer.totalInterval);clearInterval(_qTimer.interval);
  var el=document.getElementById('ps-corner-widget');if(el)el.remove();
}

function _buildWidgetHTML(itemName,totalStr,done,total,itemSec,modelName){
  var pct=total>0?Math.round((done/total)*100):0;
  return `<div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px">ÜRETIM DEVAM EDIYOR</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;background:conic-gradient(var(--ac-orange) ${pct*3.6}deg, rgba(212,100,42,0.12) ${pct*3.6}deg);display:flex;align-items:center;justify-content:center;">
        <div style="width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:var(--ac-orange)">${pct}%</div>
      </div>
      <div><div style="font-size:15px;font-weight:800;color:var(--tx-main)">${done} <span style="font-size:11px;font-weight:500;color:var(--tx-muted)">/ ${total}</span></div><div style="font-size:10px;color:var(--tx-muted)">tamamlandı</div></div>
      <div style="margin-left:auto;text-align:right"><div style="font-size:14px;font-weight:700;color:var(--tx-main)">${totalStr}</div><div style="font-size:10px;color:var(--tx-muted)">toplam süre</div></div>
    </div>
    ${itemName?`<div style="background:var(--bg-cream);border-radius:10px;padding:8px 10px;"><div style="font-size:10px;color:var(--tx-muted);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${itemName}</div><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:10px;color:var(--ac-orange);font-weight:600">${modelName}</div><div style="font-size:11px;font-weight:700;color:var(--tx-main)">${_formatSec(itemSec||0)}</div></div></div>`:''}`;
}

function _formatSec(sec){var m=Math.floor(sec/60);var s=sec%60;return m>0?m+':'+(s<10?'0':'')+s:s+'s';}

if(!document.getElementById('ps-widget-css')){
  var _wStyle=document.createElement('style');_wStyle.id='ps-widget-css';
  _wStyle.innerHTML=`
    #ps-corner-widget{position:fixed;bottom:22px;right:22px;width:215px;background:var(--bg-card);border-radius:16px;padding:13px 15px;box-shadow:var(--shadow-soft);border:1px solid var(--brd-soft);z-index:150;animation:ps-widget-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275);}
    @keyframes ps-widget-in{from{opacity:0;transform:translateY(12px) scale(0.96);}to{opacity:1;transform:translateY(0) scale(1);}}
    .qi.generating{position:relative;overflow:hidden;}
    .qi.generating::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(212,100,42,0.04) 50%,transparent 100%);background-size:200% 100%;animation:ps-shimmer 1.8s infinite;pointer-events:none;z-index:1;}
    @keyframes ps-shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
    .ps-item-ring{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
    .ps-item-ring-inner{width:20px;height:20px;border-radius:50%;background:var(--bg-card);}
    .ps-item-timer{font-size:11px;font-weight:600;color:var(--ac-orange);min-width:30px;text-align:right;}
  `;
  document.head.appendChild(_wStyle);
}

function importVideosFromQueue() {
  var doneVids = S.queue.filter(q => q.status === 'done' && M[q.model] && M[q.model].t === 'video' && q.result);
  if (!doneVids.length) return toast('Kuyrukta tamamlanmış video yok.');
  var added = 0;
  doneVids.forEach(q => {
    var alreadyIn = S.videoStudio.clips.some(c => c.url === q.result);
    if (!alreadyIn) {
      S.videoStudio.clips.push({
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        url: q.result,
        thumbUrl: q.result,
        duration: parseInt(q.vidDur) || 5,
        text: '',
        promptText: q.prompt || '',
        order: S.videoStudio.clips.length,
        refName: q.ref ? q.ref.name : 'Klip'
      });
      added++;
    }
  });
  if (added) { saveDB(); render(); toast(added + ' video klip eklendi!'); }
  else toast('Tüm videolar zaten listede.');
}
