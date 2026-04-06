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

async function urlToClaudeSource(url){
  try{
    var b64Data=url;
    if(!url.startsWith('data:')){var res=await fetch(url);var blob=await res.blob();b64Data=await new Promise(r=>{var reader=new FileReader();reader.onloadend=()=>r(reader.result);reader.readAsDataURL(blob)});}
    var match=b64Data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if(match){var mime=match[1];if(mime==='image/jpg')mime='image/jpeg';if(!['image/jpeg','image/png','image/gif','image/webp'].includes(mime))mime='image/jpeg';return{type:"base64",media_type:mime,data:match[2]};}
    return null;
  }catch(e){return null;}
}