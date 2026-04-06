// ═══════════════════════════════════════════════════════════════
// API.JS — Sunucu İstekleri ve Model Çağrıları
// ═══════════════════════════════════════════════════════════════

async function callClaude(messages,modelName,sysOverride){
  if(!S.claudeKey&&!S.envClaudeKey)throw new Error("Claude API Key eksik!");
  
  // System prompt caching kontrolü
  var cacheInfo=getCachedSystemPrompt(sysOverride);
  var systemToUse=cacheInfo.system;
  
  // Claude 3.7+ için cache breakpoint (extended thinking modelleri)
  var isCacheableModel=modelName&&(modelName.includes('3-7')||modelName.includes('claude-3-7'));
  
  var formatted=[];
  for(let msg of messages){
    if(Array.isArray(msg.content)){
      var nc=[];
      for(let c of msg.content){
        if(c.type==='image'){
          if(c.source&&c.source.type==='base64'){nc.push({type:"image",source:c.source});}
          else{var srcUrl=c.source.url||c.source.data;if(srcUrl){var cs=await urlToClaudeSource(srcUrl);if(cs)nc.push({type:"image",source:cs});}}
        }else nc.push(c);
      }
      formatted.push({role:msg.role,content:nc});
    }else formatted.push(msg);
  }
  
  try{
    // Dinamik max_tokens - görev zorluğuna göre
    var estimatedTokens=1500;
    var lastMsg=formatted[formatted.length-1];
    if(lastMsg&&lastMsg.content){
      var textLen=typeof lastMsg.content==='string'?lastMsg.content.length:lastMsg.content.map(c=>c.text||'').join('').length;
      if(textLen>500)estimatedTokens=2500;
      if(textLen>1000)estimatedTokens=4000;
    }
    
    var r=await fetch('/api/claude',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        apiKey:S.claudeKey,
        model:modelName||"claude-sonnet-4-6",
        max_tokens:estimatedTokens,
        system:systemToUse,
        messages:formatted,
        // Claude 3.7+ için cache hint (backend desteklerse)
        ...(isCacheableModel&&cacheInfo.cached?{cache_control:{type:"ephemeral"}}:{})
      })
    });
    var d=await r.json();if(!r.ok)throw new Error(d.error||"Sunucu hatası");
    return d.text.trim();
  }catch(e){throw new Error("API Hatası: "+e.message);}
}

async function callLLM(userText,imageUrls,sysOverride){
  var actModel=S.llm==='claude-opus-4-6'?'claude-opus-4-6':'claude-sonnet-4-6';var content=[];
  if(imageUrls&&imageUrls.length>0){for(let url of imageUrls){var cs=await urlToClaudeSource(url);if(cs)content.push({type:"image",source:cs});}}
  content.push({type:"text",text:userText});return await callClaude([{role:"user",content:content}],actModel,sysOverride);
}

async function generate(item,maxRetries=3){
  if(!S.envFalKey&&(!S.key||!S.key.trim()))throw new Error("Fal.ai API Key eksik.");
  let m=M[item.model];if(!m){m=M['f2proedit'];item.model='f2proedit';saveDB();}
  const falFetch=async(payload)=>{const fr=await fetch('/api/fal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:m.ep,body:payload,falKey:S.envFalKey?null:S.key})});const d=await fr.json();if(!fr.ok)throw new Error(d.error||'Fal.ai hatası');return d;};
  let lastError;
  for(let attempt=1;attempt<=maxRetries;attempt++){
    try{
      if(m.t==='video'){
        const rawDur=item.vidDur||S.vidDur||'5';
        const isT2V = m.subtype==='t2v' || (item.ref&&item.ref._textToVideo);
        const hasImgUrl = !isT2V && item.ref && item.ref.url;
        const vp = hasImgUrl ? {image_url:item.ref.url,prompt:item.prompt} : {prompt:item.prompt};
        if(m.durFmt==='num'){
          let d=parseInt(rawDur);
          if(m.durOpts&&m.durOpts.length){const valid=m.durOpts.map(Number);if(!valid.includes(d))d=valid[0];}
          vp.duration=d;
        }else if(m.durFmt==='str'){
          const valid=m.durOpts||['4','6','8'];
          const pick=valid.includes(rawDur)?rawDur:valid[0];
          const ep=m.ep||'';
          const needsUnit=ep.includes('veo')||ep.includes('google');
          vp.duration=needsUnit?pick+'s':pick;
        }else if(m.durFmt==='sec'){
          const valid=m.durOpts||['6','10'];
          const pick=valid.includes(rawDur)?rawDur:valid[0];
          vp.duration=parseInt(pick);
        }
        const dvid=await falFetch(vp);
        const vidUrl=dvid.video?.url||dvid.videos?.[0]?.url||dvid.url||dvid.images?.[0]?.url||null;
        if(vidUrl)return vidUrl;
        throw new Error('Video üretilemedi: '+JSON.stringify(dvid).slice(0,200));
      }
      if(m.t==='bgrem'||m.t==='upscale'){const pl={image_url:item.ref.url};if(m.t==='upscale')pl.prompt=item.prompt;const d=await falFetch(pl);const url=d.image?.url||d.images?.[0]?.url||d.url;if(url)return url;throw new Error('İşlem başarısız.');}
      
      // Inpainting desteği
      if(item.useInpainting&&item.maskUrl){
        const payload={
          image_url:item.ref.url,
          prompt:item.prompt,
          mask_url:item.maskUrl
        };
        const d=await falFetch(payload);
        const imgResult=d.images?.[0];
        const imgUrl=typeof imgResult==='string'?imgResult:(imgResult?.url||imgResult?.image_url||null);
        if(imgUrl)return imgUrl;
        if(d.image?.url)return d.image.url;
        if(d.url)return d.url;
        throw new Error('Inpainting başarısız: '+JSON.stringify(d).slice(0,200));
      }
      
      const isT2I=item.ref&&item.ref._textToImage;
      const hasM=S.masterRefs&&S.masterRefs.length>0;
      const payload={prompt:item.prompt};
      if(!isT2I){
        let allUrls=[item.ref.url];if(hasM)S.masterRefs.forEach(mr=>allUrls.push(mr.url));
        if(m.t==='flux2')payload.image_urls=allUrls;
        else if(m.t==='kontext'){if(hasM)payload.image_urls=[S.masterRefs[0].url,item.ref.url];else payload.image_url=item.ref.url;}
        else if(m.t==='nano'||m.t==='seedream')payload.image_urls=allUrls;
        else if(m.t==='recraft'){if(item.ref?.url)payload.image_url=item.ref.url;}
        else if(m.t==='flux'){/* text-to-image, no image needed */}
        else{payload.image_url=item.ref.url;payload.strength=0.85;}
      }
      // T2I: sadece prompt — hiç image_url gönderme
      const d=await falFetch(payload);
      const imgResult=d.images?.[0];const imgUrl=typeof imgResult==='string'?imgResult:(imgResult?.url||imgResult?.image_url||null);if(imgUrl)return imgUrl;if(d.image?.url)return d.image.url;if(d.url)return d.url;throw new Error('Görsel üretilemedi: '+JSON.stringify(d).slice(0,200));
    }catch(e){lastError=e;if(attempt<maxRetries)await new Promise(r=>setTimeout(r,4000*attempt));}
  }throw lastError;
}

async function faceSwap(imgUrl,faceUrl,maxRetries=3){
  if(!S.envFalKey&&(!S.key||!S.key.trim()))throw new Error("Key eksik.");
  let lastError;
  for(let attempt=1;attempt<=maxRetries;attempt++){
    try{var r=await fetch('/api/fal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:'fal-ai/face-swap',body:{base_image_url:imgUrl,swap_image_url:faceUrl},falKey:S.envFalKey?null:S.key})});var d=await r.json();if(!r.ok)throw new Error(d.error);return d.image.url;}catch(e){lastError=e;if(attempt<maxRetries)await new Promise(r=>setTimeout(r,4000));}
  }throw lastError;
}

async function checkFFmpegStatus() {
  try {
    var r = await fetch('/api/ffmpeg-status');
    var d = await r.json();
    S.ffmpegAvailable = d.available;
    S.ffmpegVersion = d.version || '';
    S.ffmpegError = d.error || '';
  } catch (e) {
    S.ffmpegAvailable = false;
    S.ffmpegError = 'Sunucu bağlantı hatası';
  }
  render();
}