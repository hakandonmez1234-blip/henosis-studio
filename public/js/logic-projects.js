// ═══════════════════════════════════════════════════════════════
// LOGIC-PROJECTS.JS — Yaratıcı Hafıza, Proje Kayıt, Brief Yorumlama
// ═══════════════════════════════════════════════════════════════

// Aktif proje referansını prompt context'e çevir
function getProjectRefContext() {
  if (!S.activeProjectRef) return '';
  var prj = S.activeProjectRef;
  var ctx = '\n\n━━━ YARATICI HAFIZA — AKTİF PROJE REFERANSİ ━━━';
  ctx += '\nReferans Proje: ' + prj.title;
  if (prj.client) ctx += ' | Müşteri: ' + prj.client;
  if (prj.semanticSummary) ctx += '\nYönetmenlik Özeti: ' + prj.semanticSummary;
  if (prj.tags && prj.tags.length) ctx += '\nAnahtar Kavramlar: ' + prj.tags.join(', ');
  if (prj.promptSamples && prj.promptSamples.length) {
    ctx += '\nBaşarılı Prompt Örneği: "' + prj.promptSamples[0].substring(0, 200) + '..."';
  }
  if (prj.interpretation) ctx += '\nKişisel Brief Yorumu: ' + prj.interpretation;
  ctx += '\n\nBu projenin görsel dilini ve başarılı teknik kararlarını yeni üretimde referans al. Birebir kopyalama — yeni ürün için uyarla.';
  return ctx;
}

async function saveProject(title, client, note, galIdx) {
  if (!title || !title.trim()) { toast('Proje başlığı gerekli!'); return; }
  var it = (galIdx !== null && galIdx !== undefined) ? S.gallery[galIdx] : null;
  var prj = {
    id: 'prj_' + Date.now(),
    createdAt: Date.now(),
    title: title.trim(),
    client: client.trim(),
    userNote: note.trim(),
    tags: [],
    semanticSummary: '',
    rawConcept: S.conceptBrief || (it ? (it.prompt || '') : ''),
    strategy: it ? (it.strat || '') : (typeof STRATEGIES !== 'undefined' && S.activeStrat !== 'auto' ? (STRATEGIES[parseInt(S.activeStrat)] || {}).name || '' : ''),
    model: it ? it.model : S.mdl,
    avgScore: it ? (() => { var sc=it.scores||{}; return (sc.tutarlilik||0)+(sc.dogallik||0)+(sc.yeterlilik||0)>0 ? ((sc.tutarlilik||0)+(sc.dogallik||0)+(sc.yeterlilik||0))/3 : 0; })() : 0,
    promptSamples: it ? [it.prompt || ''] : (S.promptPool.filter(p=>p.selected).map(p=>p.text).slice(0,2)),
    imageUrl: it ? it.result : null,
    savedAt: Date.now()
  };

  if (S.claudeKey || S.envClaudeKey) {
    try {
      var tagInput = 'Proje başlığı: ' + prj.title +
        '\nMüşteri/Sektör: ' + (prj.client || 'belirtilmedi') +
        '\nKonsept: ' + (prj.rawConcept || 'yok') +
        '\nStrateji: ' + (prj.strategy || 'yok') +
        '\nNot: ' + (prj.userNote || 'yok') +
        (prj.promptSamples[0] ? '\nPrompt örneği: "' + prj.promptSamples[0].substring(0, 200) + '"' : '');
      var tagRes = await callLLM(tagInput, [], SYS_MEMORY_TAGGER);
      var parsed = JSON.parse(tagRes.replace(/```json|```/g, '').trim());
      prj.tags = parsed.tags || [];
      prj.semanticSummary = parsed.semanticSummary || '';
    } catch(e) { /* tag üretimi opsiyonel */ }
  }

  if (!S.projectMemory) S.projectMemory = [];
  S.projectMemory.unshift(prj);
  if (S.projectMemory.length > 200) S.projectMemory = S.projectMemory.slice(0, 200);
  S.prjSaveModal = false;
  S.prjSaveGalIdx = null;
  saveDB();
  render();
  toast('Proje kaydedildi: ' + prj.title);
}

var _memSearchTimer = null;
function triggerMemorySearch(query) {
  clearTimeout(_memSearchTimer);
  if (!query || query.length < 8) {
    S.briefInterpretation = null;
    // render() kaldırıldı - focus kaybını önlemek için
    return;
  }
  _memSearchTimer = setTimeout(() => _runMemoryPipeline(query), 700);
}

async function _runMemoryPipeline(query) {
  if (!S.claudeKey && !S.envClaudeKey) return;
  var tasks = [];

  if (S.projectMemory && S.projectMemory.length > 0) {
    tasks.push(_searchProjectMemory(query));
  }

  var isPersonal = query.length < 80 || /\b(gibiydi|sanki|gibi|hissettiriyor|sezgisel|kız|çocuk|adam|kadın|erkek|tuhaf|güzel|üzgün|karanlık|ışıklı|neşeli|saçlar|gözler|eller)\b/i.test(query);
  if (isPersonal) {
    tasks.push(_interpretBrief(query));
  }

  await Promise.all(tasks);
  render();
}

async function _searchProjectMemory(query) {
  try {
    var archive = S.projectMemory.slice(0, 30).map(p =>
      'ID:' + p.id + ' | "' + p.title + '" | Müşteri:' + (p.client || '-') +
      ' | Etiketler:' + (p.tags || []).join(',') +
      ' | Özet:' + (p.semanticSummary || p.rawConcept || '').substring(0, 100)
    ).join('\n');

    var res = await callLLM(
      'Kullanıcı brief\'i: "' + query + '"\n\nProje arşivi:\n' + archive +
      '\n\nEn uygun eşleşmeyi bul. Eşleşme belirsiz veya yoksa match:null döndür.',
      [], SYS_MEMORY_SEARCHER
    );
    var parsed = JSON.parse(res.replace(/```json|```/g, '').trim());
    if (parsed.match && parsed.confidence >= 0.5) {
      var found = S.projectMemory.find(p => p.id === parsed.match);
      if (found) {
        S.briefInterpretation = Object.assign(S.briefInterpretation || {}, {
          type: 'memory_match',
          projectId: parsed.match,
          projectTitle: found.title,
          reason: parsed.reason,
          confidence: parsed.confidence
        });
      }
    }
  } catch(e) {}
}

async function _interpretBrief(text) {
  if (S.briefInterpreting) return;
  S.briefInterpreting = true;
  try {
    // Kişisel profil varsa SYS_PERSONAL_CONTEXT'e ekle
    var profile = (S.journal && S.journal.profile) ? S.journal.profile.trim() : '';
    var sysCtx = SYS_PERSONAL_CONTEXT +
      (profile ? '\n\n━━━ THIS USER\'S PERSONAL PROFILE ━━━\n' + profile : '');

    var userMsg = profile
      ? 'PERSONAL PROFILE:\n' + profile + '\n\nUSER TEXT: "' + text + '"\n\nTranslate to visual directive using their symbolic language.'
      : 'User wrote: "' + text + '"\n\nTranslate to visual directive.';

    var res = await callLLM(userMsg, [], sysCtx);
    if (res && res.trim()) {
      S.briefInterpretation = Object.assign(S.briefInterpretation || {}, {
        interpretation: res.trim()
      });
    }
  } catch(e) {}
  S.briefInterpreting = false;
}

function applyProjectRef(projectId) {
  var prj = S.projectMemory.find(p => p.id === projectId);
  if (!prj) return;
  if (S.briefInterpretation && S.briefInterpretation.interpretation) {
    prj = Object.assign({}, prj, { interpretation: S.briefInterpretation.interpretation });
  }
  S.activeProjectRef = prj;
  S.briefInterpretation = null;
  toast('Proje referansı aktif: ' + prj.title);
  render();
}

function clearProjectRef() {
  S.activeProjectRef = null;
  render();
}

function applyInterpretationOnly() {
  if (!S.briefInterpretation || !S.briefInterpretation.interpretation) return;
  S.activeProjectRef = {
    id: 'interp_' + Date.now(),
    title: 'Kişisel Brief Yorumu',
    interpretation: S.briefInterpretation.interpretation,
    tags: [],
    semanticSummary: ''
  };
  S.briefInterpretation = null;
  toast('Brief yorumu uygulandı');
  render();
}

function openProjectSaveModal(galIdx) {
  S.prjSaveModal = true;
  S.prjSaveGalIdx = galIdx !== undefined ? galIdx : null;
  render();
  setTimeout(() => { var el = document.getElementById('prj-title-inp'); if (el) el.focus(); }, 80);
}
