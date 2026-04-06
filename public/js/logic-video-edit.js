// ═══════════════════════════════════════════════════════════════
// LOGIC-VIDEO-EDIT.JS — Video Edit Pipeline, Klip Yönetimi, FFmpeg Merge
// ═══════════════════════════════════════════════════════════════

function addClipFromGallery(galleryIdx) {
  var item = S.gallery[galleryIdx];
  if (!item || !item.result) return toast('Geçersiz galeri öğesi.');
  var isVid = item.result && (item.result.includes('.mp4') || item.result.includes('video'));
  if (!isVid) return toast('Sadece video dosyaları eklenebilir. Önce görselden video üretin.');
  var clip = {
    id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    url: item.result,
    thumbUrl: item.result,
    duration: 5,
    text: '',
    promptText: item.prompt || '',
    order: S.videoStudio.clips.length,
    refName: item.ref ? item.ref.name : 'Klip'
  };
  S.videoStudio.clips.push(clip);
  render();
  toast('Klip eklendi! (' + S.videoStudio.clips.length + ' toplam)');
}

function addClipByUrl(url, name) {
  if (!url || !url.trim()) return toast('URL boş.');
  var clip = {
    id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    url: url.trim(),
    thumbUrl: url.trim(),
    duration: 5,
    text: '',
    promptText: '',
    order: S.videoStudio.clips.length,
    refName: name || 'Klip ' + (S.videoStudio.clips.length + 1)
  };
  S.videoStudio.clips.push(clip);
  saveDB();
  render();
  toast('Klip eklendi!');
}

function updateClipText(id, val) {
  var c = S.videoStudio.clips.find(x => x.id === id);
  if (c) c.text = val;
}

function updateClipDuration(id, val) {
  var c = S.videoStudio.clips.find(x => x.id === id);
  if (c) c.duration = parseInt(val) || 5;
}

function removeClip(id) {
  S.videoStudio.clips = S.videoStudio.clips.filter(x => x.id !== id);
  S.videoStudio.clips.forEach((c, i) => c.order = i);
  saveDB();
  render();
}

function moveClip(id, dir) {
  var arr = S.videoStudio.clips;
  var idx = arr.findIndex(x => x.id === id);
  if (idx === -1) return;
  var newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
  arr.forEach((c, i) => c.order = i);
  render();
}

async function generateClipPrompt(clipId) {
  if (!S.claudeKey && !S.envClaudeKey) return toast('Claude API Key gerekli!');
  var clip = S.videoStudio.clips.find(x => x.id === clipId);
  if (!clip) return;
  toast('Klip promptu yazılıyor...');
  try {
    var ctx = clip.promptText ? 'Mevcut prompt: ' + clip.promptText + '\n\n' : '';
    var textCtx = clip.text ? 'Metin overlay: ' + clip.text + '\n\n' : '';
    var res = await callClaude([{
      role: 'user',
      content: [{
        type: 'text',
        text: ctx + textCtx + 'Bu klip için sosyal medya videosuna uygun, dinamik ve akıcı bir video prompt yaz. 2-3 cümle, İngilizce, sinematik kamera hareketi ve ışık tanımla.'
      }]
    }], S.llm, 'Sen uzman video prompt mühendisisin. Sosyal medya reklamları için kısa, güçlü video promptları yazıyorsun.');
    clip.promptText = res;
    saveDB();
    render();
    toast('Prompt üretildi!');
  } catch (e) {
    toast('Hata: ' + e.message);
  }
}

async function mergeVideoClips() {
  if (!S.videoStudio.clips.length) return toast('Klip listesi boş!');
  S.videoStudio.merging = true;
  S.videoStudio.mergeResult = null;
  S.videoStudio.mergeError = null;
  render();
  toast('FFmpeg birleştiriyor...');
  try {
    var payload = {
      clips: S.videoStudio.clips.map(c => ({
        url: c.url,
        duration: c.duration || 5,
        text: c.text || ''
      })),
      transition: S.videoStudio.transition,
      format: S.videoStudio.format,
      textStyle: S.videoStudio.textStyle,
      outputName: S.videoStudio.outputName || 'prime_studio_video'
    };
    var r = await fetch('/api/ffmpeg-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var d = await r.json();
    if (!r.ok || d.error) throw new Error(d.error || 'Birleştirme hatası');
    S.videoStudio.mergeResult = d.video;
    S.videoStudio.merging = false;

    S.gallery.unshift({
      id: 'edit_' + Date.now(),
      ref: { name: S.videoStudio.outputName || 'Edit_Pipeline', url: S.videoStudio.clips[0].thumbUrl },
      prompt: S.videoStudio.clips.map(c => c.text || c.promptText).filter(Boolean).join(' | '),
      status: 'done',
      result: d.video,
      batch: 'Video_Edit_' + new Date().toLocaleDateString('tr-TR'),
      model: 'ffmpeg',
      strat: 'Edit Pipeline (' + S.videoStudio.clips.length + ' klip)',
      flagged: false,
      note: '',
      scores: { tutarlilik: 0, dogallik: 0, yeterlilik: 0 }
    });
    addSpent(0);
    saveDB(true);
    render();
    toast('Video hazır! ' + d.fileSize + 'KB — ' + d.clipCount + ' klip birleştirildi.');
  } catch (e) {
    S.videoStudio.merging = false;
    S.videoStudio.mergeError = e.message;
    render();
    toast('FFmpeg Hatası: ' + e.message);
  }
}

function downloadMergedVideo() {
  if (!S.videoStudio.mergeResult) return;
  var a = document.createElement('a');
  a.href = S.videoStudio.mergeResult;
  a.download = (S.videoStudio.outputName || 'prime_studio_video') + '.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
