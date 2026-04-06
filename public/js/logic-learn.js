// ═══════════════════════════════════════════════════════════════
// LOGIC-LEARN.JS — Öğrenme Sistemi, Puanlama, Model İstatistikleri
// ═══════════════════════════════════════════════════════════════

// ── Yardımcı: record ortalaması (10 üzerinden)
function _recordAvg(r) {
  var sc = r.scores || {};
  if (sc.tutarlilik || sc.dogallik || sc.yeterlilik)
    return ((sc.tutarlilik||0) + (sc.dogallik||0) + (sc.yeterlilik||0)) / 3;
  if (sc.felt_right > 0) return sc.felt_right * 2;
  return 0;
}

// ── Gallery skoru → learningData köprüsü
function _bridgeGalleryScoreToLearning(item) {
  if (!item || !item.scores) return;
  var sc = item.scores;
  if (!sc.tutarlilik && !sc.dogallik && !sc.yeterlilik) return;
  if (!S.learningData) S.learningData = { records:[], distilled:'', lastDistillCount:0 };

  var gid = item.id || ('gal_' + (item.ref ? item.ref.name : '') + '_' + (item.batch||''));
  var existIdx = S.learningData.records.findIndex(r => r.galleryId === gid);
  var record = {
    id: existIdx >= 0 ? S.learningData.records[existIdx].id : 'lr_' + Date.now(),
    galleryId: gid,
    userInput: item.ref ? item.ref.name : '',
    stratName: item.strat || 'Manuel',
    directorBrief: item.directorBrief || null,
    isDirectorMode: !!(item.isDirectorMode || item.strat === 'Yönetmen Brief'),
    model: item.model || '',
    scores: {
      tutarlilik: sc.tutarlilik||0,
      dogallik:   sc.dogallik||0,
      yeterlilik: sc.yeterlilik||0,
      felt_right: ((sc.tutarlilik||0)+(sc.dogallik||0)+(sc.yeterlilik||0))/3*0.5
    },
    ts: Date.now()
  };

  if (existIdx >= 0) S.learningData.records[existIdx] = record;
  else S.learningData.records.unshift(record);
  if (S.learningData.records.length > 60)
    S.learningData.records = S.learningData.records.slice(0, 60);

  var scored = S.learningData.records.filter(r => _recordAvg(r) > 0);
  if (scored.length > 0 && scored.length % 5 === 0 && scored.length !== S.learningData.lastDistillCount) {
    S.learningData.lastDistillCount = scored.length;
    _distillLearning(scored);
  }
}

function saveLearnRecord(promptId, scores){
  var p=S.promptPool.find(x=>x.id===promptId);
  if(!p)return;
  if(!S.learningData)S.learningData={records:[],distilled:'',lastDistillCount:0};

  var existing=S.learningData.records.find(r=>r.promptId===promptId);
  if(existing){
    existing.scores=scores;
    existing.ts=Date.now();
  }else{
    S.learningData.records.unshift({
      id:'lr_'+Date.now(),
      promptId:promptId,
      userInput:S.conceptBrief||'',
      stratName:p.stratName||'',
      scores:scores,
      model:S.mdl,
      ts:Date.now()
    });
    if(S.learningData.records.length>60)S.learningData.records=S.learningData.records.slice(0,60);
  }

  var scored=S.learningData.records.filter(r=>r.scores&&(r.scores.felt_right>0));
  if(scored.length>0&&scored.length%5===0&&scored.length!==S.learningData.lastDistillCount){
    S.learningData.lastDistillCount=scored.length;
    _distillLearning(scored);
  }
  saveDB();
  render();
  toast('Öğrenildi!');
}

async function _distillLearning(records) {
  if (!S.claudeKey && !S.envClaudeKey) return;
  try {
    var byStrat = {};
    records.forEach(r => {
      var k = r.stratName || 'Manuel';
      if (!byStrat[k]) byStrat[k] = { total:0, count:0 };
      byStrat[k].total += _recordAvg(r);
      byStrat[k].count++;
    });
    var stratSummary = Object.entries(byStrat)
      .map(([k,v]) => `${k}: ${(v.total/v.count).toFixed(1)}/10 (${v.count} üretim)`)
      .join(', ');

    var high = records.filter(r => _recordAvg(r) >= 7).slice(0,8)
      .map(r => `[${_recordAvg(r).toFixed(1)}] ${r.stratName||'Manuel'} | ${r.model||''} | T:${r.scores.tutarlilik||0} D:${r.scores.dogallik||0} Y:${r.scores.yeterlilik||0}` + (r.userInput?` | Ürün: "${r.userInput.substring(0,60)}"` : '') + (r.notes?` | Not: "${r.notes.substring(0,60)}"` : ''))
      .join('\n');
    var low = records.filter(r => _recordAvg(r) < 4 && _recordAvg(r) > 0).slice(0,5)
      .map(r => `[${_recordAvg(r).toFixed(1)}] ${r.stratName||'Manuel'} | ${r.model||''}` + (r.notes?` | Not: "${r.notes.substring(0,60)}"` : ''))
      .join('\n');

    var directorRecords = records.filter(r => r.stratName === 'Yönetmen Brief' || r.isDirectorMode);
    var directorHighBriefs = directorRecords.filter(r => _recordAvg(r) >= 7).slice(0,5)
      .map(r => `[${_recordAvg(r).toFixed(1)}] Brief: "${(r.directorBrief||r.userInput||'').substring(0,80)}"` + (r.notes?` | Not: "${r.notes.substring(0,60)}"` : ''))
      .join('\n');
    var directorLowBriefs = directorRecords.filter(r => _recordAvg(r) < 4 && _recordAvg(r) > 0).slice(0,3)
      .map(r => `[${_recordAvg(r).toFixed(1)}] Brief: "${(r.directorBrief||r.userInput||'').substring(0,60)}"`)
      .join('\n');

    var res = await fetch('/api/claude', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        apiKey: S.claudeKey,
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'Sen bir AI görsel üretim sistemi için pattern analisti yapay zekasın. Kullanıcının üretim sonuçlarını analiz edip öğrenme özetleri çıkarıyorsun. Türkçe yaz. Kısa ve spesifik ol — genel tavsiyeler değil, bu kullanıcının spesifik patternleri.',
        messages: [{ role:'user', content:
          `Strateji performansı: ${stratSummary}\n\nYÜKSEK SKOR — Strateji Şablonları (≥7/10):\n${high||'Henüz yok'}\n\nDÜŞÜK SKOR — Strateji Şablonları (<4/10):\n${low||'Henüz yok'}`+
          (directorHighBriefs?`\n\nYÜKSEK SKOR — Yönetmen Brief'leri:\n${directorHighBriefs}`:'') +
          (directorLowBriefs?`\n\nDÜŞÜK SKOR — Yönetmen Brief'leri:\n${directorLowBriefs}`:'') +
          `\n\nAnaliz et:\n1. Hangi stratejiler/brief tipleri tutarlı yüksek skor alıyor?\n2. Yüksek skorlu promptlarda hangi teknik özellikler tekrar ediyor? (ışık, açı, malzeme, sahne, kişi sayısı/formasyon)\n3. Yönetmen brief'lerinde hangi sahne unsurları iyi sonuç veriyor? (stüdyo/outdoor, grup/solo, aksiyon/statik)\n4. Düşük Doğallık skorunun sebebi ne olabilir?\n5. Gelecek üretimlerde ne vurgulanmalı, ne kaçınılmalı?\n\nMaksimum 220 kelime. Madde madde yaz.`
        }]
      })
    });
    var data = await res.json();
    if (data.text) {
      S.learningData.distilled = data.text.trim();
      S.learningData.patterns = {
        highScoreStrategies: Object.entries(byStrat).filter(([,v])=>v.count>0&&(v.total/v.count)>=7).map(([k])=>k),
        avoidStrategies:     Object.entries(byStrat).filter(([,v])=>v.count>0&&(v.total/v.count)<4).map(([k])=>k),
        totalScored: records.length,
        lastUpdated: Date.now()
      };
      saveDB();
    }
  } catch(e) { console.warn('Distill başarısız:', e.message); }
}

// ── Kişisel Bağlam: journal profili → prompt sistemine ──
function getPersonalContext() {
  var journal = S.journal;
  if (!journal || !journal.profile || !journal.profile.trim()) return '';
  return '\n\n━━━ KİŞİSEL YARATICI PROFİL ━━━\n' +
    journal.profile.trim() +
    '\nBu kişinin iç dünyasını ve sembolik dilini sessizce uygula — açıklama yapma, ama bu bağlamı prompt kalitesine yansıt.';
}

function getLearningContext() {
  if (!S.learningData || !S.learningData.distilled) return '';
  var p = S.learningData.patterns || {};
  var hint = '';
  if (p.highScoreStrategies && p.highScoreStrategies.length)
    hint += '\nYüksek performanslı stratejiler: ' + p.highScoreStrategies.join(', ');
  if (p.avoidStrategies && p.avoidStrategies.length)
    hint += '\nDüşük performanslı stratejiler (tercih etme): ' + p.avoidStrategies.join(', ');
  return '\n\n━━━ KULLANICIDAN ÖĞRENİLEN TERCİHLER ━━━\n' +
    S.learningData.distilled + hint +
    '\nBu tercihleri prompt yazarken sessizce uygula — açıklama yapma.';
}

// ═══ SKORLAMA VE GALERİ ÖĞRENİMİ ═══

function setScore(gi,type,val){
  if(!S.gallery[gi].scores)S.gallery[gi].scores={tutarlilik:0,dogallik:0,yeterlilik:0};
  S.gallery[gi].scores[type]=val;
  recordModelScore(S.gallery[gi].model,S.gallery[gi].scores);
  saveDB();render();
}

function handleScoreClick(e){var bar=e.target.closest('.score-bar');if(!bar)return;var gi=parseInt(bar.dataset.gi);var type=bar.dataset.type;var r=bar.getBoundingClientRect();var x=Math.round(((e.clientX-r.left)/r.width)*10);setScore(gi,type,Math.max(1,Math.min(10,x)));}

function addGalleryNote(gi, text){
  text=(text||'').trim();if(!text)return;
  var it=S.gallery[gi];if(!it)return;
  if(!it.notes)it.notes=[];
  it.notes.push({ts:Date.now(),text:text});

  if(!S.learningData)S.learningData={records:[],distilled:'',lastDistillCount:0};
  var sc=it.scores||{};
  var avgScore=((sc.tutarlilik||0)+(sc.dogallik||0)+(sc.yeterlilik||0))/3;
  var allNotes=it.notes.map(n=>n.text).join(' | ');
  var existingRec=S.learningData.records.find(r=>r.galleryId===it.id);
  if(existingRec){
    existingRec.notes=allNotes;
    existingRec.scores={tutarlilik:sc.tutarlilik||0,dogallik:sc.dogallik||0,yeterlilik:sc.yeterlilik||0,felt_right:avgScore*2};
    existingRec.ts=Date.now();
  }else{
    S.learningData.records.unshift({
      id:'lr_'+Date.now(),
      galleryId:it.id,
      userInput:it.ref?it.ref.name:'',
      stratName:it.strat||'',
      model:it.model||'',
      notes:allNotes,
      scores:{tutarlilik:sc.tutarlilik||0,dogallik:sc.dogallik||0,yeterlilik:sc.yeterlilik||0,felt_right:avgScore*2},
      ts:Date.now()
    });
    if(S.learningData.records.length>60)S.learningData.records=S.learningData.records.slice(0,60);
  }

  var noteCount=S.learningData.records.filter(r=>r.notes&&r.notes.length>0).length;
  if(noteCount>0&&noteCount%5===0&&noteCount!==S.learningData.lastDistillCount){
    S.learningData.lastDistillCount=noteCount;
    _distillLearning(S.learningData.records);
  }
  saveDB();render();toast('Not eklendi!');
}

function learnFromGallery(){
  var scored=S.gallery.filter(g=>g.scores&&(g.scores.realism>0||g.scores.sales>0));if(scored.length<3){toast("En az 3 görsel skorlamalısın.");return;}
  var best=scored.filter(g=>g.scores.sales>=7&&g.scores.realism>=6&&g.scores.aiSmell<=4);if(!best.length){toast("Yüksek skorlu görsel yok.");return;}
  var styleName=prompt("Stil ismi (ör: Natural_Linen):");if(!styleName)return;
  S.styleMemory.push({id:Date.now().toString(),name:styleName,desc:'Avg Realism: '+(best.reduce((a,b)=>a+b.scores.realism,0)/best.length).toFixed(1),samplePrompts:best.slice(0,3).map(b=>b.prompt).join(' | '),count:best.length});
  saveDB();toast('Stil hafızada!');render();
}

function setPromptScore(promptId, criterion, val){
  var p=S.promptPool.find(x=>x.id===promptId);
  if(!p)return;
  if(!p.scores)p.scores={prompt_consistency:0,product_consistency:0,felt_right:0};
  p.scores[criterion]=val;
  render();
}

function savePromptScores(promptId){
  var p=S.promptPool.find(x=>x.id===promptId);
  if(!p||!p.scores)return;
  var s=p.scores;
  if(s.prompt_consistency>0||s.product_consistency>0||s.felt_right>0){
    saveLearnRecord(promptId,s);
  }
}

// ═══ MODEL İSTATİSTİKLERİ ═══

function _updateModelStats(modelKey, duration){
  if(!modelKey||!duration)return;
  if(!S.modelStats)S.modelStats={};
  if(!S.modelStats[modelKey])S.modelStats[modelKey]={count:0,totalDuration:0,totalScore:0,scoredCount:0};
  var ms=S.modelStats[modelKey];
  ms.count++;
  ms.totalDuration+=duration;
}

function recordModelScore(modelKey, scores){
  if(!modelKey||!scores)return;
  if(!S.modelStats)S.modelStats={};
  if(!S.modelStats[modelKey])S.modelStats[modelKey]={count:0,totalDuration:0,totalScore:0,scoredCount:0};
  var ms=S.modelStats[modelKey];
  var avg=((scores.tutarlilik||0)+(scores.dogallik||0)+(scores.yeterlilik||0))/3;
  if(avg>0){ms.totalScore+=avg;ms.scoredCount++;}
}

function getModelAvgDuration(modelKey){
  if(!S.modelStats||!S.modelStats[modelKey])return null;
  var ms=S.modelStats[modelKey];
  return ms.count>0?Math.round(ms.totalDuration/ms.count):null;
}

function getModelAvgScore(modelKey){
  if(!S.modelStats||!S.modelStats[modelKey])return null;
  var ms=S.modelStats[modelKey];
  return ms.scoredCount>0?(ms.totalScore/ms.scoredCount).toFixed(1):null;
}
