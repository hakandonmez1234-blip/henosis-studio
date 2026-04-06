// ═══════════════════════════════════════════════════════════════
// UI-LEARN.JS — V2.0
// YENİ: Günlük Günce sistemi — soyut sorular, felsefi modelleme,
//       kişisel sembolik profil (Claude API ile)
// KORUNAN: Model istatistikleri, Skorlama paneli
// ═══════════════════════════════════════════════════════════════

function renderLearn(){
  var o = '';

  // ══════════════════════════════════════════════════════════════
  // 1. GÜNLÜK GÜNCE
  // ══════════════════════════════════════════════════════════════
  var journal = S.journal || { entries: [], profile: '', lastAsked: null, todayAnswered: false };
  var today   = new Date().toDateString();
  var alreadyAnswered = journal.lastAsked === today;

  // Soyut sorular havuzu
  var SOYUT_SORULAR = [
    "Bugün mutluluk sana nasıl göründü?",
    "Huzur deyince aklına ilk gelen şey nedir?",
    "Bugün seni en çok ne meşgul etti — ama gerçekten?",
    "Şu an içinde ne taşıyorsun?",
    "Güzellik bugün nerede belirdi?",
    "Bir şeyi bırakmak istediysen, neydi?",
    "Bugün bir şey seni şaşırttı mı? Ne?",
    "Zaman kavramın bugün nasıldı — hızlı mı, ağır mı?",
    "Seni dinleyen biri olsaydı, ne söylerdin?",
    "Bugün neyin farkında oldun — daha önce görmediğin?",
    "Yaratıcılık bugün nerede kendini gösterdi?",
    "Bir renk olsaydın bugün, hangi renk olurdun ve neden?",
    "Bugün içinde bir çelişki var mıydı?",
    "En rahat hissettiğin an neydi bugün?",
    "Bir şeyin özünü bugün fark ettin mi?"
  ];

  // Bugünün sorusunu belirle (tarih bazlı seed — her gün sabit ama farklı)
  var dayIndex = Math.floor(Date.now() / 86400000) % SOYUT_SORULAR.length;
  var bugunsoru = SOYUT_SORULAR[dayIndex];

  o += `<div class="sec sec-glow" style="margin-bottom:20px">
    <div class="sec-title" style="margin-bottom:4px">
      Günlük Günce
      <span style="font-size:9px;padding:3px 10px;border-radius:99px;background:rgba(184,92,30,0.15);color:var(--ac-orange);border:1px solid rgba(184,92,30,0.25);font-family:Inter,sans-serif">
        ${journal.entries ? journal.entries.length : 0} gün
      </span>
    </div>
    <div style="font-size:11px;color:var(--tx-muted);margin-bottom:18px">
      Her gün bir soru. Cevapların zamanla seni modelliyor — prompt kaliteni artırıyor.
    </div>`;

  if (alreadyAnswered) {
    // Bugün cevaplandı
    var todayEntry = (journal.entries || []).find(e => e.date === today);
    o += `<div style="background:rgba(74,175,122,0.08);border:1px solid rgba(74,175,122,0.2);border-radius:14px;padding:16px;margin-bottom:14px">
      <div style="font-size:10px;color:var(--green);font-weight:700;letter-spacing:0.8px;margin-bottom:8px">BUGÜN CEVAPLANDI ✓</div>
      <div style="font-size:12px;color:var(--tx-muted);font-style:italic;margin-bottom:6px">"${h(bugunsoru)}"</div>
      ${todayEntry ? `<div style="font-size:13px;color:var(--tx-main);line-height:1.7">${h(todayEntry.answer)}</div>` : ''}
    </div>`;
  } else {
    // Bugün henüz cevaplanmadı
    o += `<div style="background:var(--bg-cream);border:1px solid var(--brd);border-radius:14px;padding:20px;margin-bottom:14px">
      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;letter-spacing:0.8px;margin-bottom:10px">BUGÜNÜN SORUSU</div>
      <div style="font-size:15px;color:var(--tx-main);line-height:1.6;font-family:'Playfair Display',serif;font-style:italic;margin-bottom:16px">"${h(bugunsoru)}"</div>
      <textarea id="journal-inp" class="inp" style="min-height:90px;resize:none;font-size:13px;line-height:1.7"
        placeholder="İçini dök… kısa da olur, uzun da. Yargı yok."></textarea>
      <button class="bp" style="width:100%;margin-top:10px;padding:12px;font-size:13px"
        onclick="saveJournalEntry('${bugunsoru.replace(/'/g,"\\'")}')">
        Kaydet & Modelle
      </button>
    </div>`;
  }

  // Kişisel sembolik profil
  if (journal.profile) {
    o += `<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:0.8px;margin-bottom:8px">KİŞİSEL PROFİL</div>
      <div style="background:var(--bg-card);border:1px solid var(--brd-soft);border-radius:12px;padding:14px;font-size:12px;color:var(--tx-muted);line-height:1.75">${h(journal.profile)}</div>
    </div>`;
  }

  // Son günce girişleri
  if (journal.entries && journal.entries.length > 0) {
    o += `<details style="margin-top:4px">
      <summary style="cursor:pointer;font-size:11px;color:var(--tx-muted);font-weight:600;letter-spacing:0.5px;list-style:none;display:flex;align-items:center;gap:6px">
        <span>▸</span> Geçmiş Girişler (${journal.entries.length})
      </summary>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
        ${[...journal.entries].reverse().slice(0, 10).map(e => `
          <div style="background:var(--bg-card);border:1px solid var(--brd-soft);border-radius:10px;padding:10px 13px">
            <div style="font-size:9px;color:var(--tx-muted);margin-bottom:4px;font-weight:600">${e.date}</div>
            <div style="font-size:10px;color:var(--ac-warm);font-style:italic;margin-bottom:5px">"${h(e.question)}"</div>
            <div style="font-size:11px;color:var(--tx-main);line-height:1.6">${h(e.answer)}</div>
          </div>`).join('')}
      </div>
    </details>`;
  }

  o += `</div>`;

  // ══════════════════════════════════════════════════════════════
  // 2. SEZGİSEL ÖĞRENİM (eski sistem — korunuyor)
  // ══════════════════════════════════════════════════════════════
  var ld = S.learningData || { records: [], distilled: '', lastDistillCount: 0 };
  var scoredCount = ld.records.filter(r => r.scores && r.scores.felt_right > 0).length;

  o += `<div class="sec">
    <div class="sec-title">Sezgisel Öğrenim
      <span style="font-size:9px;padding:3px 10px;border-radius:99px;background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.3);font-family:Inter,sans-serif">${scoredCount} kayıt</span>
    </div>
    ${ld.distilled
      ? `<div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:14px;margin-bottom:14px;font-size:12px;color:var(--tx-muted);line-height:1.7">${h(ld.distilled)}</div>`
      : `<div style="font-size:12px;color:var(--tx-muted);margin-bottom:14px">Henüz öğrenim yok. Havuzdaki promptları puanla, sistem öğrensin.</div>`}
    <div class="fc g8" style="flex-wrap:wrap">
      <button class="learn-save-btn" style="flex:1"
        onclick="_distillLearning(S.learningData.records.filter(r=>r.scores&&r.scores.felt_right>0)).then(()=>{saveDB();render();toast&&toast('Profil güncellendi!')})">
        Güncelle
      </button>
      <button class="learn-save-btn" style="flex:1;background:rgba(248,113,113,0.15);color:var(--red)"
        onclick="if(confirm('Öğrenim sıfırlansın?')){S.learningData={records:[],distilled:'',lastDistillCount:0};saveDB();render()}">
        Sıfırla
      </button>
    </div>
    // distilled div'inden sonra, butonlardan önce:
${S.learningData && S.learningData.patterns && S.learningData.patterns.lastUpdated ? `
  <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
    ${(S.learningData.patterns.highScoreStrategies||[]).map(s=>
      `<span style="font-size:10px;padding:3px 10px;border-radius:99px;background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.25)">✓ ${s}</span>`
    ).join('')}
    ${(S.learningData.patterns.avoidStrategies||[]).map(s=>
      `<span style="font-size:10px;padding:3px 10px;border-radius:99px;background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.25)">✗ ${s}</span>`
    ).join('')}
  </div>
` : ''}
    ${scoredCount > 0 ? `<div style="margin-top:14px">
      <div style="font-size:10px;font-weight:700;color:var(--tx-muted);letter-spacing:1px;margin-bottom:8px">SON KAYITLAR</div>
      ${ld.records.filter(r => r.scores && r.scores.felt_right > 0).slice(0, 5).map(r => {
        var avg = ((r.scores.prompt_consistency || 0) + (r.scores.product_consistency || 0) + (r.scores.felt_right || 0)) / 3;
        return `<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:8px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
          <div style="font-size:11px;color:var(--tx-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h((r.userInput || '').substring(0, 60) || r.stratName)}</div>
          <div style="font-size:12px;font-weight:700;color:${avg >= 4 ? 'var(--green)' : avg >= 2.5 ? 'var(--ac-peach)' : 'var(--red)'}">${avg.toFixed(1)}/5</div>
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`;

  // ══════════════════════════════════════════════════════════════
  // 3. MODEL İSTATİSTİKLERİ
  // ══════════════════════════════════════════════════════════════
  var msKeys = Object.keys(S.modelStats || {});
  if (msKeys.length > 0) {
    o += `<div class="sec"><div class="sec-title">Model İstatistikleri</div>
      ${msKeys.map(key => {
        var ms = S.modelStats[key];
        var modelName = M && M[key] ? M[key].n : key;
        var avgDur  = ms.count > 0 ? Math.round(ms.totalDuration / ms.count) : 0;
        var avgScore = ms.scoredCount > 0 ? (ms.totalScore / ms.scoredCount).toFixed(1) : null;
        var scoreColor = avgScore >= 7 ? 'var(--green)' : avgScore >= 4 ? 'var(--ac-orange)' : 'var(--red)';
        return `<div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:12px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:var(--tx-main);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(modelName)}</div>
            <div style="font-size:10px;color:var(--tx-muted)">${ms.count} üretim</div>
          </div>
          <div style="text-align:center;min-width:52px">
            <div style="font-size:16px;font-weight:800;color:var(--ac-peach)">${avgDur > 0 ? avgDur + 's' : '—'}</div>
            <div style="font-size:9px;color:var(--tx-muted);letter-spacing:0.5px">ORT. SÜRE</div>
          </div>
          ${avgScore ? `<div style="text-align:center;min-width:40px">
            <div style="font-size:16px;font-weight:800;color:${scoreColor}">${avgScore}</div>
            <div style="font-size:9px;color:var(--tx-muted);letter-spacing:0.5px">SKOR</div>
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // 4. SKORLAMA PANELİ
  // ══════════════════════════════════════════════════════════════
  o += `<div class="sec"><div class="sec-title">Skorlama Paneli</div>
    ${(S.gallery || []).map((it, gi) => {
      var sc = it.scores || {};
      var t  = sc.tutarlilik  || 0;
      var d  = sc.dogallik    || 0;
      var y  = sc.yeterlilik  || 0;
      var gp = (t || d || y) ? ((t + d + y) / 3) : 0;
      var bc = gp >= 7 ? 'var(--green)' : gp >= 4 ? 'var(--ac-orange)' : 'var(--red)';
      return `<div style="background:var(--bg-card);border:1px solid var(--brd);border-radius:14px;padding:12px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:48px;height:48px;border-radius:10px;overflow:hidden;flex-shrink:0">
            <img src="${it.result}" style="width:100%;height:100%;object-fit:cover">
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--tx-main);margin-bottom:3px">${h(it.ref ? it.ref.name : '')}</div>
            ${gp > 0
              ? `<div style="font-size:10px;color:var(--tx-muted)">Genel: <span style="font-weight:700;color:${bc}">${gp.toFixed(1)}</span> / 10</div>`
              : `<div style="font-size:10px;color:var(--tx-muted)">Henüz puanlanmadı</div>`}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${[['tutarlilik','Tutarlilik','Brief ile sonuç örtüşüyor mu','var(--ac-peach)'],
             ['dogallik','Dogallik','AI / Photoshop hissi yok mu','var(--green)'],
             ['yeterlilik','Yeterlilik','Genel kalite yeterli mi','var(--ac-orange)']].map(([type, label, tip, color]) => {
            let val = sc[type] || 0;
            return `<div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <span style="font-size:10px;font-weight:600;color:var(--tx-muted);letter-spacing:0.3px">${label.toUpperCase()}</span>
                <span style="font-size:10px;color:var(--tx-muted)">${tip}</span>
                <span style="font-size:11px;font-weight:700;color:${val > 0 ? color : 'var(--tx-muted)'};min-width:24px;text-align:right">${val > 0 ? val : '-'}</span>
              </div>
              <div class="score-bar" data-gi="${gi}" data-type="${type}"onclick="handleScoreClick(event);_bridgeGalleryScoreToLearning(S.gallery[parseInt(this.dataset.gi)])""
                style="cursor:pointer;height:6px;border-radius:99px;background:rgba(0,0,0,0.2);overflow:hidden">
                <div style="height:100%;width:${val * 10}%;background:${color};border-radius:99px;transition:width 0.3s ease"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('') || '<div class="uz">Skorlanacak görsel yok.</div>'}
  </div>`;

  return o;
}

// ══════════════════════════════════════════════════════════════
// GÜNCE AKSİYON FONKSİYONLARI
// ══════════════════════════════════════════════════════════════

async function saveJournalEntry(question) {
  var inp = document.getElementById('journal-inp');
  if (!inp || !inp.value.trim()) return;
  var answer = inp.value.trim();
  var today  = new Date().toDateString();

  if (!S.journal) S.journal = { entries: [], profile: '', lastAsked: null };

  // Girişi kaydet
  S.journal.entries = S.journal.entries || [];
  // Bugün zaten varsa güncelle, yoksa ekle
  var existIdx = S.journal.entries.findIndex(e => e.date === today);
  var entry = { date: today, question, answer, ts: Date.now() };
  if (existIdx >= 0) S.journal.entries[existIdx] = entry;
  else S.journal.entries.push(entry);
  S.journal.lastAsked = today;

  saveDB();
  render(); // Önce kaydet göster

  // Claude API ile profil modelle
  await _updateJournalProfile();
}

async function _updateJournalProfile() {
  var journal = S.journal;
  if (!journal || !journal.entries || journal.entries.length === 0) return;

  var apiKey = S.claudeKey || (window.ENV && ENV.claudeKey);
  if (!apiKey && !window._hasAnthropicKey) return; // Key yoksa atla

  // Son 10 girişi al
  var recent = [...journal.entries].slice(-10);
  var entriesText = recent.map(e =>
    `Soru: "${e.question}"\nCevap: "${e.answer}"`
  ).join('\n\n---\n\n');

  try {
    var r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: `Sen bir görsel yönetmen ve felsefi anlama sistemisin. Kullanıcının günlük sorulara verdiği cevapları analiz ederek iki şeyi aynı anda yapıyorsun:

1. KİŞİSEL SEMBOLİK SÖZLÜK: Kişinin soyut kavramları (huzur, güzellik, enerji, zaman) nasıl kodladığını çıkar. "Mutluluk = sincap" gibi metaforları literal al — sincabın özelliklerini analiz et.

2. GÖRSEL ÇEVİRİ HAZIRLIĞI: Bu profil, kişinin brief yazarken kullandığı dili görsel direktife çevirmek için kullanılacak. Yani "onun için 'sıcak' ne demek?" sorusunu da cevapla — ışık kalitesi, hareket, doku, atmosfer olarak.

Çıktı: 4-6 cümle, Türkçe. Şiirsel-analitik. Hem sembolik hem görsel-pratik. Teknik terimler değil, bu kişinin dili.`,
        messages: [{ role: 'user', content: `Bu kişinin günlük cevapları:\n\n${entriesText}\n\nSembolik profilini çıkar. Her soyut kavramın bu kişi için görsel karşılığını da belirt.` }]
      })
    });
    var d = await r.json();
    if (d.text) {
      S.journal.profile = d.text;
      saveDB();
      render();
    }
  } catch(e) {
    console.warn('Günce profil güncellenemedi:', e.message);
  }
}