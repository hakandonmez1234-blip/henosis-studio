// ═══════════════════════════════════════════════════════════════
// UI-LEARN.JS — V3.0
// YENİ: Sohbet tabanlı öğrenme sistemi
// Claude ile doğal diyalog, görsel tercihlerin çıkarılması,
// kişisel sembolik profil oluşturma
// ═══════════════════════════════════════════════════════════════

function renderLearn() {
  var o = '';

  // ══════════════════════════════════════════════════════════════
  // 1. SOHBET ARAYÜZÜ — Ana Öğrenme Kanalı
  // ══════════════════════════════════════════════════════════════
  var chat = S.learningChat || { messages: [], isTyping: false };

  o += `<div class="sec sec-glow" style="margin-bottom:20px;display:flex;flex-direction:column;height:calc(100vh - 280px);min-height:400px">
    <div class="sec-title" style="margin-bottom:4px;flex-shrink:0;display:flex;align-items:center;gap:8px">
      <i data-lucide="brain-circuit" style="width:18px;height:18px"></i>
      Öğrenme Sohbeti
      ${chat.messages.length > 0 ? `<span style="font-size:9px;padding:3px 10px;border-radius:99px;background:rgba(184,92,30,0.15);color:var(--ac-orange);border:1px solid rgba(184,92,30,0.25);font-family:Inter,sans-serif">${chat.messages.length} mesaj</span>` : ''}
    </div>
    <div style="font-size:11px;color:var(--tx-muted);margin-bottom:14px;flex-shrink:0">
      Claude ile konuş, görsel tercihlerini keşfet. Ne seversin, ne istemezsin — hepsi kaydedilir.
    </div>`;

  // Mesajlar alanı
  o += `<div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-cream);border-radius:var(--rad-md);border:1px solid var(--brd);margin-bottom:14px;display:flex;flex-direction:column;gap:12px">`;

  if (chat.messages.length === 0) {
    // Hoşgeldin mesajı
    o += `<div style="text-align:center;padding:40px 20px;color:var(--tx-muted)">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--grad-holo);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:var(--shadow-glow-pink)">
        <i data-lucide="sparkles" style="width:28px;height:28px;color:#fff"></i>
      </div>
      <div style="font-size:14px;font-weight:600;color:var(--tx-main);margin-bottom:8px">Öğrenmeye Başla</div>
      <div style="font-size:12px;line-height:1.6;max-width:320px;margin:0 auto">
        "Minimal beyaz fonları seviyorum" veya "Sarı ışık huzur veriyor" gibi şeyler yaz. 
        Seni tanıyıp promptlarını kişiselleştireceğim.
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;align-items:center">
        ${[
          'Sert gölgeler dramatik mi olur?',
          'Pastel tonlar sakin verir mi?',
          'Doğal ışık mı stüdyo mu?',
          'Ürün merkezli mi sahne merkezli?'
        ].map(q => `<button onclick="sendLearningMessage('${q}')" style="padding:8px 14px;border-radius:var(--rad-pill);border:1px solid var(--brd);background:var(--bg-elev);color:var(--tx-muted);font-size:11px;cursor:pointer;font-family:inherit;transition:all 0.2s" onmouseenter="this.style.borderColor='var(--ac-orange)';this.style.color='var(--tx-main)'" onmouseleave="this.style.borderColor='var(--brd)';this.style.color='var(--tx-muted)'">${q}</button>`).join('')}
      </div>
    </div>`;
  } else {
    // Mesajları listele
    chat.messages.forEach((msg, idx) => {
      var isUser = msg.role === 'user';
      o += `<div style="display:flex;flex-direction:column;${isUser ? 'align-items:flex-end' : 'align-items:flex-start'};gap:4px;animation:spring-in 0.3s var(--ease-spring) ${idx * 0.05}s backwards">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          ${isUser 
            ? `<span style="font-size:10px;color:var(--tx-muted);font-weight:600">Sen</span>`
            : `<span style="font-size:10px;color:var(--ac-orange);font-weight:600">Claude</span>`
          }
          <span style="font-size:9px;color:var(--tx-dim)">${formatTime(msg.ts)}</span>
        </div>
        <div style="max-width:85%;padding:12px 16px;border-radius:var(--rad-md);font-size:13px;line-height:1.7;${isUser 
          ? 'background:var(--tx-main);color:var(--bg-elev);border-bottom-right-radius:4px'
          : 'background:var(--bg-elev);color:var(--tx-main);border:1px solid var(--brd);border-bottom-left-radius:4px'
        }">${formatChatText(msg.content)}</div>
      </div>`;
    });

    // Yazıyor animasyonu
    if (chat.isTyping) {
      o += `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span style="font-size:10px;color:var(--ac-orange);font-weight:600">Claude</span>
          <span style="font-size:9px;color:var(--tx-dim)">şimdi</span>
        </div>
        <div style="padding:16px 20px;border-radius:var(--rad-md);background:var(--bg-elev);border:1px solid var(--brd);border-bottom-left-radius:4px;display:flex;align-items:center;gap:4px">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--tx-muted);animation:bounce 1.4s infinite 0s"></span>
          <span style="width:6px;height:6px;border-radius:50%;background:var(--tx-muted);animation:bounce 1.4s infinite 0.2s"></span>
          <span style="width:6px;height:6px;border-radius:50%;background:var(--tx-muted);animation:bounce 1.4s infinite 0.4s"></span>
        </div>
      </div>`;
    }
  }

  o += `</div>`;

  // Input alanı
  o += `<div style="flex-shrink:0;display:flex;gap:10px;align-items:flex-end">
    <div style="flex:1;position:relative">
      <textarea id="learn-chat-input" class="inp" style="min-height:56px;max-height:120px;resize:none;padding-right:40px;font-size:13px;line-height:1.6"
        placeholder="Görsel tercihlerini anlat... (Enter ile gönder, Shift+Enter yeni satır)"
        onkeydown="handleLearnChatKeydown(event)"
        oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px';if(this.value.length>500)this.value=this.value.substring(0,500)"
        ${chat.isTyping ? 'disabled' : ''}></textarea>
      <button onclick="sendLearningMessage()" id="learn-send-btn" style="position:absolute;right:8px;bottom:8px;width:32px;height:32px;border-radius:50%;background:var(--ac-orange);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;${chat.isTyping ? 'opacity:0.4;pointer-events:none' : ''}" ${chat.isTyping ? 'disabled' : ''}>
        <i data-lucide="send" style="width:16px;height:16px"></i>
      </button>
    </div>
    ${chat.messages.length > 0 ? `
    <button onclick="clearLearningChat()" style="padding:10px 14px;border-radius:var(--rad-md);border:1px solid var(--brd);background:var(--bg-elev);color:var(--tx-muted);font-size:12px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;flex-shrink:0" title="Sohbeti temizle">
      <i data-lucide="trash-2" style="width:14px;height:14px"></i>
    </button>
    ` : ''}
  </div>`;

  o += `</div>`;

  // ══════════════════════════════════════════════════════════════
  // 2. KİŞİSEL PROFİL — Claude'ın çıkardığı özet
  // ══════════════════════════════════════════════════════════════
  if (S.journal && S.journal.profile) {
    o += `<div class="sec" style="margin-bottom:20px">
      <div class="sec-title" style="font-size:14px;display:flex;align-items:center;gap:8px">
        <i data-lucide="user-circle" style="width:16px;height:16px"></i>
        Kişisel Görsel Profilin
      </div>
      <div style="background:var(--bg-cream);border:1px solid var(--brd);border-radius:var(--rad-md);padding:16px;font-size:12px;color:var(--tx-main);line-height:1.9">
        ${formatChatText(S.journal.profile)}
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // 3. MODEL İSTATİSTİKLERİ
  // ══════════════════════════════════════════════════════════════
  var msKeys = Object.keys(S.modelStats || {});
  if (msKeys.length > 0) {
    o += `<div class="sec" style="margin-bottom:20px">
      <div class="sec-title" style="font-size:14px;display:flex;align-items:center;gap:8px">
        <i data-lucide="bar-chart-3" style="width:16px;height:16px"></i>
        Model İstatistikleri
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${msKeys.map(key => {
          var ms = S.modelStats[key];
          var modelName = M && M[key] ? M[key].n : key;
          var avgDur = ms.count > 0 ? Math.round(ms.totalDuration / ms.count) : 0;
          var avgScore = ms.scoredCount > 0 ? (ms.totalScore / ms.scoredCount).toFixed(1) : null;
          var scoreColor = avgScore >= 7 ? 'var(--green)' : avgScore >= 4 ? 'var(--ac-orange)' : 'var(--red)';
          return `<div style="background:var(--bg-cream);border:1px solid var(--brd);border-radius:var(--rad-md);padding:12px;display:flex;align-items:center;gap:12px">
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:var(--tx-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(modelName)}</div>
              <div style="font-size:10px;color:var(--tx-muted)">${ms.count} üretim</div>
            </div>
            <div style="text-align:center;min-width:48px">
              <div style="font-size:14px;font-weight:700;color:var(--ac-peach)">${avgDur > 0 ? avgDur + 's' : '—'}</div>
              <div style="font-size:8px;color:var(--tx-muted);letter-spacing:0.5px">SÜRE</div>
            </div>
            ${avgScore ? `<div style="text-align:center;min-width:36px">
              <div style="font-size:14px;font-weight:700;color:${scoreColor}">${avgScore}</div>
              <div style="font-size:8px;color:var(--tx-muted);letter-spacing:0.5px">SKOR</div>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // 4. SKORLAMA PANELİ
  // ══════════════════════════════════════════════════════════════
  o += `<div class="sec">
    <div class="sec-title" style="font-size:14px;display:flex;align-items:center;gap:8px">
      <i data-lucide="star" style="width:16px;height:16px"></i>
      Skorlama Paneli
    </div>`;

  var scoredItems = (S.gallery || []).filter(it => it.scores && (it.scores.tutarlilik || it.scores.dogallik || it.scores.yeterlilik));

  if (scoredItems.length === 0) {
    o += `<div style="text-align:center;padding:32px;color:var(--tx-muted);font-size:12px">
      <i data-lucide="image-off" style="width:24px;height:24px;margin-bottom:8px;opacity:0.5"></i>
      <div>Henüz skorlanmış görsel yok.</div>
      <div style="font-size:11px;margin-top:4px">Galeri'den bir görsel seç ve puanla.</div>
    </div>`;
  } else {
    o += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">`;
    scoredItems.slice(0, 6).forEach((it, gi) => {
      var sc = it.scores || {};
      var t = sc.tutarlilik || 0;
      var d = sc.dogallik || 0;
      var y = sc.yeterlilik || 0;
      var gp = (t + d + y) / 3;
      var bc = gp >= 7 ? 'var(--green)' : gp >= 4 ? 'var(--ac-orange)' : 'var(--red)';
      o += `<div style="background:var(--bg-cream);border:1px solid var(--brd);border-radius:var(--rad-md);padding:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:44px;height:44px;border-radius:8px;overflow:hidden;flex-shrink:0">
            <img src="${it.result}" style="width:100%;height:100%;object-fit:cover">
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--tx-main)">${h(it.ref ? it.ref.name : '')}</div>
            <div style="font-size:10px;color:var(--tx-muted)">Genel: <span style="font-weight:700;color:${bc}">${gp > 0 ? gp.toFixed(1) : '-'}</span> / 10</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${[['tutarlilik', 'Tutarlılık', 'var(--ac-peach)'], ['dogallik', 'Doğallık', 'var(--green)'], ['yeterlilik', 'Yeterlilik', 'var(--ac-orange)']].map(([type, label, color]) => {
            let val = sc[type] || 0;
            return `<div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:9px;font-weight:600;color:var(--tx-muted);width:60px">${label}</span>
              <div style="flex:1;height:4px;border-radius:99px;background:var(--bg-deep);overflow:hidden">
                <div style="height:100%;width:${val * 10}%;background:${color};border-radius:99px;transition:width 0.3s ease"></div>
              </div>
              <span style="font-size:10px;font-weight:700;color:${val > 0 ? color : 'var(--tx-muted)'};min-width:20px;text-align:right">${val > 0 ? val : '-'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
    o += `</div>`;
    if (scoredItems.length > 6) {
      o += `<div style="text-align:center;margin-top:12px;font-size:11px;color:var(--tx-muted)">+${scoredItems.length - 6} skorlanmış görsel daha</div>`;
    }
  }

  o += `</div>`;

  // CSS animasyonu ekle (bouncing dots için)
  if (!document.getElementById('learn-chat-styles')) {
    var style = document.createElement('style');
    style.id = 'learn-chat-styles';
    style.textContent = `
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-8px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Scroll to bottom
  setTimeout(() => {
    var chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, 0);

  return o;
}

// ══════════════════════════════════════════════════════════════
// SOHBET FONKSİYONLARI
// ══════════════════════════════════════════════════════════════

function handleLearnChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendLearningMessage();
  }
}

async function sendLearningMessage(text) {
  var input = document.getElementById('learn-chat-input');
  var messageText = text || (input ? input.value.trim() : '');

  if (!messageText || messageText.length < 2) return;

  // State'i güncelle
  if (!S.learningChat) S.learningChat = { messages: [], isTyping: false };

  // Kullanıcı mesajını ekle
  S.learningChat.messages.push({
    role: 'user',
    content: messageText,
    ts: Date.now()
  });

  // Input temizle
  if (input) {
    input.value = '';
    input.style.height = 'auto';
  }

  // Yazıyor durumuna geç
  S.learningChat.isTyping = true;
  saveDB();
  render();

  // Claude API'ye gönder
  try {
    var response = await fetchLearningResponse(messageText);

    // Claude cevabını ekle
    S.learningChat.isTyping = false;
    S.learningChat.messages.push({
      role: 'assistant',
      content: response,
      ts: Date.now()
    });

    // Profili güncelle (arka planda)
    _updateProfileFromChat();

  } catch (err) {
    S.learningChat.isTyping = false;
    S.learningChat.messages.push({
      role: 'assistant',
      content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene.',
      ts: Date.now()
    });
  }

  saveDB();
  render();
}

async function fetchLearningResponse(userMessage) {
  var apiKey = S.claudeKey || (window.ENV && ENV.claudeKey);
  if (!apiKey && !window._hasAnthropicKey) {
    return "Henüz Claude API anahtarı ayarlanmamış. Ayarlar sekmesinden ekleyebilirsin.";
  }

  var systemPrompt = `Sen bir görsel yönetmen ve felsefi anlama sistemisin. Kullanıcı sana görsel tercihlerini, estetik beklentilerini, sevdiklerini/sevmediklerini anlatıyor.

GÖREVİN:
1. Samimi, kısa (2-4 cümle) cevaplar ver
2. Kullanıcının tarzını analiz et ve kısa yorumlar yap
3. Görsel dilini yavaş yavaş haritala: "demek senin için huzur = loş ışık + yumuşak gölgeler"
4. Prompt yazmayı öğretmek DEĞİL, kullanıcının doğal dilini anlamak
5. Sorular sorarak derinleş: "Pastel derken açık tonlar mı, tozlu renkler mi?"

TAVIR:
- Meraklı ve kibar
- Yargılamayan
- Teknik jargon kullanmayan
- Görsel metaforları not alan`;

  // Son 10 mesajı al (context)
  var recentMessages = S.learningChat.messages.slice(-10);

  var r = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: recentMessages.map(m => ({
        role: m.role,
        content: m.content
      })).concat([{ role: 'user', content: userMessage }])
    })
  });

  var d = await r.json();
  return d.text || d.content || 'Hmm, anlayamadım. Başka türlü anlatabilir misin?';
}

async function _updateProfileFromChat() {
  if (!S.learningChat || S.learningChat.messages.length < 3) return;

  var apiKey = S.claudeKey || (window.ENV && ENV.claudeKey);
  if (!apiKey && !window._hasAnthropicKey) return;

  // Son 20 mesajı al
  var recentChat = S.learningChat.messages.slice(-20);
  var chatText = recentChat.map(m => `${m.role === 'user' ? 'Kullanıcı' : 'Claude'}: ${m.content}`).join('\n\n');

  try {
    var r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: `Sen bir görsel profil çıkarma sistemisin. Sohbetten kullanıcının görsel tercihlerini analiz et.

ÇIKTI FORMATI:
- 3-5 cümle, Türkçe
- Şiirsel ama pratik
- Metaforları doğrudan görsel karşılıklarına çevir
- "Bu kişi için..." diye başlama, doğrudan tarif et

ÖRNEK:
"Loş ışığı tercih ediyorsun, gölgelerin yumuşak geçişli olması senin için huzur demek. Pastel tonlara yakınlığın var ama bazen canlı bir vurgu da istiyorsun. Doğal ışık senin için sahiciliğin simgesi — stüdyo seni daraltıyor gibi."`,
        messages: [{ role: 'user', content: `Bu sohbetten kullanıcının görsel profilini çıkar:\n\n${chatText}` }]
      })
    });
    var d = await r.json();
    if (d.text) {
      if (!S.journal) S.journal = { entries: [], profile: '', lastAsked: null };
      S.journal.profile = d.text;
      saveDB();
      render();
    }
  } catch (e) {
    console.warn('Profil güncellenemedi:', e.message);
  }
}

function clearLearningChat() {
  if (!confirm('Sohbeti temizlemek istediğine emin misin?')) return;
  S.learningChat = { messages: [], isTyping: false };
  saveDB();
  render();
}

function formatTime(ts) {
  var d = new Date(ts);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatChatText(text) {
  // Basit markdown: **kalın**, *italik*, linkler
  return h(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 4px;border-radius:4px;font-size:11px">$1</code>');
}