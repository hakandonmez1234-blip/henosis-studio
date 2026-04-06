// ═══════════════════════════════════════════════════════════════
// LOGIC-PROMPTS.JS — Prompt Üretimi, Revize, Hermes, Havuz İşlemleri
// ═══════════════════════════════════════════════════════════════

// ═══ SİHİRLİ PROMPT ═══

function _pickMagicStrategy(category) {
  // Öğrenimden yüksek skorlu stratejileri al
  var highScored = (S.learningData && S.learningData.patterns && S.learningData.patterns.highScoreStrategies) || [];
  var avoided = (S.learningData && S.learningData.patterns && S.learningData.patterns.avoidStrategies) || [];
  var preferred = category.preferredStrats || [];

  // Önce: öğrenimde yüksek skor almış VE kategorinin tercih listesinde olan strateji
  for (var i = 0; i < highScored.length; i++) {
    if (preferred.indexOf(highScored[i]) >= 0 && avoided.indexOf(highScored[i]) < 0) {
      var idx = STRATEGIES.findIndex(function(s) { return s.name === highScored[i]; });
      if (idx >= 0) return { strat: STRATEGIES[idx], source: 'learned+category' };
    }
  }

  // Sonra: kategorinin tercih listesindeki ilk kaçınılmayan strateji
  for (var j = 0; j < preferred.length; j++) {
    if (avoided.indexOf(preferred[j]) < 0) {
      var idx2 = STRATEGIES.findIndex(function(s) { return s.name === preferred[j]; });
      if (idx2 >= 0) return { strat: STRATEGIES[idx2], source: 'category' };
    }
  }

  // Fallback: öğrenimde en yüksek skorlu strateji
  if (highScored.length > 0 && avoided.indexOf(highScored[0]) < 0) {
    var idx3 = STRATEGIES.findIndex(function(s) { return s.name === highScored[0]; });
    if (idx3 >= 0) return { strat: STRATEGIES[idx3], source: 'learned' };
  }

  // Son fallback: E-Ticaret Beyaz Fon
  var fallbackIdx = STRATEGIES.findIndex(function(s) { return s.name === 'E-Ticaret Beyaz Fon'; });
  return { strat: STRATEGIES[Math.max(0, fallbackIdx)], source: 'default' };
}

async function magicPrompt() {
  var imgUrls = S.conceptImgs.map(function(img) { return img.url; });

  if (imgUrls.length === 0) {
    toast('Sihirli mod için bir ürün görseli gerekli!');
    return;
  }

  S.isGenerating = true;
  S.genPhase = 'Sihir başlıyor...';
  render();

  try {
    // AŞAMA 1: Art Director analizi
    S.genPhase = 'Ürün analiz ediliyor...';
    render();

    var adContent = [];
    for (var i = 0; i < imgUrls.length; i++) {
      var cs = await urlToClaudeSource(imgUrls[i]);
      if (cs) adContent.push({ type: 'image', source: cs });
    }
    adContent.push({ type: 'text', text: 'Analyze this product image as an art director. Return ONLY the JSON object. productAnchor must have ZERO color words — describe only form, material, texture, geometry.' });

    var adModel = S.llm === 'claude-opus-4-6' ? 'claude-opus-4-6' : 'claude-sonnet-4-6';
    var rawBrief = await callClaude([{ role: 'user', content: adContent }], adModel, SYS_ART_DIRECTOR);
    var artDirectorBrief = null;
    try {
      artDirectorBrief = JSON.parse(rawBrief.replace(/```json|```/g, '').trim());
    } catch (e) {
      artDirectorBrief = { raw: rawBrief };
    }

    // AŞAMA 2: Brief bağlamı oluştur
    var briefContext = '';
    if (artDirectorBrief) {
      if (artDirectorBrief.raw) {
        briefContext = '\n\n━━━ ART DIRECTOR BRIEF ━━━\n' + artDirectorBrief.raw;
      } else {
        briefContext = '\n\n━━━ ART DIRECTOR BRIEF ━━━' +
          '\nProduct Anchor (NO COLOR): ' + (artDirectorBrief.productAnchor || '') +
          '\nLighting Setup: ' + (artDirectorBrief.lightingSetup || '') +
          '\nCamera & Lens: ' + (artDirectorBrief.lensAndCamera || '') +
          '\nSurface & Context: ' + (artDirectorBrief.surfaceAndContext || '') +
          (artDirectorBrief.castingNote ? '\nCasting Note: ' + artDirectorBrief.castingNote : '') +
          '\nFilm Grade: ' + (artDirectorBrief.filmGrade || '') +
          '\nAnti-AI Physicality: ' + (artDirectorBrief.antiAIDetails || '') +
          '\nComposition: ' + (artDirectorBrief.compositionNote || '');
      }
      briefContext += '\n\nIMPORTANT: Use these technical details as the physical backbone. Weave them naturally into your paragraph.';
    }

    // AŞAMA 3: Kişisel profil + öğrenim bağlamı
    S.genPhase = 'Yaratıcı vizyon oluşturuluyor...';
    render();
    var learningCtx = getLearningContext();
    var personalCtx = getPersonalContext();

    var sysOver = SYS_MAGIC_CREATIVE + briefContext + learningCtx + personalCtx;
    var instruction = 'Write one truly creative photography prompt for this product. No fixed style or category — let the product\'s physical reality and the personal creative vision guide you completely. Use {isim} as the product placeholder. Output ONLY the prompt paragraph.';

    // AŞAMA 4: Prompt üretimi
    S.genPhase = 'Yaratıcı prompt yazılıyor...';
    render();
    var result = await callLLM(instruction, imgUrls, sysOver);

    S.promptPool.unshift({
      id: genPromptId(),
      text: result,
      selected: false,
      prodActive: true,
      stratName: '✨ Yaratıcı',
      color: '#9C27B0',
      type: 'image',
      isMagic: true,
      magicCategory: 'Yaratıcı',
      userInput: 'Yaratıcı',
      productName: 'Yaratıcı',
      refThumbs: (S.conceptImgs||[]).map(ci=>ci.url||ci).filter(Boolean).slice(0,3),
      brief: S.conceptBrief||'',
      genSessionId: 'sess-'+Date.now(),
      scores: { prompt_consistency: 0, product_consistency: 0, felt_right: 0 }
    });
    saveDB();
    S.genPhase = '';
    toast('✨ Yaratıcı prompt havuza eklendi!');
  } catch (e) {
    S.genPhase = '';
    alert('Sihirli prompt hatası: ' + e.message);
  }
  S.isGenerating = false;
  render();
}

// ═══ YÖNETMEN MODU — Director Prompt Generation ═══

async function _generateDirectorPrompts(imgUrls, count, artDirectorBrief, learningCtx, projectRefCtx, tasks) {
  var brief = S.conceptBrief || '';

  var productAnchorCtx = '';
  if (artDirectorBrief) {
    if (artDirectorBrief.raw) {
      productAnchorCtx = '\n\n━━━ PRODUCT ANCHOR (from Art Director) ━━━\n' + artDirectorBrief.raw;
    } else {
      productAnchorCtx = '\n\n━━━ PRODUCT ANCHOR (NO COLOR) ━━━' +
        '\n' + (artDirectorBrief.productAnchor || '') +
        (artDirectorBrief.antiAIDetails ? '\nAnti-AI Detail: ' + artDirectorBrief.antiAIDetails : '');
    }
    productAnchorCtx += '\n\nIMPORTANT: Use this physical description for the product. NEVER add color descriptions.';
  }

  var directorCtx = SYS_DIRECTOR + learningCtx + personalCtx + projectRefCtx + productAnchorCtx;
  var dirSessionId = 'sess-'+Date.now();
  var dirRefThumbs = (S.conceptImgs||[]).map(ci=>ci.url||ci).filter(Boolean).slice(0,3);
  var dirBrief = S.conceptBrief||'';

  for (let i = 0; i < count; i++) {
    var varHint = count > 1
      ? `\n\nVariation ${i+1} of ${count}: Keep the brief faithfully. Choose a different emotional intent and a different composition decision. Same concept, different feeling.`
      : '';

    var directorInstruction = `CREATIVE BRIEF:\n"${brief}"\n\nExecute this brief precisely. Translate every element — subject count, staging, location, tone — into production reality. Use {isim} as the product placeholder.\n\nOutput ONLY the prompt paragraph — no titles, no explanations, no quotes.${varHint}`;

    let capturedI = i;
    var p = callLLM(directorInstruction, imgUrls, directorCtx).then(res => {
      S.promptPool.unshift({
        id: genPromptId(),
        text: res,
        selected: false,
        prodActive: true,
        stratName: 'Yönetmen Brief',
        directorBrief: brief,
        color: '#7c3aed',
        type: 'image',
        isDirectorMode: true,
        userInput: brief,
        productName: brief ? brief.split(' ').slice(0,4).join(' ') : ('Yönetmen ' + (capturedI+1)),
        refThumbs: dirRefThumbs,
        brief: dirBrief,
        genSessionId: dirSessionId,
        scores: { prompt_consistency:0, product_consistency:0, felt_right:0 }
      });
      saveDB(); render();
    });
    tasks.push(p);
  }
}

// ═══ SAHNE BRIEF YORUMLAYICI ═══

async function _interpretSceneBrief(brief) {
  try {
    var strategyNames = STRATEGIES.map(function(s){ return s.name; }).join(' | ');
    var msg = 'Scene/concept brief: "' + brief + '"\n\nAvailable strategies: ' + strategyNames + '\n\nAnalyze this scene. Return ONLY the JSON object.';
    var adModel = S.llm === 'claude-opus-4-6' ? 'claude-opus-4-6' : 'claude-sonnet-4-6';
    var raw = await callClaude([{role:'user', content:[{type:'text', text:msg}]}], adModel, SYS_SCENE_INTERPRETER);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch(e) {
    console.warn('Scene interpreter failed:', e.message);
    return null;
  }
}

// ═══ PROMPT ÜRETİMİ ═══

// genPhase artık S.genPhase üzerinden yönetiliyor (state.js)
async function generatePrompts(){
  let imgUrls=S.conceptImgs.map(img=>img.url);
  if(imgUrls.length===0&&!S.conceptBrief.trim())return alert("Bir fikir metni veya referans görsel gerekli.");
  if(S.mode==='video'){await generateVideoPrompts(imgUrls);return;}
  S.isGenerating=true;S.genPhase='Analiz ediliyor...';render();

  try{
    let count=parseInt(S.genCount)||1;let tasks=[];
    var learningCtx=getLearningContext();
    var personalCtx=getPersonalContext();
    var projectRefCtx=getProjectRefContext();

    let artDirectorBrief=null;
    if(imgUrls.length>0||S.conceptBrief.trim().length>0){
      try{
        S.genPhase='Art Director sahneleme yapıyor...';render();
        await new Promise(r=>setTimeout(r,300));
        let adContent=[];
        if(imgUrls.length>0){for(let url of imgUrls){let cs=await urlToClaudeSource(url);if(cs)adContent.push({type:"image",source:cs});}}
        let adUserText=S.conceptBrief
          ?`Product brief: "${S.conceptBrief}"\n\nAnalyze this product (and reference image if provided) as an art director. Return ONLY the JSON object. Remember: productAnchor must have ZERO color words.`
          :'Analyze this product image as an art director. Return ONLY the JSON object. productAnchor must have ZERO color words.';
        adContent.push({type:"text",text:adUserText});
        let adModel=S.llm==='claude-opus-4-6'?'claude-opus-4-6':'claude-sonnet-4-6';
        let rawBrief=await callClaude([{role:"user",content:adContent}],adModel,SYS_ART_DIRECTOR);
        try{
          let cleaned=rawBrief.replace(/```json|```/g,'').trim();
          artDirectorBrief=JSON.parse(cleaned);
        }catch(parseErr){artDirectorBrief={raw:rawBrief};}
      }catch(adErr){console.warn('Art Director atlandı:',adErr.message);}
    }

    // ── Yönetmen Modu ──
    if(S.promptFocus==='director'){
      await _generateDirectorPrompts(imgUrls,count,artDirectorBrief,learningCtx,projectRefCtx,tasks);
      await Promise.all(tasks);S.genPhase='';toast(count+' yönetmen promptu havuza eklendi!');
      S.isGenerating=false;render();return;
    }

    let focusRule='';
    if(S.promptFocus==='scene')focusRule='\n\nATMOSPHERE RULE: Analyze the reference image. Extract its aesthetic, color palette, lighting, and mood for the environment — but still do NOT color-describe the product.';
    else if(S.promptFocus==='free')focusRule='\n\nFREEDOM RULE: You are completely free. Design a unique, creatively bold composition. Still do NOT color-describe the product.';

    let briefContext='';
    if(artDirectorBrief){
      if(artDirectorBrief.raw){
        briefContext='\n\n━━━ ART DIRECTOR BRIEF ━━━\n'+artDirectorBrief.raw;
      }else{
        briefContext='\n\n━━━ ART DIRECTOR BRIEF ━━━'+
          '\nProduct Anchor (NO COLOR): '+(artDirectorBrief.productAnchor||'')+
          '\nLighting Setup: '+(artDirectorBrief.lightingSetup||'')+
          '\nCamera & Lens: '+(artDirectorBrief.lensAndCamera||'')+
          '\nSurface & Context: '+(artDirectorBrief.surfaceAndContext||'')+
          (artDirectorBrief.castingNote?'\nCasting Note: '+artDirectorBrief.castingNote:'')+
          '\nFilm Grade: '+(artDirectorBrief.filmGrade||'')+
          '\nAnti-AI Physicality: '+(artDirectorBrief.antiAIDetails||'')+
          '\nComposition: '+(artDirectorBrief.compositionNote||'');
      }
      briefContext+='\n\nIMPORTANT: Use these technical details as the physical backbone of your prompt. Weave them naturally into your paragraph. Do not list them.';
    }

    // ── Sahne Brief Yorumlayıcı ──
    let sceneInterp=null;
    if(S.conceptBrief&&S.conceptBrief.trim().length>8){
      try{
        S.genPhase='Sahne analiz ediliyor...';render();
        await new Promise(r=>setTimeout(r,150));
        sceneInterp=await _interpretSceneBrief(S.conceptBrief);
      }catch(siErr){console.warn('Scene interp atlandı:',siErr.message);}
    }

    let sceneLaw='';
    // Kullanıcının ham brief'ini koru - her zaman ekle
    let rawBriefContext = S.conceptBrief && S.conceptBrief.trim().length > 0
      ? '\n\n━━━ USER CREATIVE BRIEF — PRESERVE THIS INTENT ━━━\n"' + S.conceptBrief.trim() + '"\n\nThis is the user\'s original creative direction. Honor their emotional intent and specific requests (like "magazine cover", "bold", "editorial", etc). Do NOT replace their creative vision with generic descriptions.'
      : '';
    
    if(sceneInterp&&sceneInterp.sceneDirective){
      sceneLaw=rawBriefContext + '\n\n━━━ SCENE LAW — PHYSICAL REALITY ━━━\n'+
        sceneInterp.sceneDirective+
        (sceneInterp.location?'\nLocation: '+sceneInterp.location:'')+
        (sceneInterp.subject?'\nSubject: '+sceneInterp.subject:'')+
        (sceneInterp.activity?'\nActivity: '+sceneInterp.activity:'')+
        (sceneInterp.lightingImplication?'\nNatural light in scene: '+sceneInterp.lightingImplication:'')+
        '\n\nThe USER CREATIVE BRIEF defines the emotional/creative intent. The SCENE LAW defines physical reality. Both must be respected.';
    } else {
      // Scene interpreter çalışmadıysa sadece user brief'i kullan
      sceneLaw = rawBriefContext;
    }

    S.genPhase='Promptlar yazılıyor...';render();
    var imgSessionId='sess-'+Date.now();
    var imgRefThumbs=(S.conceptImgs||[]).map(ci=>ci.url||ci).filter(Boolean).slice(0,3);
    var imgBrief=S.conceptBrief||'';

    for(let i=0;i<count;i++){
      let stratIdx;
      if(S.activeStrat==='auto'){
        if(sceneInterp&&sceneInterp.suggestedStrategy){
          let matchIdx=STRATEGIES.findIndex(function(s){return s.name===sceneInterp.suggestedStrategy;});
          stratIdx=matchIdx>=0?matchIdx:0;
        }else{
          stratIdx=i%STRATEGIES.length;
        }
      }else{
        stratIdx=parseInt(S.activeStrat);
      }
      let strat=STRATEGIES[stratIdx];
      let sysOver=SYS_PROMPT+learningCtx+personalCtx+projectRefCtx+
        sceneLaw+
        '\n\n━━━ ACTIVE STRATEGY ━━━\n'+strat.name+': '+strat.prompt+
        briefContext;

      let varHint=(count>1&&S.activeStrat!=='auto')
        ?`\n\nVariation ${(i+1)} of ${count}: Choose a meaningfully different INTENT and composition decision. Same product, completely different emotional starting point.`
        :'';

      let isBlankStrat=strat.name==='Boş (Sadece Benim Metnim)';
      let stratInstruction='';
      if(!isBlankStrat){
        stratInstruction=`\n\n━━━ PROMPT ORDER ━━━\nStart with the USER CREATIVE BRIEF\'s emotional intent. Use the ACTIVE STRATEGY only as inspiration for execution style. Write in this order:\n1. INTENT — what feeling does the USER CREATIVE BRIEF describe? One sentence capturing their vision.\n2. COMPOSITION DECISION — the one physical/spatial choice that creates that feeling (inspired by strategy).\n3. PRODUCT INTEGRATION — how {isim} inhabits that composition.\n4. TECHNICAL — minimum words, only what serves the physical feel.\n\nIMPORTANT: The user said: "${S.conceptBrief||'see reference image'}" — this creative intent is PRIMARY. The strategy is secondary execution guidance.`;
      }else{
        stratInstruction=S.conceptBrief?`\n\n━━━ USER DIRECTIVE — PRIMARY SOURCE ━━━\nThe user provided this creative direction: "${S.conceptBrief}"\n\nYOUR TASK: Translate this into a vivid, cinematic English photography prompt. \n- Preserve ALL specific creative requests (like "magazine cover", "editorial", "dramatic", "bold", etc.)\n- Expand on their vision with cinematic detail\n- Do NOT replace their creative intent with generic product photography\n- Make it feel like their exact request, professionally executed`:'';
      }

      let txt=stratInstruction+focusRule+
        '\n\nWrite ONE English photography prompt, 150–220 words. Use {isim} for product name. Output ONLY the prompt paragraph — no titles, no explanations, no quotes.'+varHint;
      let p=callLLM(txt,imgUrls,sysOver).then(res=>{
        S.promptPool.unshift({
          id:genPromptId(),
          text:res,
          selected:false,
          prodActive:true,
          stratName:scenMatched?('Sahne→'+strat.name):strat.name,
          color:strat.color,
          type:'image',
          userInput:imgBrief,
          productName:imgBrief?(imgBrief.split(' ').slice(0,4).join(' ')):('Görsel '+(i+1)),
          refThumbs:imgRefThumbs,
          brief:imgBrief,
          genSessionId:imgSessionId,
          scores:{prompt_consistency:0,product_consistency:0,felt_right:0}
        });
        saveDB();render();
      });
      tasks.push(p);
    }

    await Promise.all(tasks);S.genPhase='';toast(count+' yeni alternatif havuza eklendi!');
  }catch(e){S.genPhase='';alert("Hata: "+e.message);}
  S.isGenerating=false;render();
}

async function generateVideoPrompts(imgUrls){
  if(!S.activeVidStrat){toast('Bir video stratejisi seçin!');S.isGenerating=false;render();return;}
  S.isGenerating=true;render();

  try{
    let strat=VIDEO_STRATEGIES.find(v=>v.id===S.activeVidStrat);
    let count=parseInt(S.genCount)||1;
    let tasks=[];

    // ── AŞAMA 1: Art Director brief ──
    let artDirectorBrief=null;
    if(imgUrls.length>0||S.conceptBrief.trim().length>0){
      try{
        S.genPhase='Video Art Director analiz yapıyor...';render();
        await new Promise(r=>setTimeout(r,200));

        let adContent=[];
        if(imgUrls.length>0){
          for(let url of imgUrls){let cs=await urlToClaudeSource(url);if(cs)adContent.push({type:'image',source:cs});}
        }
        let adText=S.conceptBrief
          ?`Product brief: "${S.conceptBrief}"\n\nAnalyze this product as a video art director. Return ONLY the JSON object. productAnchor must have ZERO color words — describe only form, material, texture, geometry.`
          :'Analyze this product image as a video art director. Return ONLY the JSON object. productAnchor must have ZERO color words.';
        adContent.push({type:'text',text:adText});

        let adModel=S.llm==='claude-opus-4-6'?'claude-opus-4-6':'claude-sonnet-4-6';
        let rawBrief=await callClaude([{role:'user',content:adContent}],adModel,SYS_ART_DIRECTOR);
        try{
          let cleaned=rawBrief.replace(/```json|```/g,'').trim();
          artDirectorBrief=JSON.parse(cleaned);
        }catch(e){artDirectorBrief={raw:rawBrief};}
      }catch(adErr){console.warn('Video Art Director atlandı:',adErr.message);}
    }

    // ── AŞAMA 2: Ürün anchor metni ──
    let productAnchor='';
    if(artDirectorBrief){
      if(artDirectorBrief.raw){
        productAnchor=artDirectorBrief.raw;
      }else{
        productAnchor=
          'PRODUCT ANCHOR (NO COLOR): '+(artDirectorBrief.productAnchor||'')+
          '\nMaterial behavior: '+(artDirectorBrief.lightingSetup||'')+
          '\nSurface context: '+(artDirectorBrief.surfaceAndContext||'')+
          (artDirectorBrief.antiAIDetails?'\nPhysical details: '+artDirectorBrief.antiAIDetails:'');
      }
    }else if(S.conceptBrief){
      productAnchor='Product: '+S.conceptBrief;
    }

    // ── AŞAMA 3: Video prompt'larını yaz ──
    S.genPhase='Video prompt yazılıyor...';render();
    await new Promise(r=>setTimeout(r,150));
    var vidSessionId='sess-'+Date.now();
    var vidRefThumbs=(S.conceptImgs||[]).map(ci=>ci.url||ci).filter(Boolean).slice(0,3);
    var vidBrief=S.conceptBrief||'';

    for(let i=0;i<count;i++){
      let varHint=(count>1)
        ?`\n\nThis is variation ${i+1} of ${count}. Choose a meaningfully different camera angle, starting frame, or motion path than the other variations. Same product, different physical camera reality.`:'';
      let templateFields='';
      let fieldSource=S.videoTemplateFields||{};
      let filledFields=Object.entries(fieldSource).filter(([k,v])=>v&&v.trim());
      if(filledFields.length>0){
        templateFields='\n\nOVERLAY TEXT FIELDS:\n'+
          filledFields.map(([k,v])=>`${k}: "${v}"`).join('\n')+
          '\nEnsure the video composition reserves clean negative space for these text elements.';
      }
      let userTxt=
        `━━━ PRODUCT ANCHOR ━━━\n${productAnchor}`+
        `\n\n━━━ VIDEO STRATEGY ━━━\n${strat.name}: ${strat.prompt}`+
        `\n\n━━━ DURATION ━━━\nTarget: ${S.vidDur} seconds`+
        `\n\n━━━ MODE ━━━\n${S.vidSubMode==='t2v'?'TEXT-TO-VIDEO — no reference image. Build the full world from scratch.':'IMAGE-TO-VIDEO — reference image provided. Product identity is locked in that image. Preserve it exactly.'}`+
        templateFields+varHint+
        '\n\nWrite ONE video prompt paragraph following the 3-layer architecture. Use {isim} for product name. Output ONLY the prompt.';

      var videoLearningCtx=getLearningContext();
      var videoPersonalCtx=getPersonalContext();
      let sysOverride=SYS_VIDEO+videoLearningCtx+videoPersonalCtx;
      let p=callLLM(userTxt,imgUrls,sysOverride).then(res=>{
        S.promptPool.unshift({
          id:genPromptId(),
          text:res,
          selected:false,
          prodActive:true,
          stratName:'Video: '+strat.name,
          color:strat.color,
          type:'video',
          userInput:vidBrief,
          productName:vidBrief?(vidBrief.split(' ').slice(0,4).join(' ')):('Video '+(i+1)),
          refThumbs:vidRefThumbs,
          brief:vidBrief,
          genSessionId:vidSessionId,
          scores:{prompt_consistency:0,product_consistency:0,felt_right:0}
        });
        saveDB();render();
      });
      tasks.push(p);
    }

    await Promise.all(tasks);
    S.genPhase='';
    toast(count+' video promptu havuza eklendi!');

  }catch(e){
    S.genPhase='';
    alert('Video prompt hatası: '+e.message);
  }
  S.isGenerating=false;render();
}

// ── Havuz İşlemleri ──

function toggleProdActive(id){let p=S.promptPool.find(x=>x.id===id);if(p){p.prodActive=p.prodActive===false?true:false;saveDB();render();}}
function updatePromptText(id,newText){let p=S.promptPool.find(x=>x.id===id);if(p)p.text=newText;}
function deletePrompt(id){S.promptPool=S.promptPool.filter(x=>x.id!==id);saveDB();render();}
function togglePromptSelect(id){
  var p=S.promptPool.find(x=>x.id===id);
  if(!p)return;
  p.selected=!p.selected;
  saveDB();
  render();
}

function addManualPrompt(){
  var ta=document.getElementById('manual-prompt-ta');
  var nm=document.getElementById('manual-prompt-name');
  if(!ta||!ta.value.trim())return toast('Prompt alanı boş.');
  var name=(nm&&nm.value.trim())||'Manuel Prompt';
  S.promptPool.unshift({
    id:genPromptId(),
    text:ta.value.trim(),
    selected:false,
    prodActive:true,
    stratName:'Manuel',
    color:'#78909C',
    type:S.mode,
    userInput:'',
    productName:name,
    refThumbs:[],
    brief:'',
    genSessionId:'sess-'+Date.now(),
    scores:{prompt_consistency:0,product_consistency:0,felt_right:0}
  });
  ta.value='';
  if(nm)nm.value='';
  saveDB();render();
  toast('Havuza eklendi.');
}

function addManualPromptToTorba(){
  var ta=document.getElementById('manual-prompt-ta');
  var nm=document.getElementById('manual-prompt-name');
  if(!ta||!ta.value.trim())return toast('Prompt alanı boş.');
  var name=(nm&&nm.value.trim())||'Manuel Prompt';
  S.promptPool.unshift({
    id:genPromptId(),
    text:ta.value.trim(),
    selected:true,
    prodActive:true,
    stratName:'Manuel',
    color:'#78909C',
    type:S.mode,
    userInput:'',
    productName:name,
    refThumbs:[],
    brief:'',
    genSessionId:'sess-'+Date.now(),
    scores:{prompt_consistency:0,product_consistency:0,felt_right:0}
  });
  ta.value='';
  if(nm)nm.value='';
  saveDB();render();
  toast('Torbaya eklendi!');
}

// ═══ REVİZE VE HERMES ═══

function openRevize(idx){S.revizeIdx=idx;S.revizeNote='';S.revizeOpen=true;S.sg=null;render();}

async function runRevize(){
  var idx=S.revizeIdx; var item=S.gallery[idx];
  if(!S.claudeKey&&!S.envClaudeKey) return alert('Claude API Key gerekli!');
  if(!item) return;
  S.revizeRunning=true; render();
  try{
    var note = S.revizeNote.trim();
    var cs = await urlToClaudeSource(item.result);
    if(!cs) throw new Error("Görsel okunamadı.");

    var isLokal = note && (
      note.includes('sadece') || note.includes('yalnızca') ||
      note.includes('arka plan') || note.includes('background') ||
      note.includes('ışık') || note.includes('light') ||
      note.includes('renk') || note.includes('color') ||
      note.includes('kompozisyon') || note.includes('sadece bu')
    );

    var systemMsg = SYS_PROMPT;
    var userMsg;

    if(isLokal && note){
      userMsg = `Bu görsel şu prompt ile üretildi:\n"${item.prompt}"\n\nKULLANICI SADECE ŞU KISMI DEĞİŞTİRMEK İSTİYOR: "${note}"\n\nYapman gereken:\n1. Orijinal promptu koru — ürün, malzeme, kamera açısı, ışık kurulumu DEĞİŞMESİN\n2. Sadece kullanıcının belirttiği kısmı prompt'ta güncelle\n3. Değişikliği doğal olarak mevcut prompt'a dokuyup tek paragraf yaz\n\nSADECE YENİ PROMPT PARAGRAFINI yaz. {isim} kullan. Ürünün rengini yazma.`;
    } else {
      userMsg = `Bu görsel şu prompt ile üretildi:\n"${item.prompt}"\n\n${note ? 'KULLANICI NOTU: '+note : 'Genel hataları düzelt, kompozisyonu güçlendir.'}\n\nÜRÜNÜN DETAYLARINI KORUYARAK düzeltilmiş YENİ İNGİLİZCE PROMPT yaz. SADECE TEK PARAGRAF. {isim} kullan. Ürünün rengini yazma.`;
    }

    var result = await callClaude(
      [{role:"user", content:[{type:"image",source:cs},{type:"text",text:userMsg}]}],
      S.llm, systemMsg
    );

    var bn = S.batch || item.batch || 'Revize';
    var stratLabel = isLokal ? 'Lokal Revize' : 'Global Revize';
    S.queue.push({
      id:'revize_'+Date.now(),
      ref:item.ref,
      prompt:result.replace(/\{isim\}/gi, item.ref.name),
      status:'pending', result:null,
      batch:bn, model:S.mdl,
      stratName:stratLabel,
      vidDur:S.vidDur
    });

    saveDB(true);
    S.revizeOpen=false; S.revizeRunning=false;
    S.tab='queue'; render();
    toast(stratLabel+' kuyruğa eklendi!');
  } catch(e){
    S.revizeRunning=false; render();
    alert('Hata: '+e.message);
  }
}

function openHermes(){S.hermesOpen=true;S.hermesImg=null;S.hermesNote='';S.hermesRunning=false;render();}
function closeHermes(){S.hermesOpen=false;render();}

async function runHermes(){
  if(!S.hermesImg)return toast('Görsel yükleyin!');
  if(!S.claudeKey&&!S.envClaudeKey)return toast('Claude API Key eksik!');
  if(!S.envFalKey&&!S.key)return toast('Fal.ai Key eksik!');
  S.hermesRunning=true;render();
  try{
    toast('Hermes: Art Director analizi yapılıyor...');
    var cs=await urlToClaudeSource(S.hermesImg.url);if(!cs)throw new Error("Görsel okunamadı.");
    let adModel=S.llm==='claude-opus-4-6'?'claude-opus-4-6':'claude-sonnet-4-6';
    let rawBrief=await callClaude([{role:"user",content:[{type:"image",source:cs},{type:"text",text:'Analyze this product image as an art director. Return ONLY the JSON object. productAnchor: ZERO color words for the product.'+(S.hermesNote.trim()?'\nUser direction: '+S.hermesNote:'')}]}],adModel,SYS_ART_DIRECTOR);

    let artBrief=null;
    try {
      artBrief=JSON.parse(rawBrief.replace(/\`\`\`json|\`\`\`/g,'').trim());
    } catch(e) {
      artBrief={raw:rawBrief};
    }

    let briefStr=artBrief&&artBrief.raw?artBrief.raw:(artBrief?Object.entries(artBrief).map(([k,v])=>k+': '+v).join('\n'):'');
    let noteCtx=S.hermesNote.trim()?"\nUser direction: "+S.hermesNote:'';
    let finalPrompt=await callClaude([{role:"user",content:[{type:"image",source:cs},{type:"text",text:`Art Director Brief:\n${briefStr}${noteCtx}\n\nUsing this brief, write ONE English photography prompt for this product. Preserve the exact product from the image. Do NOT describe the product's color. Output ONLY the prompt paragraph (280-400 words). Use {isim} for product name.`}]}],adModel,SYS_PROMPT);
    var bn='Hermes_'+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    S.queue.push({id:'hermes_'+Date.now(),ref:S.hermesImg,prompt:finalPrompt.replace(/\{isim\}/gi,S.hermesImg.name),status:'pending',result:null,batch:bn,model:S.hermesModel,stratName:'Hermes',vidDur:S.vidDur});
    saveDB(true);S.hermesOpen=false;S.hermesRunning=false;S.tab='queue';render();toast('Hermes kuyruğa ekledi!');
  }catch(e){S.hermesRunning=false;render();alert('Hermes Hatası: '+e.message);}
}

async function sendToMagicTool(idx,toolType,modelKey){
  var item=S.gallery[idx];var newPrompt=item.prompt;
  if(toolType==='video'){
    if(!S.claudeKey&&!S.envClaudeKey)return alert("Claude API Key gerekli!");toast("Senaryo yazılıyor...");
    try{newPrompt=await callClaude([{role:"user",content:[{type:"text",text:"Bu prompt ile üretilmiş bir görseli videoya çevireceğiz: '"+item.prompt+"'. Kamera yavaşça yaklaşsın. Kling için tek cümlelik sinematik video promptu yaz."}]}],S.llm,"Sen uzman video prompt mühendisisin.");}catch(e){}
  }
  S.queue.push({id:'magic_'+Date.now(),ref:{url:item.result,name:item.ref.name+'_'+toolType,fromGallery:true},prompt:newPrompt,status:'pending',batch:item.batch,model:modelKey,stratName:toolType.toUpperCase(),vidDur:S.vidDur});
  saveDB(true);S.sg=null;S.tab='queue';render();toast("Kuyruğa eklendi!");
}
