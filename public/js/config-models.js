// ═══════════════════════════════════════════════════════════════
// CONFIG-MODELS.JS — Model Tanımları, Stratejiler, Video Şablonları
// ═══════════════════════════════════════════════════════════════

var M={
  // FLUX 2 Family - Black Forest Labs [citation:1][citation:7]
  f2pro:      {n:'Flux 2 Pro',            p:'$0.03/MP',     pn:.03,  ep:'fal-ai/flux-2-pro',                                   cat:'Flux 2', t:'flux2',    desc:'En yeni FLUX 2 sürümü. Yüksek kaliteli metin→görsel ve çoklu referans düzenleme.'},
  f2proedit:  {n:'Flux 2 Pro Edit',       p:'$0.03/MP',     pn:.03,  ep:'fal-ai/flux-2-pro/edit',                               cat:'Flux 2', t:'flux2',    desc:'FLUX 2 Pro ile görsel düzenleme. 8\'e kadar referans görsel desteği.'},
  f2flex:     {n:'Flux 2 Flex',           p:'$0.06/MP',     pn:.06,  ep:'fal-ai/flux-2-flex',                                   cat:'Flux 2', t:'flux2',    desc:'Esnek parametre kontrolü. Tipografi ve detay korumasında en iyisi.'},
  f2flexedit: {n:'Flux 2 Flex Edit',      p:'$0.06/MP',     pn:.06,  ep:'fal-ai/flux-2-flex/edit',                               cat:'Flux 2', t:'flux2',    desc:'Flex modeli ile düzenleme. Hassas renk ve detay kontrolü.'},
  f2turbo:    {n:'Flux 2 Turbo',          p:'$0.008/MP',    pn:.008, ep:'fal-ai/flux-2-turbo',                                 cat:'Flux 2', t:'flux2',    desc:'Hızlı ve ucuz. Prototip ve yüksek hacimli üretimler için.'},
  f2max:      {n:'Flux 2 Max',            p:'$0.07/MP',     pn:.07,  ep:'fal-ai/flux-2-max',                                     cat:'Flux 2', t:'flux2',    desc:'En yüksek kalite. Web\'den bilgi çekme ve çoklu referans desteği.'},

  // Flux Kontext Family [citation:4]
  kontext:    {n:'Flux Kontext Pro',      p:'$0.04/görsel', pn:.04,  ep:'fal-ai/flux-kontext-pro',                               cat:'Kontext', t:'kontext', desc:'Ürün korumalı arkaplan değiştirme. Metin ve logo koruma.'},
  ktxmax:     {n:'Flux Kontext Max',      p:'$0.08/görsel', pn:.08,  ep:'fal-ai/flux-kontext-max',                               cat:'Kontext', t:'kontext', desc:'Maksimum kalite Kontext. Hassas kontrol ve sahne tutarlılığı.'},

  // Flux 1.1 Family [citation:7]
  fpro:       {n:'Flux 1.1 Pro',          p:'$0.04/görsel', pn:.04,  ep:'fal-ai/flux-pro/v1.1',                                  cat:'Flux 1', t:'flux',     desc:'Genel amaçlı dengeli model. Hız-kalite dengesi iyi.'},
  fpro11ultra:{n:'Flux 1.1 Pro Ultra',    p:'$0.06/görsel', pn:.06,  ep:'fal-ai/flux-pro/v1.1-ultra',                            cat:'Flux 1', t:'flux',     desc:'Ultra yüksek çözünürlük. Geniş formatlar için.'},
  fdev:       {n:'Flux 1 Dev',            p:'$0.025/görsel',pn:.025, ep:'fal-ai/flux/dev',                                       cat:'Flux 1', t:'flux',     desc:'Metin tabanlı yaratıcı üretim. Referans görselsiz çalışır.'},

  // Nano Banana / Gemini Family [citation:2][citation:8]
  nano2:      {n:'Nano Banana 2',         p:'$0.08/görsel', pn:.08,  ep:'fal-ai/nano-banana-2',                                  cat:'Gemini', t:'nano',     desc:'Gemini 3.1 Flash Image. 5 kişiye kadar karakter tutarlılığı.'},
  nano2edit:  {n:'Nano Banana 2 Edit',    p:'$0.08/görsel', pn:.08,  ep:'fal-ai/nano-banana-2/edit',                             cat:'Gemini', t:'nano',     desc:'Doğal dil ile görsel düzenleme. 14\'e kadar referans.'},
  nanopro:    {n:'Nano Banana Pro',       p:'$0.15/görsel', pn:.15,  ep:'fal-ai/nano-banana-pro',                                cat:'Gemini', t:'nano',     desc:'Gemini 3 Pro Image. Reasoning ile kompozisyon planlama.'},
  nanoproedit:{n:'Nano Banana Pro Edit',  p:'$0.15/görsel', pn:.15,  ep:'fal-ai/nano-banana-pro/edit',                           cat:'Gemini', t:'nano',     desc:'Pro model ile doğal dil düzenleme. 4K desteği.'},

  // Seedream Family [citation:2][citation:3][citation:9]
  sdream45:   {n:'Seedream 4.5',          p:'$0.04/görsel', pn:.04,  ep:'fal-ai/bytedance/seedream/v4.5/text-to-image',          cat:'Seedream', t:'seedream',desc:'Tek mimaride üretim+düzenleme. 4MP çözünürlük.'},
  sdream45e:  {n:'Seedream 4.5 Edit',     p:'$0.04/görsel', pn:.04,  ep:'fal-ai/bytedance/seedream/v4.5/edit',                  cat:'Seedream', t:'seedream',desc:'10\'a kadar referans ile düzenleme. Metin okuma güçlü.'},
  sdream50:   {n:'Seedream 5.0 Lite',     p:'$0.035/görsel',pn:.035, ep:'fal-ai/bytedance/seedream/v5.0-lite/text-to-image',    cat:'Seedream', t:'seedream',desc:'En güncel Seedream. 9MP çözünürlük, hızlı üretim.'},

  // Recraft [citation:4]
  rv4:        {n:'Recraft V4',            p:'$0.04/görsel', pn:.04,  ep:'fal-ai/recraft-v4',                                     cat:'Recraft', t:'recraft', desc:'Vektörel estetik. Logo ve ikon odaklı üretimler için.'},

  // Video Models - Image to Video [citation:5]
  kling3pro:  {n:'Kling 3.0 Pro I2V',     p:'$0.50/5sn',    pn:.50,  ep:'fal-ai/kling-video/v3/pro/image-to-video',              t:'video', durFmt:'num',  durOpts:['5','10'], desc:'En güncel Kling. Üst düzey kamera kontrolü, 3-15sn.'},
  kling26pro: {n:'Kling 2.6 Pro I2V',     p:'$0.35/5sn',    pn:.35,  ep:'fal-ai/kling-video/v2.6/pro/image-to-video',            t:'video', durFmt:'num',  durOpts:['5','10'], desc:'Gelişmiş hareket fiziği. Reklam filmi kalitesi.'},

  // Eski, hatalı tanımı KALDIR veya YORUMLA
// sdance20i:   {n:'Seedance 2.0 Fast I2V', p:'$0.62/5sn', pn:.62, ep:'fal-ai/bytedance/seedance-2.0/fast/image-to-video', t:'video', durFmt:'str', durOpts:['5','10'], desc:'ByteDance'ın en gelişmiş motoru...'},

// Yeni, çalışan tanımları EKLE:
sdance20:    {n:'Seedance 2.0',            p:'$0.05/5sn',    pn:.05,  ep:'fal-ai/seedance-2',                                    t:'video', subtype:'i2v', durFmt:'num',  durOpts:['5','10'], desc:'Görselden videoya dönüşüm. Yüksek kalite, 10 saniyeye kadar video.'},
sdance20t:   {n:'Seedance 2.0 T2V',        p:'$0.05/5sn',    pn:.05,  ep:'fal-ai/seedance-2',                                    t:'video', subtype:'t2v', durFmt:'num',  durOpts:['5','10'], desc:'Metinden videoya üretim. Prompt ile doğrudan video oluşturur.'},
  sdance15i:  {n:'Seedance 1.5 Pro I2V',  p:'$0.26/5sn',    pn:.26,  ep:'fal-ai/bytedance/seedance/v1.5/pro/image-to-video',     t:'video', durFmt:'str', durOpts:['5','10'], desc:'Başlangıç+bitiş karesi. Fiyat-kalite dengesi en yüksek.'},
  sdance10i:  {n:'Seedance 1.0 Pro I2V',  p:'$0.62/5sn',    pn:.62,  ep:'fal-ai/bytedance/seedance/v1/pro/image-to-video',       t:'video', durFmt:'str', durOpts:['5','10'], desc:'1080p stabil dönüşüm. Güvenilir günlük iş modeli.'},
  sdance10l:  {n:'Seedance 1.0 Lite I2V', p:'$0.08/5sn',    pn:.08,  ep:'fal-ai/bytedance/seedance/v1/lite/image-to-video',      t:'video', durFmt:'str', durOpts:['5','10'], desc:'En ucuz Seedance. 720p, hızlı prototip için.'},

  hailuo:     {n:'Hailuo 02 Standard',    p:'$0.27/6sn',    pn:.27,  ep:'fal-ai/minimax/hailuo-02/standard/image-to-video',      t:'video', durFmt:'sec',  durOpts:['6','10'], desc:'Uygun fiyatlı. Lifestyle ürün videoları için.'},
  hailuopro:  {n:'Hailuo 02 Pro',         p:'$0.48/6sn',    pn:.48,  ep:'fal-ai/minimax/hailuo-02/pro/image-to-video',           t:'video', durFmt:'sec',  durOpts:['6','10'], desc:'Akıcı kamera hareketleri, gelişmiş sahne fiziği.'},

  minimax:    {n:'Minimax Video 01',      p:'$0.50/vid',    pn:.50,  ep:'fal-ai/minimax/video-01/image-to-video',                t:'video', durFmt:'none', durOpts:[],         desc:'Güçlü karakter hareketi. Yaratıcı reklam konseptleri.'},

  veo3:       {n:'Veo 3 I2V',             p:'$1.00/5sn',    pn:1.00, ep:'fal-ai/veo3/image-to-video',                            t:'video', durFmt:'str',  durOpts:['4','6','8'], desc:'Google amiral gemisi. Sinematik kalite, ses desteği.'},
  veo31fast:  {n:'Veo 3.1 Fast I2V',      p:'$0.50/5sn',    pn:.50,  ep:'fal-ai/veo3.1/fast/image-to-video',                      t:'video', durFmt:'str',  durOpts:['4','6','8'], desc:'Veo kalitesi daha hızlı. Hızlı iterasyon için.'},

  sora2:      {n:'Sora 2',               p:'$1.50/5sn',    pn:1.50, ep:'fal-ai/sora-2/image-to-video',                           t:'video', durFmt:'num',  durOpts:['5','10'], desc:'OpenAI en güçlü. Fiziksel gerçekçilik, premium seçim.'},

  wan22:      {n:'Wan 2.2 I2V',          p:'$0.10/sn',     pn:.10,  ep:'fal-ai/wan/v2.2-a14b/image-to-video',                    t:'video', durFmt:'num',  durOpts:['5','10'], desc:'Açık kaynak, bütçe dostu. Basit animasyonlar için.'},

  ltxvideo:   {n:'LTX Video',            p:'$0.05/vid',    pn:.05,  ep:'fal-ai/ltx-video/image-to-video',                        t:'video', durFmt:'num',  durOpts:['5','10'], desc:'En ekonomik. Kaba prototip ve konsept sunumları.'},

  // Video Models - Text to Video
  kling3t:    {n:'Kling 3.0 Pro T2V',     p:'$0.50/5sn',    pn:.50,  ep:'fal-ai/kling-video/v3/pro/text-to-video',               t:'video', subtype:'t2v', durFmt:'num',  durOpts:['5','10'], desc:'Multi-shot sahne yönetimi ile en güçlü Kling T2V.'},

  sdance20t:  {n:'Seedance 2.0 T2V',      p:'$0.245/5sn',   pn:.245, ep:'fal-ai/bytedance/seedance-2.0/fast/text-to-video',     t:'video', subtype:'t2v', durFmt:'str',  durOpts:['5','10'], desc:'Multi-shot, native audio, fizik motoru. En güçlü T2V.'},

  veo3t:      {n:'Veo 3 T2V',            p:'$1.00/5sn',    pn:1.00, ep:'fal-ai/veo3/text-to-video',                             t:'video', subtype:'t2v', durFmt:'str',  durOpts:['4','6','8'], desc:'Ses dahil üretim. En yüksek sinematik kalite.'},

  wan22t:     {n:'Wan 2.2 T2V',          p:'$0.10/sn',     pn:.10,  ep:'fal-ai/wan/v2.2-a14b/text-to-video',                    t:'video', subtype:'t2v', durFmt:'num',  durOpts:['5','10'], desc:'Bütçe dostu metin→video. Hızlı prototip için.'},

  // Utility Models
  bgrem:      {n:'Arkaplan Sil',          p:'$0.01',        pn:.01,  ep:'fal-ai/bria/background/removal',                        t:'bgrem',  desc:'Tek tıkla arkaplan kaldırma. Gölge korumalı.'},
  upscale:    {n:'4K Büyüt',             p:'$0.02',        pn:.02,  ep:'fal-ai/clarity-upscaler',                               t:'upscale', desc:'4x büyütme, detay netleştirme. Baskı ve vitrin için.'}
};
function modelOptgroups(filterFn){
  var cats={};
  Object.keys(M).filter(filterFn||function(k){return true;}).forEach(function(k){
    var m=M[k];var c=m.cat||m.t;
    if(!cats[c])cats[c]=[];
    cats[c].push(k);
  });
  return cats;
}

var VIDEO_PROMPT_TEMPLATES = [
  {cat:'Sosyal Medya', icon:'', color:'#757475', items:[
    {name:'Reels Hook', prompt:'Hook structure: opens on an extreme close-up of product detail — texture, edge, or surface fills the frame. Fast cut to a full beauty shot. Designed to stop the scroll in the first 2 seconds. 9:16 vertical format. Upbeat, direct, no slow build.'},
    {name:'TikTok Tanıtım', prompt:'Casual, authentic feel. Slightly imperfect handheld framing — feels real, not produced. Product used naturally by hands in a real context. Quick, rhythmic cuts. Raw, unpolished energy. Ends on a clean product frame. 9:16.'},
    {name:'Instagram Story', prompt:'3-beat structure: Beat 1 — problem or tension (moody, dark). Beat 2 — product introduced (bright, reveal). Beat 3 — result or relief (lifestyle context). Each beat roughly 2 seconds. Final frame has clear CTA space. 9:16 vertical.'},
    {name:'Pinterest Mood', prompt:'Slow, observational pan across a styled composition. Warm diffused natural light. Muted, tonal color palette. Text caption appears softly at the bottom. No fast cuts. 1:1 square format. Calm, save-worthy pacing.'},
    {name:'LinkedIn Kurumsal', prompt:'Clean, professional B-roll. Minimal studio or neutral office environment. Product or service demonstrated calmly and clearly. Voiceover-ready pacing — no music dependency. Subtitle text implied throughout. 16:9. Trustworthy, credible tone.'},
  ]},
  {cat:'Reklam', icon:'', color:'#f0c2b4', items:[
    {name:'Hero Reveal', prompt:'Hero reveal sequence. Opens in near-darkness with a single light beam finding the product. Product revealed slowly, all angles shown. Camera pulls back to reveal lifestyle context. Ends on clean beauty shot with negative space for tagline. Confident, unhurried pacing.'},
    {name:'Before / After', prompt:'Split-screen or hard cut comparison. LEFT side: problem state — flat, unresolved, dull. RIGHT side: solution — product in use, situation improved. Match cut on the same frame composition on both sides. Equal duration. Clean center divider. High contrast.'},
    {name:'Testimonial Stil', prompt:'Warm, authentic B-roll. Hands or partial silhouette interacts naturally with the product — no performance. Pull-quote text animation appears on screen. Soft background bokeh. 16:9. Peer-recommendation feeling, not ad-feeling.'},
    {name:'Sezon Kampanyası', prompt:'Seasonal campaign energy. Environment implies the occasion through props and light — not through on-screen text. Product is the solution or gift. Celebratory, light atmosphere. Bold campaign badge space at bottom. Joyful, warm.'},
    {name:'Aciliyet / İndirim', prompt:'Urgency-driven retail ad. Fast-paced product shots — each 0.5s. High contrast color grade. Bold sale text appears with impact. Final frame: clean CTA space at bottom for price and button. Creates desire and immediacy without visual chaos.'},
  ]},
  {cat:'İş Dünyası', icon:'', color:'#cddee6', items:[
    {name:'Uygulama Demo', prompt:'Clean UI walkthrough style. Screen or interface demonstrated purposefully. Key features highlighted with gentle zoom. Annotation callouts appear and fade. Neutral background. Subtitle track implied. 16:9. Efficient, trustworthy pacing.'},
    {name:'Hizmet Tanıtım', prompt:'Professional service showcase. Team or process in action — meeting, working, delivering. Intercut with client environment. Clean lower-third text labels for each step. Competence and reliability as the emotional core. 16:9.'},
    {name:'Sonuç Odaklı', prompt:'Results-first structure. Problem stat opens on bold typography (dark background). Product or solution enters frame. Result stat appears with upward motion graphic. Final frame: logo and one-line proof statement. Data-driven, evidence-based tone.'},
    {name:'Katalog Rulosu', prompt:'Multi-product catalogue roll. Each product gets equal screen time — center frame, clean background, brief identifier text. Consistent lighting across all products. Smooth, rhythmic transitions. Ends on brand mark. 1:1 or 4:5 format.'},
  ]},
  {cat:'Ürün', icon:'', color:'#b2b2b2', items:[
    {name:'Unboxing Ritual', prompt:'Unboxing ritual. Hands lift lid slowly. Interior reveals product nestled inside packaging. Close-up holds on product surface texture. Pull back to full product beauty shot. Every movement tactile and deliberate. Warm, unhurried pacing.'},
    {name:'Detay Makro', prompt:'Macro study of product surfaces. Extreme close-ups — material grain, stitching, surface finish, embossed detail. Slow rack focus between details. No wide shots. Ambient, minimal pacing. The material is the entire subject.'},
    {name:'Stüdyo Rotasyon', prompt:'Product on seamless background — white or deep neutral. Smooth 360-degree turntable rotation, one full revolution during the clip. Consistent studio lighting. Specular highlights travel across the surface as the product rotates. No distractions.'},
    {name:'Kullanım Anı', prompt:'Real-use moment in its natural context. Hands or person interacts with the product without forced posing. Slight camera drift or hold. Ambient environment present. Documentary authenticity — the product doing what it is designed to do.'},
  ]},
  {cat:'Platform Meta', icon:'', color:'#434343', items:[
    {name:'Facebook Feed', prompt:'Facebook feed optimized. 4:5 vertical. First 3 seconds work without sound — visual hook only. Bold text overlay present from frame 0. Clear value proposition visible early. CTA space at bottom. 15-30s total pacing. Direct response structure.'},
    {name:'YouTube Pre-roll', prompt:'Pre-roll structure: 0-5s unskippable hook — a question or a visual surprise. 5-15s: problem and product introduction. 15-25s: proof or demonstration. 25-30s: CTA. 16:9. Works with or without sound. Clear story arc with a beginning, middle, and end.'},
    {name:'Pinterest Video Pin', prompt:'Pinterest video pin. 2:3 vertical. Slow, observational mood. Lifestyle context — home, kitchen, fashion, or nature. Text overlay is inspirational or instructional. Save-worthy composition. No urgency. Calm, curated pacing.'},
    {name:'Shorts Viral', prompt:'Short viral format. Pattern interrupt in the first frame — unexpected angle or surprising visual. Fast cuts, roughly every 1 second. Loop-able structure — final frame leads naturally back to first. 9:16. Designed for replays and shares.'},
  ]},
];

var STRATEGY_GROUPS=[
  {group:'Temel & Serbest',color:'#E2E8F0',items:[
    {name:'Sadece Metin',icon:'',color:'#94A3B8',prompt:'Execute the user concept exactly as written. Do not add any unrequested atmospheric, environmental, or stylistic elements beyond what the brief explicitly states. Stay literal and precise.'},
    {name:'Teknik Belgeleme',icon:'',color:'#CBD5E1',prompt:'Technical documentation approach. Neutral background, even light from both sides. Every surface, texture, edge, and material finish must be readable and accurate. Full depth of field across the entire product. No atmosphere, no mood, no creative interpretation — pure product truth. Choose the lighting and camera settings that maximize material fidelity.'},
    {name:'Ürün Kullanımda',icon:'',color:'#94A3B8',prompt:'The product is being used in a real, unposed moment. Frame the scene as if a photographer happened to be present — not staged. The environment is the product\'s natural context. Available or ambient light. Slight imperfections in framing reinforce authenticity. Choose a focal length and composition that feels observational, not commercial.'},
  ]},
  {group:'Stüdyo Ürün',color:'#E0F7FA',items:[
    {name:'Beyaz Fon Katalog',icon:'',color:'#ECEFF1',prompt:'E-commerce white seamless background — pure white, no gradients, no texture. Product fills most of the frame. Single clean shadow directly below. Color accuracy is the only priority. Choose whatever lighting setup eliminates color casts and renders all materials truthfully.'},
    {name:'Mimari Podyum',icon:'',color:'#BCAAA4',prompt:'Product elevated on a sculptural support — raw plaster, terrazzo, honed stone, or concrete. The surface is architectural, not decorative. One strong directional light. Minimal, confident composition. Product and its support are the only elements in the frame. Choose the surface material, light direction, and crop that create the most architecturally confident image.'},
    {name:'Ton Sür Ton',icon:'',color:'#B39DDB',prompt:'Monochromatic tonal study. Background and surrounding surfaces share the same narrow color family as the environment. Contrast comes only from specular highlights and material behavior — not from color. Large, enveloping light source. Choose colors, surfaces, and a lighting setup that create a unified tonal world around the product.'},
    {name:'Koyu Premium',icon:'',color:'#37474F',prompt:'Dark background, low-key precision lighting. Deep charcoal or near-black environment. A single hard, precise light source carves the product from darkness — revealing form and material through a controlled stripe of light. No fill, no environment details. The product reads as a sculptural object. Choose the beam angle and position that best reveals this specific product\'s geometry and material.'},
  ]},
  {group:'Gündelik Yaşam',color:'#F8D9F3',items:[
    {name:'Sabah Işığı',icon:'',color:'#FFF9C4',prompt:'Early morning domestic atmosphere — the quality of soft window light at 7-8am in a quiet home. Long gentle shadows from one side. The product sits naturally, as if placed there without intention. Scene feels lived-in, not curated. Choose the surface, supporting objects, and precise light angle to build this morning-light authenticity.'},
    {name:'Düzenlenmiş Yüzey',icon:'',color:'#DCEDC8',prompt:'Curated flat-lay or 45-degree overhead composition. Product surrounded by complementary objects chosen for tonal harmony. Diffused soft overhead light — each object casts its own real shadow. The arrangement is intentional but not perfect. Choose the surface material, companion objects, and light quality to create a scene that feels both designed and natural.'},
    {name:'Ham Yüzeyler',icon:'',color:'#BCAAA4',prompt:'Product placed on raw, unpolished natural materials — aged wood grain, weathered stone, cracked clay, linen, rough ceramic. The physical contrast between product and raw surface is the subject. Overcast or high diffused light. No studio polish. Choose the specific material pairing that creates the most honest physical dialogue between product and surface.'},
    {name:'Dış Mekan',icon:'',color:'#A5D6A7',prompt:'Real outdoor environment. The product exists in a genuine exterior context — not a set, not a styled backdrop. Directional natural light. Background environment should be present but out of focus. Choose the specific location, time of day, and camera position that makes the product feel like it genuinely belongs in this outdoor world.'},
  ]},
  {group:'Mankenli',color:'var(--ac-warm)',items:[
    {name:'El ile Temas',icon:'',color:'#FFCC80',prompt:'Human hands interact with the product naturally — holding, lifting, touching, or cradling in a way that feels uncontrived. Skin texture should be visible. Hands are the supporting actor; the product remains the subject. Choose the specific gesture, the light direction, and the depth of field to create a believable tactile moment — not a grip, not a pose.'},
    {name:'Vücut Kırpması',icon:'',color:'#F48FB1',prompt:'Human figure cropped at torso or collarbone — face not visible. Model mid-movement, not posed. Product worn, carried, or held as part of natural motion. Editorial sensibility — the crop and framing are deliberate compositional choices. Choose the body crop, the motion direction, and the light quality to produce an image that reads like a magazine page.'},
    {name:'Yaşam Portresi',icon:'',color:'#CE93D8',prompt:'Full person embedded in a genuine environment, using or interacting with the product as part of their natural activity. Person not looking at the camera. Environment is real, not a studio set. Product is essential to what they are doing, but the whole scene tells a story. Choose the environment, the activity, and the observational light approach that makes this feel documentary, not staged.'},
  ]},
  {group:'Dinamik & Kampanya',color:'#81D4FA',items:[
    {name:'Sıvı ve Hareket',icon:'',color:'#80DEEA',prompt:'High-speed frozen liquid or dynamic physical motion — a splash, a pour, a burst, a collision captured at peak moment. Dark background so the dynamic element reads as isolated shapes against void. Product is present — either as the source of the motion or surrounded by it. Choose the liquid behavior, the strobe setup to freeze motion, and the precise moment that communicates the most physical energy.'},
    {name:'Yerçekimsiz Patlama',icon:'',color:'#FFD54F',prompt:'Product components, ingredients, or companion objects suspended in space at different distances from the lens — creating genuine depth. No visible supports. Background is clean and simple. The arrangement reads as an explosion frozen at peak expansion. Choose which elements surround the product, the spacing between them, and the light that makes each element read clearly.'},
    {name:'Banner Kompozisyon',icon:'',color:'#FFCC80',prompt:'Deliberate asymmetric 16:9 composition with intentional negative space for text overlay. Product positioned at one third of the frame — the remaining two thirds are intentionally empty, held for a headline or campaign message. Choose which side holds the product, what fills the negative space minimally, and how the light separates product from the open area.'},
  ]},
  {group:'Editorial & Lüks',color:'#D4AF37',items:[
    {name:'Dergi Sayfası',icon:'',color:'#F9E4B7',prompt:'High-fashion magazine still life. Rich layered scene with multiple physical objects that have real relationships with each other and with the light. Props are chosen for material contrast and compositional weight. The product is the compositional anchor. Choose the specific props, the surface, and a lighting setup that creates depth and material richness — the scene should look expensive to produce, not digitally assembled.'},
    {name:'Film Karesi',icon:'',color:'#90A4AE',prompt:'Single frame from a narrative film — the scene implies a story. One motivated light source dominates; everything else falls into shadow. Volumetric atmosphere if the scene calls for it. The product has a presence within this story world. Choose the scene genre, the light source\'s identity, and the color grade that make this feel like a film still, not a product ad.'},
    {name:'Sert Gün Işığı',icon:'',color:'#FFE082',prompt:'Direct, unforgiving hard light — no diffusion. Single point source mimicking direct sun at peak intensity. Product casts a hard geometric shadow with a sharp terminator edge. Shadows are as much the subject as the product itself. Colors at full natural saturation. No softening, no fill. Choose the precise angle that creates the most revealing shadow geometry for this specific product\'s form.'},
  ]}
];
var STRATEGIES=[];
STRATEGY_GROUPS.forEach(g=>g.items.forEach(item=>STRATEGIES.push({...item,groupName:g.group})));

var VIDEO_STRATEGIES=[
  {id:'reklam', icon:'', name:'Reklam Filmi', color:'#FF6B6B', dur_default:'8',
   prompt:'Commercial advertisement structure. Opens on the product — revealing material and form first — then builds outward to context. Camera movement is intentional and motivated, not decorative. Ends on a clean frame with negative space for text. Choose the lighting approach, camera move, and pacing that best suits this specific product\'s character and creates genuine desire.'},
  {id:'kullanim', icon:'', name:'Kullanım Sahnesi', color:'#4ECDC4', dur_default:'5',
   prompt:'Product in use, documentary approach. Hands interact naturally with the product — no performance, no forced gestures. Camera steady or drifting very gently. Even, clear lighting that reads well without color bias. The scene communicates function through authentic physical interaction, not staging. Choose the use context and hand behavior that best reveals what the product actually does.'},
  {id:'orbit', icon:'', name:'Orbital Hareket', color:'#A8E6CF', dur_default:'6',
   prompt:'Camera orbits the product in a smooth continuous arc. Product remains stationary at exact frame center throughout the movement. Rim or edge lighting creates shifting specular highlights as the camera angle changes — each position reveals different material qualities. No environment distractions. Choose the starting position, orbit direction, and lighting that best showcases this product\'s three-dimensional form.'},
  {id:'reveal', icon:'', name:'Ürün Reveal', color:'#FFD93D', dur_default:'5',
   prompt:'Slow dramatic reveal. Product is not visible at the start — opening frames are atmospheric or abstract. Camera pushes gradually toward where the product will appear. Lighting transitions from soft and environmental to precise and focused as the product enters the frame. Final seconds hold on a clean beauty shot. Unhurried, confident pacing.'},
  {id:'atmosfer', icon:'', name:'Atmosfer Filmi', color:'#C3B1E1', dur_default:'8',
   prompt:'Mood-driven observational film. Product exists naturally in a physical environment. Camera movement is slow and observational — following the scene, not directing it. Environmental details given equal visual weight as the product. Lighting is motivated by the environment, not by studio logic. Choose an environment and time of day that creates genuine atmospheric character around this product.'},
  {id:'studio360', icon:'', name:'Stüdyo 360', color:'#F8C8D4', dur_default:'5',
   prompt:'Product rotation on a studio setup. Product on turntable, camera locked-off. One full revolution during clip duration. Consistent studio lighting throughout — specular highlights travel across the product surface as it rotates. Background is neutral. Choose the background tone and lighting positions that best reveal this product\'s material quality in continuous rotation.'},
  {id:'unboxing', icon:'', name:'Unboxing Ritual', color:'#80DEEA', dur_default:'8',
   prompt:'Unboxing ritual, unhurried. Hands enter frame slowly and deliberately. Packaging opens to reveal the nested product. Camera pushes gently toward the product during the reveal. A close-up holds on the product surface before pulling back to a full beauty shot. Every movement is tactile and deliberate. Choose the packaging context, the hand pace, and the light quality that make this feel worth watching.'},
  {id:'tekstil', icon:'', name:'Tekstil Hareketi', color:'#F48FB1', dur_default:'5',
   prompt:'Fabric or textile in gentle motion. Material caught mid-movement — a soft billow, a settling drape, a fold in progress. Camera static or drifting imperceptibly. Light reveals fabric weave, surface texture, and material weight through its physical behavior. The material is the entire message. Choose the motion type, the air direction, and the light angle that best expresses this textile\'s character.'},
  {id:'sosyal9x16', icon:'', name:'Sosyal Medya 9:16', color:'#B39DDB', dur_default:'5',
   prompt:'Vertical 9:16 format for mobile. Product in the upper portion of the frame; lower area kept clean for text overlay. First frame must be visually strong — no slow build. Camera movement is minimal. Designed to communicate without audio. Choose a composition and lighting approach that reads immediately and holds attention in a mobile feed.'},
  {id:'indirim', icon:'', name:'Kampanya Filmi', color:'#FF8A65', dur_default:'5',
   prompt:'Campaign energy. Product center-frame on clean background. Slow push-in during the first half builds anticipation. Clear negative space preserved throughout for badge and price overlay. High-contrast, punchy color grade. Final frame: product fully revealed, maximum clean negative space below for CTA. Choose the background tone and push speed that creates energy without chaos.'},
];

// ═══ SİHİRLİ PROMPT — Kategori Tanımları ═══
var MAGIC_CATEGORIES = [
  {
    id: 'eticaret',
    name: 'E-Ticaret',
    icon: '',
    desc: 'Beyaz fon, tüm detaylar net, renk doğru',
    color: '#64B5F6',
    preferredStrats: ['Beyaz Fon Katalog', 'Teknik Belgeleme', 'Mimari Podyum'],
    hint: 'E-commerce catalog shot. Pure white or neutral seamless background. Product fills the frame. Every surface detail documented with clarity. No atmosphere, no mood — pure product truth.',
  },
  {
    id: 'kozmetik',
    name: 'Kozmetik & Güzellik',
    icon: '',
    desc: 'Dramatik ışık, malzeme kalitesi ön planda',
    color: '#CE93D8',
    preferredStrats: ['Koyu Premium', 'Ton Sür Ton', 'Film Karesi'],
    hint: 'Beauty or cosmetics product. Dramatic or sculpting light that reveals material quality — glass, metal collar, frosted surfaces. The product should feel tactile and desirable.',
  },
  {
    id: 'moda',
    name: 'Moda & Tekstil',
    icon: '',
    desc: 'Kumaş dokusu, doğal ortam, hayat içinde',
    color: '#F48FB1',
    preferredStrats: ['Ham Yüzeyler', 'Dış Mekan', 'Sabah Işığı', 'Ürün Kullanımda'],
    hint: 'Fashion or textile product in a lifestyle context. Fabric texture, weave, drape, and material character are paramount. Environment should feel genuine — not staged.',
  },
  {
    id: 'gida',
    name: 'Gıda & İçecek',
    icon: '',
    desc: 'Taze görünüm, doku detayı, iştah açıcı',
    color: '#A5D6A7',
    preferredStrats: ['Düzenlenmiş Yüzey', 'Sabah Işığı', 'Ham Yüzeyler'],
    hint: 'Food or beverage product. Fresh, physical, appetizing. Macro details of texture — condensation, steam, crumbs, pour, or drip. Warm natural or directional light that renders physicality.',
  },
  {
    id: 'ev',
    name: 'Ev & Yaşam',
    icon: '',
    desc: 'Sıcak, düzenlenmiş ama yaşanmış alan',
    color: '#FFCC80',
    preferredStrats: ['Düzenlenmiş Yüzey', 'Ham Yüzeyler', 'Sabah Işığı', 'Ton Sür Ton'],
    hint: 'Home décor or lifestyle product in a warm, curated but lived-in space. Tonal harmony between product and environment. Natural window light preferred.',
  },
  {
    id: 'teknoloji',
    name: 'Teknoloji',
    icon: '',
    desc: 'Temiz stüdyo, malzeme hassasiyeti, minimal',
    color: '#80DEEA',
    preferredStrats: ['Teknik Belgeleme', 'Koyu Premium', 'Mimari Podyum'],
    hint: 'Technology or electronics product. Precision studio lighting. Material honesty — brushed aluminum, matte plastic, glass screen reflections. Clean, minimal, architectural confidence.',
  },
  {
    id: 'aksesuar',
    name: 'Aksesuar & Takı',
    icon: '',
    desc: 'Metal parlaması, deri dokusu, kuyumcu ışığı',
    color: '#FFF176',
    preferredStrats: ['Koyu Premium', 'Mimari Podyum', 'Ton Sür Ton', 'Teknik Belgeleme'],
    hint: 'Accessory or jewelry. Light that reveals material character — metal sheen, leather grain, crystal facets. Precise specular control. Every reflection intentional.',
  },
  {
    id: 'serbest',
    name: 'Serbest / Genel',
    icon: '',
    desc: 'Opus en uygun sahneyi seçer',
    color: '#B0BEC5',
    preferredStrats: [],
    hint: '',
  },
];
