// ═══════════════════════════════════════════════════════════════
// Prime Studio — Backend Sunucu (server.js)
// V14.1: FFmpeg Video Edit Pipeline eklendi
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { execSync, exec } = require('child_process');
const os = require('os');
const jwt = require('jsonwebtoken');

// FFmpeg path — Windows/Mac/Linux otomatik tespit
function findFFmpeg() {
  const candidates = [
    process.env.FFMPEG_PATH,           // .env'den override
    'ffmpeg',                           // PATH'de varsa
    '/usr/bin/ffmpeg',                  // Linux
    '/usr/local/bin/ffmpeg',            // Mac Homebrew
    'C:\\ffmpeg\\bin\\ffmpeg.exe',       // Windows klasik
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
  ].filter(Boolean);
  for (const p of candidates) {
    try { execSync(`"${p}" -version`, { stdio: 'pipe' }); return p; } catch (e) {}
  }
  return null;
}
const FFMPEG_BIN = findFFmpeg();

// .env dosyasını oku
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
    console.log('✅ .env dosyası yüklendi.');
  }
} catch (e) {
  console.warn('⚠️ .env dosyası okunamadı:', e.message);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(express.static('public', {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

// ─── AUTH ───
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Giriş gerekli.' });
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) { console.error('SUPABASE_JWT_SECRET eksik!'); return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' }); }
  try {
    const decoded = jwt.verify(auth.slice(7), secret);
    req.userId = decoded.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' });
  }
}

// ─── PER-USER VERİ YOLLARI ───
function getUserPaths(userId) {
  const dir = path.join(__dirname, 'data', 'users', userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return {
    main:     path.join(dir, 'hafiza.json'),
    gallery:  path.join(dir, 'hafiza-gallery.json'),
    queue:    path.join(dir, 'hafiza-queue.json'),
    learning: path.join(dir, 'hafiza-learning.json'),
  };
}

const GALLERY_KEYS  = new Set(['gallery', 'archive']);
const QUEUE_KEYS    = new Set(['queue', 'imgs', 'masterRef', 'masterFace', 'masterRefs', 'conceptImgs']);
const LEARNING_KEYS = new Set(['learningData', 'modelStats', 'projectMemory', 'styleMemory']);

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return {}; }
}

function readAllDB(userId) {
  const p = getUserPaths(userId);
  return {
    ...readFile(p.main),
    ...readFile(p.gallery),
    ...readFile(p.queue),
    ...readFile(p.learning)
  };
}

// ─── 1. VERİ YÜKLEME ───
app.get('/api/load', requireAuth, (req, res) => {
  try {
    const data = readAllDB(req.userId);
    if (process.env.FAL_KEY) delete data.key;
    if (process.env.ANTHROPIC_KEY) delete data.claudeKey;
    res.json(data);
  } catch (e) {
    console.error('DB okuma hatası:', e);
    res.json({});
  }
});

// ─── 2. VERİ KAYDETME ───
app.post('/api/save', requireAuth, (req, res) => {
  try {
    const incoming = req.body;
    const p = getUserPaths(req.userId);

    const galleryPart  = {};
    const queuePart    = {};
    const learningPart = {};
    const settingsPart = {};

    for (const [k, v] of Object.entries(incoming)) {
      if (GALLERY_KEYS.has(k))       galleryPart[k]  = v;
      else if (QUEUE_KEYS.has(k))    queuePart[k]    = v;
      else if (LEARNING_KEYS.has(k)) learningPart[k] = v;
      else                           settingsPart[k] = v;
    }

    if (galleryPart.gallery) {
      galleryPart.gallery = galleryPart.gallery.map(item => {
        if (item.result && item.result.startsWith('data:')) item.result = null;
        return item;
      });
    }

    if (process.env.FAL_KEY) delete settingsPart.key;
    if (process.env.ANTHROPIC_KEY) delete settingsPart.claudeKey;

    const writeIfNotEmpty = (filePath, part) => {
      if (Object.keys(part).length === 0) return;
      const existing = readFile(filePath);
      fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...part }, null, 2));
    };

    writeIfNotEmpty(p.main,     settingsPart);
    writeIfNotEmpty(p.gallery,  galleryPart);
    writeIfNotEmpty(p.queue,    queuePart);
    writeIfNotEmpty(p.learning, learningPart);

    res.json({ success: true });
  } catch (e) {
    console.error('DB kayıt hatası:', e);
    res.status(500).json({ error: 'Yazma hatası: ' + e.message });
  }
});

// ─── 3. CLAUDE API KÖPRÜSÜ ───
app.post('/api/claude', async (req, res) => {
  const { apiKey, model, max_tokens, system, messages } = req.body;
  const resolvedKey = process.env.ANTHROPIC_KEY || apiKey;
  if (!resolvedKey) {
    return res.status(400).json({ error: 'Anthropic API Key bulunamadı.' });
  }
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model || 'claude-sonnet-4-6',
      max_tokens: max_tokens || 4000,
      system: system,
      messages: messages
    }, {
      headers: {
        'x-api-key': resolvedKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 60000
    });
    res.json({ text: response.data.content[0].text });
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('Claude API Hatası:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// ─── 4. FAL STORAGE UPLOAD ───
app.post('/api/fal-upload', async (req, res) => {
  const resolvedKey = process.env.FAL_KEY;
  if (!resolvedKey) return res.status(400).json({ error: 'FAL_KEY eksik' });
  try {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const uploadRes = await axios.post('https://api.fal.ai/v1/storage/upload', buffer, {
          headers: {
            'Authorization': `Key ${resolvedKey}`,
            'Content-Type': req.headers['content-type']
          },
          maxBodyLength: 100 * 1024 * 1024,
          timeout: 60000
        });
        res.json({ url: uploadRes.data.url || uploadRes.data.access_url });
      } catch (e) {
        console.error('Fal storage upload hatası:', e.message);
        res.status(500).json({ error: e.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 5. FAL.AI PROXY ───
app.post('/api/fal', async (req, res) => {
  const { endpoint, body, falKey } = req.body;
  const resolvedKey = process.env.FAL_KEY || falKey;
  if (!resolvedKey) return res.status(400).json({ error: 'Fal.ai API Key bulunamadı.' });
  if (!endpoint) return res.status(400).json({ error: 'Endpoint belirtilmedi.' });
  try {
    const response = await axios.post(`https://fal.run/${endpoint}`, body, {
      headers: {
        'Authorization': `Key ${resolvedKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000,
      maxBodyLength: 100 * 1024 * 1024,
      maxContentLength: 100 * 1024 * 1024
    });
    res.json(response.data);
  } catch (error) {
    const errData = error.response?.data;
    const errMsg = errData?.detail || errData?.error || errData?.message || error.message;
    console.error('Fal.ai Hatası:', errMsg, '| Endpoint:', endpoint);
    res.status(error.response?.status || 500).json({ error: errMsg });
  }
});

// ─── 6. ENV DURUM ───
app.get('/api/env-status', (req, res) => {
  res.json({
    hasFalKey: !!process.env.FAL_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_KEY,
  });
});

// ─── 7. TELEGRAM ───
app.post('/api/telegram', async (req, res) => {
  const { token, chatId, text } = req.body;
  if (!token || !chatId) return res.status(400).json({ error: 'Token veya Chat ID eksik.' });
  try {
    const cleanToken = token.replace(/^bot/i, '').trim();
    const response = await axios.post(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      chat_id: chatId.trim(),
      text: text
    });
    res.json(response.data);
  } catch (error) {
    console.error('Telegram Hatası:', error.response?.data || error.message);
    res.status(500).json({ error: 'Telegram mesajı gönderilemedi.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ─── 8. GALERİ YÖNETİMİ ───
// ═══════════════════════════════════════════════════════════════

function readGalleryDB(userId) {
  const p = getUserPaths(userId);
  try { return JSON.parse(fs.readFileSync(p.gallery, 'utf8')); } catch(e) { return {}; }
}
function writeGalleryDB(userId, data) {
  const p = getUserPaths(userId);
  fs.writeFileSync(p.gallery, JSON.stringify(data, null, 2));
}

app.delete('/api/gallery/:idx', requireAuth, (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const db = readGalleryDB(req.userId);
    if (!db.gallery || idx < 0 || idx >= db.gallery.length)
      return res.status(404).json({ error: 'Öğe bulunamadı' });
    db.gallery.splice(idx, 1);
    writeGalleryDB(req.userId, db);
    res.json({ success: true, remaining: db.gallery.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gallery/delete-batch', requireAuth, (req, res) => {
  try {
    const { indices } = req.body;
    if (!Array.isArray(indices)) return res.status(400).json({ error: 'indices dizisi gerekli' });
    const db = readGalleryDB(req.userId);
    if (!db.gallery) return res.json({ success: true, remaining: 0 });
    [...indices].sort((a, b) => b - a).forEach(i => { if (i >= 0 && i < db.gallery.length) db.gallery.splice(i, 1); });
    writeGalleryDB(req.userId, db);
    res.json({ success: true, remaining: db.gallery.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gallery/archive/:idx', requireAuth, (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const db = readGalleryDB(req.userId);
    if (!db.gallery || idx < 0 || idx >= db.gallery.length)
      return res.status(404).json({ error: 'Öğe bulunamadı' });
    if (!db.archive) db.archive = [];
    const item = db.gallery.splice(idx, 1)[0];
    item.archivedAt = new Date().toISOString();
    db.archive.push(item);
    writeGalleryDB(req.userId, db);
    res.json({ success: true, archiveCount: db.archive.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gallery/archive-batch', requireAuth, (req, res) => {
  try {
    const { indices } = req.body;
    if (!Array.isArray(indices)) return res.status(400).json({ error: 'indices dizisi gerekli' });
    const db = readGalleryDB(req.userId);
    if (!db.gallery) return res.json({ success: true });
    if (!db.archive) db.archive = [];
    [...indices].sort((a, b) => b - a).forEach(i => {
      if (i >= 0 && i < db.gallery.length) {
        const item = db.gallery.splice(i, 1)[0];
        item.archivedAt = new Date().toISOString();
        db.archive.push(item);
      }
    });
    writeGalleryDB(req.userId, db);
    res.json({ success: true, archiveCount: db.archive.length, remaining: db.gallery.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/archive/restore/:idx', requireAuth, (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const db = readGalleryDB(req.userId);
    if (!db.archive || idx < 0 || idx >= db.archive.length)
      return res.status(404).json({ error: 'Arşiv öğesi bulunamadı' });
    if (!db.gallery) db.gallery = [];
    const item = db.archive.splice(idx, 1)[0];
    delete item.archivedAt;
    db.gallery.push(item);
    writeGalleryDB(req.userId, db);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/archive/:idx', requireAuth, (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const db = readGalleryDB(req.userId);
    if (!db.archive || idx < 0 || idx >= db.archive.length)
      return res.status(404).json({ error: 'Arşiv öğesi bulunamadı' });
    db.archive.splice(idx, 1);
    writeGalleryDB(req.userId, db);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// ─── 9. FFmpeg VIDEO MERGE (YENİ) ───
// Birden fazla video URL'ini indir → birleştir → geçiş ekle → döndür
// ═══════════════════════════════════════════════════════════════

// Yardımcı: URL'den geçici dosyaya indir
async function downloadToTemp(url, ext = 'mp4') {
  const tmpFile = path.join(os.tmpdir(), `ps_clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
  fs.writeFileSync(tmpFile, Buffer.from(response.data));
  return tmpFile;
}

// Yardımcı: FFmpeg komutu çalıştır (Promise)
function runFFmpeg(cmd) {
  if (!FFMPEG_BIN) return Promise.reject(new Error('FFmpeg bulunamadı. https://ffmpeg.org/download.html adresinden indirin ve PATH\'e ekleyin.'));
  // Komuttaki bare "ffmpeg" ifadelerini gerçek path ile değiştir
  const realCmd = cmd.replace(/^ffmpeg /, `"${FFMPEG_BIN}" `).replace(/ ffmpeg /g, ` "${FFMPEG_BIN}" `);
  return new Promise((resolve, reject) => {
    exec(realCmd, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

// Yardımcı: Geçici dosyaları temizle
function cleanTemp(files) {
  files.forEach(f => { try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {} });
}

app.post('/api/ffmpeg-merge', async (req, res) => {
  /*
    Beklenen body:
    {
      clips: [
        { url: "https://...", duration: 5, text: "Başlık Metni" },  // text opsiyonel
        ...
      ],
      transition: "fade" | "dissolve" | "cut",   // varsayılan: fade
      format: "reels" | "landscape" | "square",  // varsayılan: reels (9:16)
      outputName: "sozyal_medya_video",           // dosya adı
      textStyle: "instagram" | "minimal" | "bold" // metin stili
    }
  */
  const { clips, transition = 'fade', format = 'reels', outputName = 'output', textStyle = 'minimal' } = req.body;

  if (!FFMPEG_BIN) {
    return res.status(500).json({ error: 'FFmpeg sunucuda bulunamadı. Lütfen FFmpeg kurun ve PATH\'e ekleyin veya .env\'e FFMPEG_PATH ekleyin.' });
  }
  if (!clips || !Array.isArray(clips) || clips.length < 1) {
    return res.status(400).json({ error: 'En az 1 clip gerekli.' });
  }

  const tmpFiles = [];
  const normalizedFiles = [];
  const outputFile = path.join(os.tmpdir(), `ps_merged_${Date.now()}.mp4`);
  const concatList = path.join(os.tmpdir(), `ps_concat_${Date.now()}.txt`);

  try {
    console.log(`🎬 FFmpeg merge başlıyor: ${clips.length} klip, format: ${format}, geçiş: ${transition}`);

    // Format ayarları
    const formats = {
      reels:     { w: 1080, h: 1920, desc: '9:16 Reels/TikTok' },
      landscape: { w: 1920, h: 1080, desc: '16:9 YouTube/Landscape' },
      square:    { w: 1080, h: 1080, desc: '1:1 Instagram Kare' }
    };
    const fmt = formats[format] || formats.reels;

    // Her klibi indir ve normalize et (aynı boyut/fps/codec)
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      console.log(`  ⬇️  Klip ${i + 1}/${clips.length} indiriliyor...`);

      const rawFile = await downloadToTemp(clip.url, 'mp4');
      tmpFiles.push(rawFile);

      const normFile = path.join(os.tmpdir(), `ps_norm_${Date.now()}_${i}.mp4`);
      tmpFiles.push(normFile);

      // Metin overlay oluştur (varsa)
      let drawTextFilter = '';
      if (clip.text && clip.text.trim()) {
        const safeText = clip.text.replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/\[/g, "\\[").replace(/\]/g, "\\]");

        if (textStyle === 'instagram') {
          // Instagram yorum efekti - aşağıdan yukarı kayar
          drawTextFilter = `,drawbox=x=0:y=ih-200:w=iw:h=200:color=black@0.5:t=fill,` +
            `drawtext=text='${safeText}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h-120:` +
            `fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:` +
            `shadowcolor=black@0.8:shadowx=2:shadowy=2:` +
            `enable='between(t,0.3,${clip.duration || 5})'`;
        } else if (textStyle === 'bold') {
          // Büyük beyaz metin üstte
          drawTextFilter = `,drawtext=text='${safeText}':fontsize=72:fontcolor=white:` +
            `x=(w-text_w)/2:y=120:` +
            `fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:` +
            `shadowcolor=black:shadowx=3:shadowy=3:box=1:boxcolor=black@0.3:boxborderw=20`;
        } else {
          // Minimal - küçük altyazı
          drawTextFilter = `,drawtext=text='${safeText}':fontsize=44:fontcolor=white@0.9:` +
            `x=(w-text_w)/2:y=h-80:` +
            `fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:` +
            `shadowcolor=black@0.6:shadowx=1:shadowy=1`;
        }
      }

      // Normalize: boyut, fps, codec standardize et + metin ekle
      const normCmd = `ffmpeg -i "${rawFile}" -vf "scale=${fmt.w}:${fmt.h}:force_original_aspect_ratio=decrease,pad=${fmt.w}:${fmt.h}:(ow-iw)/2:(oh-ih)/2:color=black${drawTextFilter}" -r 30 -c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 -ac 2 -y "${normFile}"`;
      await runFFmpeg(normCmd);
      normalizedFiles.push(normFile);
    }

    let finalOutput = outputFile;

    if (transition === 'cut' || clips.length === 1) {
      // Basit concat (kesme geçişi)
      const listContent = normalizedFiles.map(f => `file '${f}'`).join('\n');
      fs.writeFileSync(concatList, listContent);
      tmpFiles.push(concatList);

      const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatList}" -c copy -y "${outputFile}"`;
      await runFFmpeg(concatCmd);

    } else if (transition === 'fade' || transition === 'dissolve') {
      // Fade/dissolve geçişleri — xfade filtresi
      const fadeDur = transition === 'dissolve' ? 0.8 : 0.5;

      if (normalizedFiles.length === 1) {
        // Tek dosya, kopyala
        fs.copyFileSync(normalizedFiles[0], outputFile);
      } else {
        // Kümülatif offset hesapla
        let filterParts = [];
        let inputArgs = normalizedFiles.map(f => `-i "${f}"`).join(' ');

        // Klip sürelerini al
        const durations = [];
        for (const nf of normalizedFiles) {
          try {
            const ffprobeBin = FFMPEG_BIN ? FFMPEG_BIN.replace(/ffmpeg([^/\\\\]*)$/, 'ffprobe$1') : 'ffprobe';
            const probeOut = execSync(`"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${nf}"`).toString().trim();
            durations.push(parseFloat(probeOut) || 5);
          } catch (e) {
            durations.push(5);
          }
        }

        // xfade zinciri oluştur
        let prevLabel = '[0:v]';
        let prevALabel = '[0:a]';
        let offset = durations[0] - fadeDur;

        for (let i = 1; i < normalizedFiles.length; i++) {
          const outLabel = i === normalizedFiles.length - 1 ? '[vout]' : `[v${i}]`;
          const outALabel = i === normalizedFiles.length - 1 ? '[aout]' : `[a${i}]`;
          filterParts.push(`${prevLabel}[${i}:v]xfade=transition=fade:duration=${fadeDur}:offset=${offset.toFixed(2)}${outLabel}`);
          filterParts.push(`${prevALabel}[${i}:a]acrossfade=d=${fadeDur}${outALabel}`);
          prevLabel = `[v${i}]`;
          prevALabel = `[a${i}]`;
          if (i < normalizedFiles.length - 1) offset += durations[i] - fadeDur;
        }

        const filterComplex = filterParts.join(';');
        const xfadeCmd = `ffmpeg ${inputArgs} -filter_complex "${filterComplex}" -map "[vout]" -map "[aout]" -c:v libx264 -preset fast -crf 23 -c:a aac -y "${outputFile}"`;
        await runFFmpeg(xfadeCmd);
      }
    }

    // Çıktıyı oku ve base64 olarak döndür
    if (!fs.existsSync(finalOutput)) {
      throw new Error('FFmpeg çıktı dosyası oluşturulamadı.');
    }

    const outputBuffer = fs.readFileSync(finalOutput);
    const base64Video = outputBuffer.toString('base64');
    const fileSizeKB = Math.round(outputBuffer.length / 1024);

    console.log(`✅ FFmpeg merge tamamlandı: ${fileSizeKB}KB, ${clips.length} klip, ${fmt.desc}`);

    // Geçici dosyaları temizle
    tmpFiles.push(finalOutput);
    cleanTemp(tmpFiles);

    res.json({
      success: true,
      video: `data:video/mp4;base64,${base64Video}`,
      fileSize: fileSizeKB,
      clipCount: clips.length,
      format: fmt.desc
    });

  } catch (err) {
    console.error('FFmpeg merge hatası:', err.message);
    tmpFiles.push(outputFile);
    cleanTemp(tmpFiles);
    res.status(500).json({ error: 'Video birleştirme hatası: ' + err.message });
  }
});

// ─── 10. FFmpeg DURUM KONTROLÜ ───
app.get('/api/ffmpeg-status', (req, res) => {
  if (!FFMPEG_BIN) return res.json({ available: false, error: 'FFmpeg PATH\'de bulunamadı. https://ffmpeg.org/download.html adresinden indirin.' });
  try {
    const version = execSync(`"${FFMPEG_BIN}" -version`).toString().split('\n')[0];
    res.json({ available: true, version, path: FFMPEG_BIN });
  } catch (e) {
    res.json({ available: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Prime Studio Sunucusu başlatıldı!`);
  console.log(`   📡 Adres     : http://localhost:${PORT}`);
  console.log(`   📁 Veri dizini: data/users/{userId}/`);
  console.log(`   🔑 Fal Key   : ${process.env.FAL_KEY ? '✅ .env\'den yüklendi' : '⚠️  Ayarlar\'dan girilecek'}`);
  console.log(`   🤖 Claude Key: ${process.env.ANTHROPIC_KEY ? '✅ .env\'den yüklendi' : '⚠️  Ayarlar\'dan girilecek'}`);

  // FFmpeg kontrolü
  if (FFMPEG_BIN) {
    try {
      const ffv = execSync(`"${FFMPEG_BIN}" -version`).toString().split('\n')[0];
      console.log(`   🎬 FFmpeg    : ✅ ${ffv.replace('ffmpeg version ', '')} (${FFMPEG_BIN})`);
    } catch(e) { console.log(`   🎬 FFmpeg    : ⚠️  Path bulundu ama çalışmıyor: ${FFMPEG_BIN}`); }
  } else {
    console.log(`   🎬 FFmpeg    : ❌ Bulunamadı!`);
    console.log(`      ➜ Windows: https://ffmpeg.org/download.html → bin klasörünü PATH'e ekle`);
    console.log(`      ➜ Mac: brew install ffmpeg`);
    console.log(`      ➜ Linux: sudo apt install ffmpeg`);
    console.log(`      ➜ Veya .env'e FFMPEG_PATH=/tam/yol/ffmpeg ekle`);
  }
  console.log('');
});