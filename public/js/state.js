// ═══════════════════════════════════════════════════════════════
// STATE.JS — Durum Yönetimi, DB ve Başlangıç
// ═══════════════════════════════════════════════════════════════

var S={
  tab:'hazirla',
  mode:'image',
  mdl:'f2proedit',
  vidMdl:'kling25',
  vidDur:'5',
  key:'',claudeKey:'',llm:'claude-sonnet-4-6',tgToken:'',tgChatId:'',
  favImgModels:['f2proedit','f2devedit','kontext','sdream45','rv4'],
  favVidModels:['kling25','kling26pro','hailuo','veo31fast'],
  conceptImgs:[],conceptBrief:'',masterRefs:[],masterFace:null,imgs:[],
  genCount:3,activeStrat:'auto',activeVidStrat:null,promptPool:[],promptFocus:'product',expandedPrompt:null,
  batch:'',queue:[],gallery:[],sg:null,run:false,isGenerating:false,vidPipeline:false,vidPipelineNote:'',
  totalSpent:0,styleMemory:[],activeStyle:null,galleryView:'folders',activeFolder:null,
  envFalKey:false,envClaudeKey:false,dbStatus:'Yükleniyor...',
  hermesOpen:false,hermesModel:'nano2edit',hermesImg:null,hermesNote:'',hermesRunning:false,
  revizeOpen:false,revizeIdx:null,revizeNote:'',revizeRunning:false,
  
  // ── Yapılandırılmış Revize Sistemi ──
  revizeStructured:{
    active:false,
    imageType:'',        // urun, banner, sosyal, sahne, diger
    selectedArea:'',     // insan, urun, arkaplan, aksesuar, detay, diger
    selectedAreaCustom:'',
    problemType:'',      // anatomik, isik, kompozisyon, stil, kalite, diger
    problemDetail:'',
    desiredOutcome:'',   // sade, gercekci, profesyonel, minimal, diger
    desiredOutcomeCustom:'',
    maskCanvas:null,     // base64 mask data
    maskPreview:null,    // preview url
    generatedPrompt:'',  // template'den üretilen prompt
    useInpainting:true   // sadece alan düzelt
  },
  revizeHistory:[],      // öğrenme için geçmiş kayıtlar
  vidSubMode:'i2v',
   t2vFlow: 'strategy',           // 'strategy' | 'template'
  videoTemplateFields: {},       // aktif field değerleri
  activeVideoTemplate: null,     // seçili şablon adı
  activeVideoTemplatePrompt: '', // şablonun base promptu
 
  templateCat:'Sosyal Medya',
  ffmpegAvailable:null,
  ffmpegVersion:'',
  ffmpegError:'',
  videoStudio:{
    clips:[],format:'reels',transition:'fade',textStyle:'minimal',
    outputName:'',merging:false,mergeResult:null,mergeError:null,activeClipId:null
  },
  learningData:{
    records:[],
    distilled:'',
    lastDistillCount:0
  },
  modelStats:{},
  // ── Yaratıcı Hafıza ──
  projectMemory:[],
  memModal:false,
  activeProjectRef:null,
  briefInterpretation:null,
  briefInterpreting:false,
  prjSaveModal:false,
  prjSaveGalIdx:null,
  magicCategory:'serbest',
  magicOpen:false,
  studioMode:'ref',
  studioVidSubMode:'i2v',
  genPhase:''
};

// ── Auth yardımcıları ──
function authHeaders(){
  var token=localStorage.getItem('hns_token');
  return token?{'Authorization':'Bearer '+token,'Content-Type':'application/json'}:{'Content-Type':'application/json'};
}

async function authFetch(url,opts){
  opts=opts||{};
  opts.headers=Object.assign({},authHeaders(),opts.headers||{});
  var res=await fetch(url,opts);
  if(res.status===401){
    // Token geçersiz - login sayfasına yönlendir
    localStorage.removeItem('hns_token');
    localStorage.removeItem('hns_refresh');
    localStorage.removeItem('hns_user');
    window.location.href='/login.html';
    return res;
  }
  return res;
}

function logout(){
  localStorage.removeItem('hns_token');
  localStorage.removeItem('hns_refresh');
  localStorage.removeItem('hns_user');
  window._hnsUserEmail = '';
  window.location.href='/login.html';
}

// Global erişim için
window.doLogout = logout;

async function initApp(){
  // Kullanıcı bilgisini al
  const userJson = localStorage.getItem('hns_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      window._hnsUserEmail = user.email || '';
    } catch(e) { window._hnsUserEmail = ''; }
  }

  setTimeout(checkFFmpegStatus, 1500);
  S.expandedPrompt=null;
  S.sg=null;S.hermesOpen=false;S.revizeOpen=false;
  S.hermesImg=null;S.hermesNote='';S.revizeNote='';
  S.isGenerating=false;S.run=false;
  try{
    try{const envRes=await fetch('/api/env-status');const envData=await envRes.json();S.envFalKey=envData.hasFalKey;S.envClaudeKey=envData.hasAnthropicKey;}catch(e){}
    const res=await authFetch('/api/load');const db=await res.json();
    if(db.key)S.key=db.key;if(db.claudeKey)S.claudeKey=db.claudeKey;
    if(db.tgToken)S.tgToken=db.tgToken;if(db.tgChatId)S.tgChatId=db.tgChatId;
    if(db.llm)S.llm=db.llm;if(db.mdl&&M[db.mdl])S.mdl=db.mdl;
    if(db.vidMdl&&M[db.vidMdl])S.vidMdl=db.vidMdl;
    if(db.vidDur)S.vidDur=db.vidDur;
    if(db.mode)S.mode=db.mode;
    if(db.t2vMdl)S.t2vMdl=db.t2vMdl;
    if(db.vidSubMode)S.vidSubMode=db.vidSubMode;
    if(db.totalSpent!==undefined)S.totalSpent=db.totalSpent;
    if(db.styleMemory)S.styleMemory=db.styleMemory;if(db.gallery)S.gallery=db.gallery;
    if(db.archive) S.archive = db.archive;
    if(db.promptFocus)S.promptFocus=db.promptFocus;
    if(db.queue)S.queue=db.queue;
    if(db.masterRefs)S.masterRefs=db.masterRefs;else if(db.masterRef)S.masterRefs=[db.masterRef];
    if(db.masterFace)S.masterFace=db.masterFace;if(db.galleryView)S.galleryView=db.galleryView;
    if(db.activeFolder!==undefined)S.activeFolder=db.activeFolder;
    if(db.learningData)S.learningData=db.learningData;
    if(db.modelStats)S.modelStats=db.modelStats;
    if(db.projectMemory)S.projectMemory=db.projectMemory;
    if(db.imgs)S.imgs=db.imgs;
    if(db.conceptImgs)S.conceptImgs=db.conceptImgs;
    if(db.favImgModels&&db.favImgModels.length)S.favImgModels=db.favImgModels;
    if(db.favVidModels&&db.favVidModels.length)S.favVidModels=db.favVidModels;
    if(db.promptPool)S.promptPool=db.promptPool;
    if(db.batch)S.batch=db.batch;
    if(db.conceptBrief)S.conceptBrief=db.conceptBrief;
    if(db.activeStrat!==undefined)S.activeStrat=db.activeStrat;
    if(db.activeVidStrat!==undefined)S.activeVidStrat=db.activeVidStrat;
    S.dbStatus='Aktif';
  }catch(e){S.dbStatus='Bağlantı Hatası';}
  render();
}

let saveTimeout;
function saveDB(immediate=false){
  var active=document.activeElement;var isTyping=active&&(active.tagName==='TEXTAREA'||active.tagName==='INPUT');
  if(!isTyping)S.dbStatus='Kaydediliyor...';
  var indicator=document.querySelector('.hdr-db');if(indicator){indicator.classList.add('syncing');indicator.textContent='Kaydediliyor...';}
  let payload={
    key:S.key,claudeKey:S.claudeKey,llm:S.llm,mdl:S.mdl,vidMdl:S.vidMdl,vidDur:S.vidDur,mode:S.mode,
    tgToken:S.tgToken,tgChatId:S.tgChatId,
    totalSpent:S.totalSpent,styleMemory:S.styleMemory,gallery:S.gallery,promptFocus:S.promptFocus,t2vMdl:S.t2vMdl,vidSubMode:S.vidSubMode,
    queue:S.queue,masterRefs:S.masterRefs,masterFace:S.masterFace,
    galleryView:S.galleryView,activeFolder:S.activeFolder,
    learningData:S.learningData,
    modelStats:S.modelStats,
    projectMemory:S.projectMemory,
    revizeHistory:S.revizeHistory,
    imgs:S.imgs,
    conceptImgs:S.conceptImgs,
    favImgModels:S.favImgModels,favVidModels:S.favVidModels,
    promptPool:S.promptPool.slice(0,50),batch:S.batch,
    conceptBrief:S.conceptBrief,activeStrat:S.activeStrat,activeVidStrat:S.activeVidStrat
  };
  const doSave=async()=>{
    try{await authFetch('/api/save',{method:'POST',body:JSON.stringify(payload)});S.dbStatus='Aktif';}catch(e){S.dbStatus='Hata';}
    var active2=document.activeElement;var isTyping2=active2&&(active2.tagName==='TEXTAREA'||active2.tagName==='INPUT');
    if(!isTyping2)render();else{var ind=document.querySelector('.hdr-db');if(ind){ind.classList.remove('syncing');ind.textContent='Aktif';}}
  };
  clearTimeout(saveTimeout);if(immediate)doSave();else saveTimeout=setTimeout(doSave,2000);
}

setInterval(async()=>{
  if(!localStorage.getItem('hns_token'))return;
  try{
    const res=await authFetch('/api/load');const db=await res.json();
    if(!S.run){
      let changed=false;
      if(db.totalSpent!==undefined&&S.totalSpent!==db.totalSpent){S.totalSpent=db.totalSpent;changed=true;}
      if(db.gallery&&db.gallery.length!==S.gallery.length){S.gallery=db.gallery;changed=true;}
      if(db.queue){
        let pL=S.queue.filter(q=>q.status==='pending').length,pR=db.queue.filter(q=>q.status==='pending').length;
        let dL=S.queue.filter(q=>q.status==='done').length,dR=db.queue.filter(q=>q.status==='done').length;
        if(pL!==pR||dL!==dR||S.queue.length!==db.queue.length){S.queue=db.queue;changed=true;}
      }
      if(changed)render();
    }
  }catch(e){}
},4000);

function addSpent(n){S.totalSpent+=n;saveDB();}