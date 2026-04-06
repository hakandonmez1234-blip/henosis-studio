// ═══════════════════════════════════════════════════════════════
// UI-VIDEO.JS — Video Araçları (Edit Pipeline + Prompt Şablonları)
// renderVideoEditPipeline(): FFmpeg uyarısı/hazır bildirimi,
//         klip listesi (sürükle sırala, metin overlay, süre),
//         galeri video seçici, edit ayarları (format/geçiş/metin stili),
//         merge butonu, önizleme videoları, sonuç indirme
// renderVideoTemplates(): şablon kategorileri (ürün/moda/yemek vb.),
//         şablon kartları → tıkla havuza ekle
// applyVideoTemplate(): şablonu prompt havuzuna ekler
// ═══════════════════════════════════════════════════════════════

// ── Edit Pipeline Render Fonksiyonu ──
function renderVideoEditPipeline() {
  var vs = S.videoStudio;
  var o = '';

  // FFmpeg uyarısı
  if (S.ffmpegAvailable === false) {
    o += `<div style="background:rgba(201,79,79,0.08);border:1.5px solid rgba(201,79,79,0.2);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px"><i data-lucide="alert-circle" style="width:14px;height:14px"></i> FFmpeg Bulunamadı</div>
      <div style="font-size:11px;color:var(--tx-muted);line-height:1.7">${h(S.ffmpegError)}<br>
        <strong>Windows:</strong> ffmpeg.org/download → bin klasörünü PATH'e ekle ya da .env'e <code>FFMPEG_PATH=C:\\ffmpeg\\bin\\ffmpeg.exe</code> ekle<br>
        <strong>Mac:</strong> <code>brew install ffmpeg</code> &nbsp;|&nbsp; <strong>Linux:</strong> <code>sudo apt install ffmpeg</code>
      </div>
      <button onclick="checkFFmpegStatus()" style="margin-top:8px;padding:5px 14px;border-radius:8px;border:1px solid var(--brd);background:var(--bg-elevated);color:var(--tx-main);font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px"><i data-lucide="refresh-cw" style="width:12px;height:12px"></i> Tekrar Kontrol Et</button>
    </div>`;
  } else if (S.ffmpegAvailable === true) {
    o += `<div style="background:rgba(58,158,106,0.06);border:1px solid rgba(58,158,106,0.2);border-radius:10px;padding:8px 14px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:14px;display:flex;align-items:center"><i data-lucide="check-circle" style="width:14px;height:14px;color:var(--green)"></i></span>
      <div style="font-size:10px;color:var(--tx-muted)"><strong style="color:var(--green)">FFmpeg hazır</strong> — ${h(S.ffmpegVersion.replace('ffmpeg version ','').split(' ')[0])}</div>
    </div>`;
  }

  // Başlık + Kuyruktan İçe Aktar
  o += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <div>
      <div style="font-size:13px;font-weight:700;color:var(--tx-main);display:flex;align-items:center;gap:6px"><i data-lucide="film" style="width:14px;height:14px"></i> Video Edit Pipeline</div>
      <div style="font-size:10px;color:var(--tx-muted);margin-top:2px">Klipleri sırala, metin ekle, FFmpeg ile birleştir</div>
    </div>
    <button class="bs" style="font-size:10px;padding:6px 12px;flex-shrink:0;display:flex;align-items:center;gap:4px" onclick="importVideosFromQueue()"><i data-lucide="download" style="width:12px;height:12px"></i> Kuyruktan Aktar</button>
  </div>`;

  // Klip Listesi
  if (vs.clips.length === 0) {
    o += `<div style="border:2px dashed var(--brd);border-radius:14px;padding:28px;text-align:center;margin-bottom:14px">
      <div style="font-size:28px;margin-bottom:8px;display:flex;align-items:center;justify-content:center"><i data-lucide="clapperboard" style="width:28px;height:28px"></i></div>
      <div style="font-size:13px;font-weight:600;color:var(--tx-main);margin-bottom:6px">Klip listesi boş</div>
      <div style="font-size:11px;color:var(--tx-muted);line-height:1.6">Kuyruktan aktar, Galeriden ekle veya URL ile ekle.<br>Her klip 4-10 saniye olabilir.</div>
    </div>`;
  } else {
    o += `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">`;
    vs.clips.forEach((clip, i) => {
      o += `<div style="background:var(--bg-cream);border-radius:12px;padding:12px;border:1.5px solid var(--brd-soft)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:8px;background:var(--ac-orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">${i + 1}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(clip.refName || 'Klip ' + (i + 1))}</div>
            <div style="font-size:10px;color:var(--tx-muted)">${clip.url.substring(0, 40)}...</div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button onclick="moveClip('${clip.id}',-1)" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--brd);background:var(--bg-elevated);color:var(--tx-main);cursor:pointer;font-size:12px" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button onclick="moveClip('${clip.id}',1)" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--brd);background:var(--bg-elevated);color:var(--tx-main);cursor:pointer;font-size:12px" ${i === vs.clips.length - 1 ? 'disabled' : ''}>↓</button>
            <button onclick="removeClip('${clip.id}')" style="width:24px;height:24px;border-radius:6px;border:1px solid rgba(201,79,79,0.3);background:var(--bg-elevated);cursor:pointer;font-size:11px;color:var(--red)">✕</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;align-items:start">
          <div>
            <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:4px">SÜRE (sn)</div>
            <input type="number" min="1" max="60" value="${clip.duration}" oninput="updateClipDuration('${clip.id}',this.value)" style="width:100%;padding:6px 8px;border-radius:8px;border:1.5px solid var(--brd);font-size:12px;font-weight:700;text-align:center;font-family:inherit;outline:none">
          </div>
          <div>
            <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:4px">METİN OVERLAY (opsiyonel)</div>
            <input placeholder="Ürün başlığı, hashtag, slogan..." value="${h(clip.text)}" oninput="updateClipText('${clip.id}',this.value)" style="width:100%;padding:6px 10px;border-radius:8px;border:1.5px solid var(--brd);font-size:12px;font-family:inherit;outline:none;box-sizing:border-box">
          </div>
        </div>
        ${clip.promptText ? `<div style="margin-top:8px;font-size:10px;color:var(--tx-muted);background:rgba(255,255,255,0.06);padding:6px 10px;border-radius:8px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${h(clip.promptText)}</div>` : ''}
        <button onclick="generateClipPrompt('${clip.id}')" style="margin-top:8px;padding:5px 12px;border-radius:8px;border:1px solid var(--brd);background:var(--bg-elevated);font-size:10px;font-weight:600;cursor:pointer;color:var(--ac-orange);font-family:inherit;display:flex;align-items:center;gap:5px"><i data-lucide="sparkles" style="width:12px;height:12px"></i> Prompt Üret</button>
      </div>`;
    });
    o += `</div>
    <div style="font-size:11px;color:var(--tx-muted);text-align:center;margin-bottom:10px">${vs.clips.length} klip · Toplam ~${vs.clips.reduce((a, c) => a + (c.duration || 5), 0)} saniye</div>`;
  }

  // URL ile Klip Ekle
  o += `<div style="background:var(--bg-card);border-radius:12px;padding:12px;border:1.5px solid var(--brd-soft);margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);margin-bottom:8px">URL İLE KLİP EKLE</div>
    <div style="display:flex;gap:8px">
      <input id="clip-url-input" placeholder="https://...video.mp4" style="flex:1;padding:8px 12px;border-radius:8px;border:1.5px solid var(--brd);font-size:12px;font-family:inherit;outline:none">
      <button class="bs" style="flex-shrink:0;font-size:11px" onclick="var u=document.getElementById('clip-url-input');addClipByUrl(u.value,'URL Klip');u.value=''">+ Ekle</button>
    </div>
  </div>`;

  // Galeri Videolarını Ekle
  var galleryVids = S.gallery.filter(g => g.result && (g.result.includes('.mp4') || g.result.includes('video')));
  if (galleryVids.length) {
    o += `<div style="background:var(--bg-card);border-radius:12px;padding:12px;border:1.5px solid var(--brd-soft);margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);margin-bottom:10px">GALERİDEN EKLE (${galleryVids.length} video)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">`;
    galleryVids.slice(0, 12).forEach((g, gi) => {
      var realIdx = S.gallery.indexOf(g);
      var alreadyIn = vs.clips.some(c => c.url === g.result);
      o += `<div onclick="${alreadyIn ? '' : 'addClipFromGallery(' + realIdx + ')'}" style="width:56px;cursor:${alreadyIn ? 'default' : 'pointer'};opacity:${alreadyIn ? '0.4' : '1'};position:relative">
        <div style="width:56px;height:56px;background:var(--tx-main);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">${alreadyIn ? '✓' : '▶'}</div>
        <div style="font-size:8px;color:var(--tx-muted);text-align:center;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h((g.ref ? g.ref.name : 'Video').substring(0, 8))}</div>
      </div>`;
    });
    o += `</div></div>`;
  }

  // Edit Ayarları
  o += `<div style="background:var(--bg-cream);border-radius:14px;padding:14px;border:1.5px solid var(--brd-soft);margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:12px">EDIT AYARLARI</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--tx-muted);margin-bottom:6px">ÇIKTI FORMATI</div>
        <select class="inp" style="font-size:12px" onchange="S.videoStudio.format=this.value;saveDB();render()">
          <option value="reels" ${vs.format === 'reels' ? 'selected' : ''}>9:16 Reels / TikTok</option>
          <option value="landscape" ${vs.format === 'landscape' ? 'selected' : ''}>16:9 YouTube</option>
          <option value="square" ${vs.format === 'square' ? 'selected' : ''}>1:1 Instagram Kare</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--tx-muted);margin-bottom:6px">GEÇİŞ EFEKTİ</div>
        <select class="inp" style="font-size:12px" onchange="S.videoStudio.transition=this.value;saveDB()">
          <option value="fade" ${vs.transition === 'fade' ? 'selected' : ''}>Fade (Soluk Geçiş)</option>
          <option value="dissolve" ${vs.transition === 'dissolve' ? 'selected' : ''}>Dissolve (Uzun Geçiş)</option>
          <option value="cut" ${vs.transition === 'cut' ? 'selected' : ''}>Cut (Kesme)</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--tx-muted);margin-bottom:6px">METİN STİLİ</div>
        <select class="inp" style="font-size:12px" onchange="S.videoStudio.textStyle=this.value;saveDB()">
          <option value="minimal" ${vs.textStyle === 'minimal' ? 'selected' : ''}>Minimal (Altyazı)</option>
          <option value="instagram" ${vs.textStyle === 'instagram' ? 'selected' : ''}>Instagram (Alt Panel)</option>
          <option value="bold" ${vs.textStyle === 'bold' ? 'selected' : ''}>Bold (Büyük Başlık)</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;color:var(--tx-muted);margin-bottom:6px">ÇIKTI ADI</div>
        <input class="inp" style="font-size:12px" placeholder="sozyal_medya_video" value="${h(vs.outputName)}" oninput="S.videoStudio.outputName=this.value">
      </div>
    </div>
  </div>`;

  // Merge Butonu + Sonuç
  if (vs.mergeError) {
    o += `<div style="background:rgba(201,79,79,0.08);border:1px solid rgba(201,79,79,0.2);border-radius:10px;padding:12px;margin-bottom:12px;font-size:11px;color:var(--red);display:flex;align-items:center;gap:6px"><i data-lucide="alert-triangle" style="width:14px;height:14px;flex-shrink:0"></i> ${h(vs.mergeError)}</div>`;
  }

  if (vs.mergeResult) {
    o += `<div style="background:rgba(58,158,106,0.08);border:1.5px solid rgba(58,158,106,0.2);border-radius:14px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--green);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i data-lucide="check-circle" style="width:16px;height:16px"></i> Video Hazır!</div>
      <video controls style="width:100%;border-radius:10px;max-height:240px;background:#000">
        <source src="${vs.mergeResult}" type="video/mp4">
      </video>
      <button class="bp" style="width:100%;margin-top:10px;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="downloadMergedVideo()"><i data-lucide="download" style="width:14px;height:14px"></i> İndir MP4</button>
    </div>`;
  }

  // Önizleme — mevcut kliplerin URL'lerini listele
  if (vs.clips.length > 0 && !vs.merging) {
    o += `<div style="margin-bottom:10px;background:var(--bg-cream);border-radius:12px;padding:12px;border:1px solid var(--brd-soft)">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);margin-bottom:8px;display:flex;align-items:center;gap:5px"><i data-lucide="eye" style="width:12px;height:12px"></i> KLİP ÖNİZLEME (${vs.clips.length} klip sırasıyla)</div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">`;
    vs.clips.forEach((clip, i) => {
      o += `<div style="flex-shrink:0;width:120px">
        <div style="font-size:9px;font-weight:700;color:var(--ac-orange);margin-bottom:4px">${i+1}. ${h((clip.refName||'Klip').substring(0,12))}</div>
        <video src="${clip.url}" style="width:120px;height:70px;object-fit:cover;border-radius:8px;background:#000" muted preload="metadata" onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0"></video>
        <div style="font-size:9px;color:var(--tx-muted);margin-top:2px">${clip.duration}sn${clip.text?` · "${clip.text.substring(0,8)}..."`:''}</div>
      </div>`;
    });
    o += `</div></div>`;
  }

  o += `<button class="bp" style="width:100%;padding:14px;font-size:13px;font-weight:700" onclick="mergeVideoClips()" ${vs.merging || vs.clips.length === 0 ? 'disabled' : ''}>
    ${vs.merging ? '<span class="spinner"></span> FFmpeg işliyor...' : vs.clips.length === 0 ? 'Klip ekleyin' : '<span style="display:flex;align-items:center;gap:6px;justify-content:center"><i data-lucide="clapperboard" style="width:14px;height:14px"></i> Videoları Birleştir (' + vs.clips.length + ' klip · ~' + vs.clips.reduce((a,c)=>a+(c.duration||5),0) + 's)</span>'}
  </button>`;

  return o;
}


// ── Video Prompt Şablonları Render ──
// ═══════════════════════════════════════════════════════════════
// UI-VIDEO.JS — PATCH: renderVideoTemplates() ve applyVideoTemplate()
// Bu iki fonksiyonu mevcut ui-video.js'deki karşılıklarıyla değiştir
// ═══════════════════════════════════════════════════════════════

// ── Video Şablon Text Field Tanımları ──
// Her şablon kendi field listesini getirir.
// Bu map'i config.js sonuna veya ui-video.js başına ekle.

// ── Strateji ID'sine göre metin alanları (I2V + T2V Strateji akışı) ──
var VIDEO_STRATEGY_FIELDS = {
  'reklam': [
    {key:'urun_adi',   label:'Ürün Adı',     placeholder:'Ürün adı',           hint:''},
    {key:'slogan',     label:'Slogan',        placeholder:'Her şey bu anda başlar', hint:'Kapanış metni'},
    {key:'marka',      label:'Marka',         placeholder:'Marka adı',           hint:''},
  ],
  'indirim': [
    {key:'indirim',    label:'İndirim Oranı', placeholder:'%40',                 hint:'Örn: %40, %50 OFF'},
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'fiyat',      label:'Kampanya Fiyatı',placeholder:'299 TL',             hint:''},
    {key:'eski_fiyat', label:'Eski Fiyat',    placeholder:'499 TL',              hint:'Opsiyonel'},
    {key:'cta',        label:'CTA Metni',     placeholder:'Hemen Al',            hint:'Buton metni'},
  ],
  'sosyal9x16': [
    {key:'hook_metin', label:'Hook (0-2s)',   placeholder:'Bunu gördün mü?',     hint:'İlk karedeki metin'},
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'fiyat',      label:'Fiyat',         placeholder:'199 TL',              hint:'Opsiyonel'},
    {key:'cta',        label:'CTA',           placeholder:'Hemen Keşfet',         hint:''},
  ],
  'unboxing': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'fiyat',      label:'Fiyat',         placeholder:'499 TL',              hint:''},
    {key:'puan',       label:'Değerlendirme', placeholder:'4.8 ⭐',              hint:'Yorum notu opsiyonel'},
  ],
  'tekstil': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Oversize Kazak',      hint:''},
    {key:'materyal',   label:'Materyal',      placeholder:'Yün örgü, pamuk vs.', hint:'Kumaş detayı'},
  ],
  'orbit': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
  ],
  'reveal': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'slogan',     label:'Kapanış Metni', placeholder:'',                    hint:'Opsiyonel'},
  ],
  'studio360': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
  ],
  'kullanim': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'kullanim_ctx',label:'Kullanım Bağlamı',placeholder:'Mutfakta, ofiste, dışarıda', hint:''},
  ],
  'atmosfer': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'ortam',      label:'Ortam',         placeholder:'Sabah mutfak, gün batımı plaj', hint:''},
  ],
};
 
// ── VIDEO_PROMPT_TEMPLATES item adına göre metin alanları (T2V Şablon akışı) ──
var VIDEO_TEMPLATE_FIELDS_BY_NAME = {
  'Instagram Reels Hook': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'hook_metin', label:'Hook Metni',    placeholder:'Bunu gördün mü?',     hint:'0-2s ilk kare'},
    {key:'cta',        label:'CTA',           placeholder:'Hemen Kaydır',         hint:''},
  ],
  'TikTok Tanıtım': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'ana_mesaj',  label:'Ana Mesaj',     placeholder:'',                    hint:'Opsiyonel overlay'},
    {key:'hashtag',    label:'Hashtag',       placeholder:'#trendyol',           hint:''},
  ],
  'Story Slider': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'problem',    label:'Problem (Beat 1)',placeholder:'Zaman kaybediyorum', hint:'İlk kare mesajı'},
    {key:'cozum',      label:'Çözüm (Beat 3)', placeholder:'Artık çok daha kolay',hint:'Son kare mesajı'},
    {key:'cta',        label:'CTA',           placeholder:'Hemen Kaydır',         hint:''},
  ],
  'Hero Product Shot': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'tagline',    label:'Tagline',       placeholder:'Farkı hissedeceksin', hint:'Kapanış metni'},
    {key:'marka',      label:'Marka',         placeholder:'Marka adı',           hint:''},
  ],
  'Before / After': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'once',       label:'Önce Metni',    placeholder:'Eski yöntem',         hint:'Sol panel'},
    {key:'sonra',      label:'Sonra Metni',   placeholder:'Şimdi çok daha iyi',  hint:'Sağ panel'},
  ],
  'Sezon / Kampanya': [
    {key:'kampanya',   label:'Kampanya Adı',  placeholder:'Yaz Sonu İndirimi',   hint:''},
    {key:'indirim',    label:'İndirim',       placeholder:'%50',                 hint:''},
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'bitis',      label:'Bitiş',         placeholder:'31 Ağustos\'a kadar', hint:'Opsiyonel'},
  ],
  'Countdown / Urgency': [
    {key:'indirim',    label:'İndirim',       placeholder:'%60',                 hint:''},
    {key:'sure',       label:'Süre',          placeholder:'Son 24 Saat',         hint:'Countdown metni'},
    {key:'cta',        label:'CTA',           placeholder:'Hemen Al',            hint:''},
  ],
  'E-ticaret Katalog': [
    {key:'marka',      label:'Marka',         placeholder:'Marka adı',           hint:''},
    {key:'koleksiyon', label:'Koleksiyon',    placeholder:'2025 Yaz Koleksiyonu', hint:''},
  ],
  'Unboxing / Reveal': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'fiyat',      label:'Fiyat',         placeholder:'599 TL',              hint:''},
  ],
  'Facebook Feed Ad': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'baslik',     label:'Başlık',        placeholder:'Harika bir fırsat!',  hint:'İlk 3s görsel hook'},
    {key:'cta',        label:'CTA',           placeholder:'Şimdi İncele',         hint:''},
    {key:'fiyat',      label:'Fiyat',         placeholder:'',                    hint:'Opsiyonel'},
  ],
  'YouTube Pre-roll': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'hook_soru',  label:'Hook Soru',     placeholder:'Bunu hiç denedin mi?',hint:'0-5s hook'},
    {key:'cta',        label:'CTA',           placeholder:'Hemen İzle',           hint:''},
  ],
  'Shorts / Reels Viral': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'surpriz',    label:'Sürpriz Açı',   placeholder:'Kimse bunu bilmiyor', hint:'Pattern interrupt'},
  ],
  '_default': [
    {key:'urun_adi',   label:'Ürün Adı',      placeholder:'Ürün adı',            hint:''},
    {key:'mesaj',      label:'Ana Mesaj',     placeholder:'',                    hint:'Opsiyonel overlay'},
  ],
};
 
// Şablon adından field listesi getir (T2V Şablon akışı)
function getTemplateFields(templateName) {
  return VIDEO_TEMPLATE_FIELDS_BY_NAME[templateName]
      || VIDEO_TEMPLATE_FIELDS_BY_NAME['_default'];
}
 
// Strateji id'sinden field listesi getir (Strateji akışı)
function getStrategyFields(stratId) {
  return VIDEO_STRATEGY_FIELDS[stratId]
      || [{key:'urun_adi', label:'Ürün Adı', placeholder:'Ürün adı', hint:''}];
}
 


// ── renderVideoTemplates() — Tamamen Yeniden Yaz ──

function renderVideoTemplates() {
  var o = '';

  // Şablon kategorileri
  o += `<div style="margin-top:16px;border-top:1px solid var(--brd);padding-top:16px">
    <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:12px">PROMPT ŞABLONLARI</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">`;

  var cats=[...new Set(VIDEO_PROMPT_TEMPLATES.map(g=>g.cat))];
  var activeCat=S.templateCat||cats[0];
  cats.forEach(cat=>{
    var g=VIDEO_PROMPT_TEMPLATES.find(x=>x.cat===cat);
    var isA=activeCat===cat;
    o+=`<button onclick="S.templateCat='${cat}';saveDB();render()" style="padding:5px 12px;border-radius:99px;border:1.5px solid ${isA?g.color:'var(--brd)'};background:${isA?g.color+'18':'transparent'};color:${isA?g.color:'var(--tx-muted)'};font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px">${cat}</button>`;
  });
  o+=`</div>`;

  // Şablon kartları
  o+=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:8px">`;
  var activeGroup=VIDEO_PROMPT_TEMPLATES.find(g=>g.cat===activeCat);
  if(activeGroup){
    activeGroup.items.forEach(item=>{
      var isActive=S.activeVideoTemplate===item.name;
      o+=`<div onclick="selectVideoTemplate('${item.name.replace(/'/g,"\\'")}', \`${item.prompt.replace(/\`/g,'\\`')}\`)"
        style="padding:12px;border-radius:12px;border:1.5px solid ${isActive?activeGroup.color:'var(--brd-soft)'};background:${isActive?activeGroup.color+'12':'var(--bg-cream)'};cursor:pointer;transition:all 0.15s"
        onmouseover="this.style.borderColor='${activeGroup.color}'" onmouseout="this.style.borderColor='${isActive?activeGroup.color:'var(--brd-soft)'}'"  >
        <div style="font-size:16px;margin-bottom:5px;color:${activeGroup.color}"><i data-lucide="file-video" style="width:20px;height:20px"></i></div>
        <div style="font-size:11px;font-weight:700;color:var(--tx-main);margin-bottom:4px">${h(item.name)}</div>
        <div style="font-size:9px;color:var(--tx-muted);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${h(item.prompt.substring(0,80))}...</div>
      </div>`;
    });
  }
  o+=`</div>`;

  // ── Text Placement Alanları (seçili şablona göre) ──
  if(S.activeVideoTemplate){
    var fields=getTemplateFields(S.activeVideoTemplate);
    if(!S.videoTemplateFields)S.videoTemplateFields={};

    o+=`<div style="margin-top:16px;background:var(--bg-card);border:1.5px solid rgba(212,100,42,0.2);border-radius:14px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:5px">
        <i data-lucide="type" style="width:12px;height:12px"></i> ${h(S.activeVideoTemplate)} — METİN ALANLARI
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">`;

    fields.forEach(f=>{
      var val=S.videoTemplateFields[f.key]||'';
      o+=`<div>
        <div style="font-size:9px;font-weight:700;color:var(--tx-muted);margin-bottom:4px;letter-spacing:0.5px">${h(f.label).toUpperCase()}</div>
        <input 
          class="inp" 
          placeholder="${h(f.placeholder)}"
          value="${h(val)}"
          style="font-size:12px;width:100%"
          oninput="if(!S.videoTemplateFields)S.videoTemplateFields={};S.videoTemplateFields['${f.key}']=this.value;saveDB()"
        >
        ${f.hint?`<div style="font-size:9px;color:var(--tx-muted);margin-top:3px">${h(f.hint)}</div>`:''}
      </div>`;
    });

    o+=`</div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="bp" style="flex:1;padding:10px;display:flex;align-items:center;justify-content:center;gap:5px" onclick="applyVideoTemplate()">
          <i data-lucide="check" style="width:14px;height:14px"></i> Şablonu Havuza At
        </button>
        <button class="bg" style="flex-shrink:0" onclick="S.activeVideoTemplate=null;S.videoTemplateFields={};saveDB();render()">
          Temizle
        </button>
      </div>
    </div>`;
  }

  o+=`</div>`;
  return o;
}


// ── selectVideoTemplate() — Şablonu seç, field'ları hazırla ──

function selectVideoTemplate(name, prompt) {
  S.activeVideoTemplate = name;
  if(!S.videoTemplateFields) S.videoTemplateFields = {};
  // Ürün adını brief'ten otomatik doldur
  if(S.conceptBrief && !S.videoTemplateFields['urun_adi']) {
    S.videoTemplateFields['urun_adi'] = S.conceptBrief.split(' ').slice(0,4).join(' ');
  }
  // Şablonun base prompt'unu S'e kaydet
  S.activeVideoTemplatePrompt = prompt;
  saveDB();
  render();
  toast('Şablon seçildi: ' + name + ' — metin alanlarını doldur ve "Havuza At" butonuna bas.');
}


// ── applyVideoTemplate() — Field değerlerini prompt'a entegre et ve havuza ekle ──
// (Mevcut applyVideoTemplate() fonksiyonunu bununla değiştir)

function applyVideoTemplate() {
  if(!S.activeVideoTemplate) return toast('Önce bir şablon seçin.');

  var basePrompt = S.activeVideoTemplatePrompt || '';
  var fields = S.videoTemplateFields || {};
  var id = genPromptId();

  // Field değerlerini prompt'a context olarak ekle
  var fieldContext = '';
  var filledFields = Object.entries(fields).filter(([k,v])=>v&&v.trim());
  if(filledFields.length > 0) {
    fieldContext = '\n\n[ON-SCREEN TEXT ELEMENTS: ' +
      filledFields.map(([k,v])=>`${k}="${v}"`).join(', ') + 
      '. Ensure the video composition has intentional negative space for these text overlays.]';
  }

  // Ürün adını prompt'a dahil et
  var finalPrompt = basePrompt + fieldContext;
  if(fields['urun_adi']) {
    finalPrompt = finalPrompt.replace(/{isim}/g, fields['urun_adi']);
  }

  S.promptPool.unshift({
    id: id,
    text: finalPrompt,
    selected: false,
    prodActive: true,
    stratName: '<span style="display:flex;align-items:center;gap:4px"><i data-lucide="layout-template" style="width:12px;height:12px"></i> ' + S.activeVideoTemplate + '</span>',
    color: '#E040FB',
    type: 'video',
    userInput: S.activeVideoTemplate,
    productName: fields['urun_adi'] || S.activeVideoTemplate,
    templateFields: {...fields},   // field değerlerini saklıyoruz
    scores: {prompt_consistency:0, product_consistency:0, felt_right:0}
  });

  saveDB();
  render();
  toast('<span style="display:flex;align-items:center;gap:5px"><i data-lucide="check" style="width:14px;height:14px"></i> Şablon havuza eklendi → ' + S.activeVideoTemplate + '</span>');
}


// ═══════════════════════════════════════════════════════════════
// UI-HAZIRLA.JS — PATCH: Görsel Şablon Sistemi
// renderHazirla() içindeki brief textarea'nın üstüne ekle
// ═══════════════════════════════════════════════════════════════

// ── Görsel Şablon Tanımları ──
// config.js sonuna veya ui-hazirla.js başına ekle

var IMAGE_TEMPLATE_GROUPS = [
  {cat:'E-Ticaret', color:'#43A047', items:[
    {name:'Trendyol Ürün',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:'Örn: Oversize Kazak'},
       {key:'renk_brief',  label:'Renk & Malzeme',placeholder:'Krem rengi yün örgü'},
       {key:'beden',       label:'Beden / Detay',  placeholder:'Oversize, unisex'},
       {key:'fiyat_etiketi',label:'Fiyat Etiketi',placeholder:'299,90 TL (opsiyonel)'},
     ],
     promptTemplate:'Product photography for e-commerce listing. {urun_adi} — {renk_brief}, {beden}. White seamless background 255/255/255. Twin 90cm strip softboxes at 45 degrees. Product fills 70% of frame. No props, no lifestyle elements. Every texture and material detail razor-sharp. Designed for Trendyol product listing. {isim} is the only subject.'},
    {name:'Beyaz Fon Seti',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'acilar',      label:'Açılar',         placeholder:'Ön, yan, detay (virgülle)'},
     ],
     promptTemplate:'Technical product documentation shot. {urun_adi}. Pure white background. {acilar} angles — each composition isolated for catalogue use. Focus-stacked, every millimeter sharp. Neutral daylight color balance. No shadows, no atmosphere. {isim} presented for maximum clarity.'},
    {name:'İndirim Banner',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'indirim',     label:'İndirim Oranı',  placeholder:'%40 İNDİRİM'},
       {key:'fiyat',       label:'Yeni Fiyat',     placeholder:'199 TL'},
       {key:'eski_fiyat',  label:'Eski Fiyat',     placeholder:'329 TL'},
       {key:'cta',         label:'CTA Metni',       placeholder:'Hemen Al'},
     ],
     promptTemplate:'E-commerce sale banner composition. {urun_adi} positioned at right third of frame. Left two-thirds: intentional clean negative space for text overlay — discount badge "{indirim}", price "{fiyat}" (was "{eski_fiyat}"), CTA "{cta}". Background: subtle gradient or clean solid. Product sharp. Designed with text placement intent. 16:9 horizontal format. {isim} clear and confident.'},
  ]},
  {cat:'Sosyal Medya', color:'#E040FB', items:[
    {name:'Instagram Kare',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'tema',        label:'Tema / Mood',    placeholder:'Doğal, minimal, warm'},
       {key:'metin_alani', label:'Metin Alanı',    placeholder:'Alt köşe opsiyonel'},
     ],
     promptTemplate:'Instagram square composition 1:1. {urun_adi}. Theme: {tema}. Product centered with breathing room on all sides. Lifestyle context — real physical environment, not studio. Natural window light from left. Lower third has intentional open space for caption: "{metin_alani}". {isim} is focal point, environment is atmosphere.'},
    {name:'Story Dikey',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'hook_metin',  label:'Hook Metin',     placeholder:'Bunu duydun mu?'},
       {key:'cta_metin',   label:'CTA Metni',      placeholder:'Hemen Kaydır'},
       {key:'fiyat',       label:'Fiyat',          placeholder:''},
     ],
     promptTemplate:'Instagram Story vertical 9:16. {urun_adi}. Product occupies center 60% of frame. Top 15%: open space for hook text "{hook_metin}". Bottom 20%: clear space for CTA "{cta_metin}"{fiyat?", fiyat: "+fiyat:""}. Bright, attention-holding composition. Clean background. Product sharp and confident. {isim} is the hero.'},
    {name:'Lifestyle Sahne',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'ortam',       label:'Ortam',          placeholder:'Sabah mutfak / Yazlık bahçe'},
       {key:'ruh_hali',    label:'Ruh Hali',       placeholder:'Huzurlu, samimi, sıcak'},
     ],
     promptTemplate:'Lifestyle editorial photograph. {urun_adi} in {ortam}. Mood: {ruh_hali}. Real physical environment — not staged. Ambient natural light, no fill. Product used or placed naturally in scene. Subject is living in the moment, not posing for camera. Shot on 35mm f/1.8. {isim} present but not performing.'},
  ]},
  {cat:'Kampanya', color:'#FF5722', items:[
    {name:'Sezon Kampanyası',
     fields:[
       {key:'urun_adi',    label:'Ürün Adı',      placeholder:''},
       {key:'kampanya_adi',label:'Kampanya Adı',   placeholder:'Yaz Sonu İndirimi'},
       {key:'indirim',     label:'İndirim',        placeholder:'%50'},
       {key:'tema_renk',   label:'Tema Rengi',     placeholder:'Turuncu ve beyaz'},
       {key:'bitis',       label:'Bitiş',          placeholder:'31 Ağustos\'a kadar'},
     ],
     promptTemplate:'Campaign hero image for "{kampanya_adi}". {urun_adi}. Color story: {tema_renk}. Product at visual center. Discount badge area "{indirim}" in upper corner — space reserved. Deadline element "{bitis}" visible area at bottom. Energetic, celebratory composition without chaos. Punchy contrast. {isim} confident and clear.'},
    {name:'Çoklu Ürün Grid',
     fields:[
       {key:'urun_grubu',  label:'Ürün Grubu',     placeholder:'Aksesuar koleksiyonu'},
       {key:'adet',        label:'Ürün Adedi',     placeholder:'4'},
       {key:'format',      label:'Format',         placeholder:'2x2 grid / yatay sıra'},
     ],
     promptTemplate:'Multi-product catalogue composition. {urun_grubu} — {adet} products. Layout: {format}. Consistent white seamless background across all products. Matching lighting: twin softboxes at identical angles. Each product gets equal visual weight. Clean product names below each item implied. Perfect for catalogue and collection marketing. {isim} family presented as a cohesive system.'},
  ]},
];


// ── renderImageTemplatePanel() — ui-hazirla.js'e yeni panel ──
// renderHazirla() içinde textarea'nın üstüne şu çağrıyı ekle:
// o += renderImageTemplatePanel();

// IMAGE_TEMPLATE_GROUPS içindeki ikonları şu isimlerle güncellemeni öneririm:
// E-Ticaret -> shopping-cart, Sosyal Medya -> smartphone, Kampanya -> target

function renderImageTemplatePanel() {
  // ... (üst kısımlar aynı)
  IMAGE_TEMPLATE_GROUPS.forEach(g => {
    var isA = activeCat === g.cat;
    // Kategoriye göre ikon seçimi
    const catIconMap = { 'E-Ticaret': 'shopping-cart', 'Sosyal Medya': 'smartphone', 'Kampanya': 'target' };
    const lucideIcon = catIconMap[g.cat] || 'layers';

    o += `<button onclick="S.imageTemplateCat='${g.cat}';S.activeImageTemplate=null;saveDB();render()" 
      style="padding:5px 12px;border-radius:99px;border:1px solid ${isA ? g.color : 'var(--brd)'};background:${isA ? g.color + '18' : 'transparent'};color:${isA ? g.color : 'var(--tx-muted)'};font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px">
      <i data-lucide="${lucideIcon}" style="width:12px;height:12px"></i> ${g.cat}
    </button>`;
  });
  // ...
}

// ── applyImageTemplate() — Field'ları brief textarea'ya aktar ──

function applyImageTemplate() {
  if(!S.activeImageTemplate) return toast('Önce bir şablon seçin.');

  var activeGroup=IMAGE_TEMPLATE_GROUPS.find(g=>g.cat===(S.imageTemplateCat||IMAGE_TEMPLATE_GROUPS[0].cat));
  if(!activeGroup) return;
  var item=activeGroup.items.find(x=>x.name===S.activeImageTemplate);
  if(!item) return;

  var fields=S.imageTemplateFields||{};

  // Şablonun brief metnini oluştur
  var brief=item.fields
    .filter(f=>fields[f.key]&&fields[f.key].trim())
    .map(f=>`${f.label}: ${fields[f.key]}`)
    .join(', ');

  // Zaten var olan brief'in üzerine yaz veya ekle
  S.conceptBrief = brief || S.conceptBrief;

  // Promptu da build et ve doğrudan havuza ata (opsiyonel — şablon kullanıcı)
  // Kullanıcı isterse S.activeImageTemplatePrompt'u generate ederken kullanabiliriz
  S.activeImageTemplatePrompt = item.promptTemplate;
  Object.entries(fields).forEach(([k,v])=>{
    if(v) S.activeImageTemplatePrompt=S.activeImageTemplatePrompt.replace(new RegExp('\\{'+k+'\\}','g'),v);
  });

  saveDB();
  render();
  toast('✅ Brief aktarıldı — "Fikir Üret" butonuna bas.');
}


