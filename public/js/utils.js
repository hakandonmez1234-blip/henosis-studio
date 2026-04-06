// ═══════════════════════════════════════════════════════════════
// UTILS.JS — Yardımcı Fonksiyonlar
// ═══════════════════════════════════════════════════════════════

function h(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function toast(msg){var t=document.getElementById('toast');if(!t)return;t.innerHTML=msg;t.style.opacity=1;t.style.transform='translateY(0)';setTimeout(()=>{t.style.opacity=0;t.style.transform='translateY(20px)'},3000);}

function genPromptId(){
  var prefix=['DSK','SCN','VID','ART','BNR','STD'][Math.floor(Math.random()*6)];
  var num=Math.floor(1000+Math.random()*9000);
  var sfx=Math.random().toString(36).slice(2,5);
  return prefix+'-'+num+'-'+sfx;
}

function rf(files,target){
  Array.from(files).forEach(function(f){
    if(!f.type.startsWith('image/'))return;var r=new FileReader();
    r.onload=function(e){
      var obj={id:Date.now()+'-'+Math.random().toString(36).slice(2,5),url:e.target.result,name:f.name.replace(/\.[^.]+$/,'')};
      if(target==='ref')S.masterRefs.push(obj);
      else if(target==='face')S.masterFace=obj;
      else if(target==='concept')S.conceptImgs.push(obj);
      else if(target==='hermes'){S.hermesImg=obj;}
      else S.imgs.push({...obj,cleaned:false});
      saveDB();render();
    };r.readAsDataURL(f);
  });
}

function setupDragDrop(el,target){
  if(!el)return;
  el.addEventListener('dragover',function(e){e.preventDefault();e.stopPropagation();el.style.borderColor='var(--ac-orange)';el.style.background='rgba(255,138,75,0.08)';});
  el.addEventListener('dragleave',function(e){el.style.borderColor='';el.style.background='';});
  el.addEventListener('drop',function(e){e.preventDefault();e.stopPropagation();el.style.borderColor='';el.style.background='';var files=e.dataTransfer.files;if(files&&files.length){rf(files,target);toast(files.length+' dosya alındı!');}});
}

function bindDragDrops(){
  var mapping=[['dd-imgs','imgs'],['dd-ref','ref'],['dd-face','face'],['dd-concept','concept'],['dd-hermes','hermes']];
  mapping.forEach(function(pair){var el=document.getElementById(pair[0]);if(el&&!el.__ddBound){setupDragDrop(el,pair[1]);el.__ddBound=true;}});
}

// Vision token optimizasyonlu versiyon - max 800px, JPEG/WEBP
async function urlToClaudeSource(url, maxDim=800, quality=0.85){
  try{
    var b64Data=url;
    if(!url.startsWith('data:')){var res=await fetch(url);var blob=await res.blob();b64Data=await new Promise(r=>{var reader=new FileReader();reader.onloadend=()=>r(reader.result);reader.readAsDataURL(blob)});}
    
    // Base64'ten boyut kontrolü ve optimizasyon
    var match=b64Data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if(!match) return null;
    
    var mime=match[1];
    var base64Data=match[2];
    var sizeBytes=Math.ceil(base64Data.length*3/4);
    
    // 150KB'dan büyükse ve data URL değilse optimize et
    if(sizeBytes>150*1024 && !url.startsWith('data:')){
      try{
        var img=new Image();
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=b64Data;});
        
        var canvas=document.createElement('canvas');
        var ctx=canvas.getContext('2d');
        
        // Boyut sınırlama
        var w=img.width,h=img.height;
        if(w>maxDim||h>maxDim){
          if(w>h){h=Math.round(h*maxDim/w);w=maxDim;}
          else{w=Math.round(w*maxDim/h);h=maxDim;}
        }
        
        canvas.width=w;canvas.height=h;
        ctx.drawImage(img,0,0,w,h);
        
        // JPEG'e çevir, kalite düşür
        b64Data=canvas.toDataURL('image/jpeg',quality);
        match=b64Data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if(match){
          mime=match[1];
          base64Data=match[2];
        }
      }catch(optErr){/* optimize edemezse orijinali kullan */}
    }
    
    if(mime==='image/jpg')mime='image/jpeg';
    if(!['image/jpeg','image/png','image/gif','image/webp'].includes(mime))mime='image/jpeg';
    return{type:"base64",media_type:mime,data:base64Data};
  }catch(e){return null;}
}

// ═══ PROMPT CACHING (Claude 3.7+ için) ═══

const PROMPT_CACHE_MS=5*60*1000; // 5 dakika cache
var cachedSystemPrompt=null;
var cachedAt=null;

function getCachedSystemPrompt(sysOverride){
  var system=sysOverride||window.SYS_PROMPT||'';
  var cacheKey=system.slice(0,200); // İlk 200 karakter cache key
  
  // Aynı system prompt ve cache süresi içindeyse cache kullan
  if(cachedSystemPrompt && cachedAt && (Date.now()-cachedAt)<PROMPT_CACHE_MS){
    if(cachedSystemPrompt.key===cacheKey){
      return {system:cachedSystemPrompt.content,cached:true,expires:cachedAt+PROMPT_CACHE_MS};
    }
  }
  
  // Yeni cache oluştur
  cachedSystemPrompt={key:cacheKey,content:system};
  cachedAt=Date.now();
  return {system:system,cached:false,expires:cachedAt+PROMPT_CACHE_MS};
}

function clearSystemCache(){
  cachedSystemPrompt=null;
  cachedAt=null;
}