# Henosis Studio — Ürün Vizyonu ve Bağlam

> Bu dosya ürün felsefesi, piyasa analizi ve genel bağlam içerir.
> Teknik referans için: CLAUDE.md

---

## Sorun: Görsel Üretim Hâlâ Kör Bir Süreç

E-ticaret, marka iletişimi ve sosyal medya dünyası her gün milyonlarca ürün görseli ve videosu tüketiyor. Bu görselleri üretmek için mevcut araçlar — Midjourney, DALL-E, Runway, Pika — şu ortak hastalığı taşıyor:

**Prompt yaz → sonucu gör → beğenmediysen tekrar yaz.**

Bu döngü körlemesine işliyor. Hiçbir araç şunu yapmıyor:

- Ürünün fiziksel gerçekliğini anlayıp (malzeme, doku, geometri) bunu prompt'a çevirmek.
- Üretim sonuçlarından öğrenerek bir sonraki prompt'u daha iyi yazmak.
- Fotoğraf direktörü gibi düşünerek sahne, ışık ve kamera kurmak.
- Bir görsel üretim sürecini baştan sona — fikir, prompt, üretim, skorlama, öğrenme — tek bir akışta yönetmek.

---

## Çözüm: Beş Katmanlı Yaratım Döngüsü

**1. Sahne Mimari Paneli** — Claude API ürünü Art Director gibi analiz eder (malzeme, doku, geometri, yüzey bitişi). Renk asla yazılmaz — referans görselde kodlu.

**2. Strateji Motoru** — 25+ fotoğraf stratejisi, 11 video stratejisi. Soyut "stil" değil, gerçek çekim notları formatında teknik şablonlar.

**3. Havuz ve Torba Sistemi** — Prompt'lar Havuz'a düşer → Torba → Stüdyo → kuyruğa. Koleksiyon bazlı üretim: 50 ürün × 3 sahne × 2 model = 300 görsel.

**4. Üretim ve Kuyruk** — Batch, ilerleme takibi, hata yönetimi, face swap pipeline, Görsel→Video pipeline.

**5. Sezgisel Öğrenim** — Her 5 puanlamada Claude tüm skorları analiz eder → öğrenme hafızasına yazar → bir sonraki prompt üretiminde sessizce devreye girer.

---

## Günlük Günce

"Hafıza" sekmesinde günlük soyut sorular. Cevaplar Claude tarafından analiz edilip "Kişisel Sembolik Profil" çıkarılır. Kullanıcının estetik dili öğrenilir.

---

## Rekabet Haritası

| Özellik | Midjourney | Runway | Leonardo | Henosis Studio |
|---------|-----------|--------|----------|---------------|
| Çoklu model erişimi | Hayır | Hayır | Kısıtlı | 30+ model |
| Art Director analizi | Hayır | Hayır | Hayır | Evet (Claude) |
| Strateji bazlı prompt | Hayır | Hayır | Hayır | 25+ strateji |
| Batch üretim + kuyruk | Hayır | Hayır | Kısıtlı | Tam |
| Öğrenen skorlama | Hayır | Hayır | Hayır | Evet |
| Görsel→Video pipeline | Hayır | Kısıtlı | Hayır | Tam otomatik |
| Face swap entegre | Hayır | Hayır | Hayır | Evet |
| Maliyet takibi | Hayır | Hayır | Hayır | Gerçek zamanlı |

---

## Hedef Kullanıcılar

- **Faz 1:** E-ticaret profesyonelleri (Trendyol, Etsy, Amazon, Shopify satıcıları, ajanslar)
- **Faz 2:** Yaratıcı profesyoneller (mimarlık, moda, reklam ajansları)
- **Faz 3:** Kurumsal + SaaS/API

---

## Teknik Altyapı

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js / Express |
| Frontend | Modüler Vanilla JS (8 UI modülü, sıfır framework) |
| AI Görsel | Fal.ai API (30+ model) |
| AI Zekâ | Anthropic Claude API (Sonnet & Opus) |
| Video | FFmpeg |
| Veri | JSON dosya bazlı (hafiza.json) |
| Bildirim | Telegram Bot API |

---

## İsim

**Henosis** (ἕνωσις) — Antik Yunanca "birleşme". Plotinus: parçaların bütünle yeniden birleşmesi. AI modelleri + insan sezgisi + öğrenen sistem = toplamlarından büyük bir yaratıcı güç.
