# Henosis Studio — Teknik Referans

> Ürün vizyonu ve bağlam için: @HENOSIS.md

---

## Dosya Yapısı ve Rolleri

**Backend & Veri**
| Dosya | Rol |
|-------|-----|
| `server.js` | Express backend, port 3000, tüm API proxy'leri |
| `hafiza.json` | Ayarlar + promptPool (settings, ~30 KB) |
| `hafiza-gallery.json` | `gallery`, `archive` |
| `hafiza-queue.json` | `queue`, `imgs`, `masterRefs`, `masterFace`, `conceptImgs` |
| `hafiza-learning.json` | `learningData`, `modelStats`, `projectMemory`, `styleMemory` |

**Config (Konfigürasyon & Sistem Promptları)**
| Dosya | Rol |
|-------|-----|
| `public/js/config-models.js` | `M` (model tanımları), `STRATEGIES`, `VIDEO_STRATEGIES`, `modelOptgroups()` |
| `public/js/config-prompts.js` | `SYS_ART_DIRECTOR`, `SYS_PROMPT`, `SYS_VIDEO`, `SYS_DIRECTOR` ve diğer sistem promptları |

**Core**
| Dosya | Rol |
|-------|-----|
| `public/js/state.js` | Global `S` objesi, `initApp()`, `saveDB()`, 4sn polling sync |
| `public/js/api.js` | `callClaude()`, `callLLM()`, `generate()` |
| `public/js/utils.js` | `genPromptId()`, `urlToClaudeSource()`, `toast()`, `addSpent()` vb. |

**Logic (İş Mantığı — 5 modül)**
| Dosya | Rol |
|-------|-----|
| `public/js/logic-learn.js` | Öğrenme sistemi, puanlama, `_distillLearning()`, `getLearningContext()`, model istatistikleri |
| `public/js/logic-prompts.js` | `generatePrompts()`, `generateVideoPrompts()`, revize, hermes, havuz işlemleri |
| `public/js/logic-queue.js` | `buildQ()`, `runAll()`, export/ZIP, corner widget |
| `public/js/logic-video-edit.js` | Klip yönetimi, `mergeVideoClips()`, FFmpeg pipeline |
| `public/js/logic-projects.js` | `saveProject()`, hafıza araması, brief yorumlama, `getProjectRefContext()` |

**UI (8 modül)**
| Dosya | Rol |
|-------|-----|
| `public/js/ui-core.js` | Ana render döngüsü, tab yönetimi |
| `public/js/ui-hazirla.js` | Hazırla sekmesi (prompt üretimi, havuz, torba) |
| `public/js/ui-studyo.js` | Stüdyo sekmesi (ürün yükleme, model seçimi) |
| `public/js/ui-queue.js` | Kuyruk sekmesi |
| `public/js/ui-gallery.js` | Galeri sekmesi |
| `public/js/ui-video.js` | Video sekmesi |
| `public/js/ui-learn.js` | Hafıza/öğrenme sekmesi |
| `public/js/ui-settings.js` | Ayarlar sekmesi |

---

## Kritik Kural: ÜRÜN RENGİNİ ASLA YAZMA

Ürünün rengi referans görselde kodlu. Prompt'a renk yazılırsa model iki çelişen sinyal alır → kötü sonuç.

- **Doğru:** `"cylindrical glass flacon with faceted cap and brushed metal collar"`
- **Yanlış:** `"sleek black bottle"` / `"red leather bag"`

Bu kural `SYS_ART_DIRECTOR`, `SYS_PROMPT` ve `SYS_VIDEO`'ya işlenmiş. İstisna yok.

---

## Yasak Kelimeler (her promptta)

`beautiful, stunning, elegant, luxury, premium, perfect, hyper-realistic, photorealistic, ultra-realistic, masterpiece, high quality, detailed, intricate, breathtaking, vivid, vibrant, amazing, incredible, professional photography`

---

## Sistem Promptları (config-prompts.js)

- `SYS_ART_DIRECTOR`: Ürün → JSON brief (productAnchor, lightingSetup, lensAndCamera, surfaceAndContext, filmGrade, antiAIDetails, compositionNote)
- `SYS_PROMPT`: Görsel prompt — 280-420 kelime, tek İngilizce paragraf, kamera notları formatı
- `SYS_VIDEO`: Video prompt — 120-200 kelime, 3 katman (Product Anchor / Camera+Motion / World+Atmosphere)
- `SYS_DIRECTOR`: Yönetmen modu — creative brief'ten sahne yönetimi

---

## Yeni Model Ekleme

`config-models.js`'deki `M` objesine tek satır:
```js
modelKey: { n:'Ad', p:'$x/unit', pn:0.04, ep:'fal-ai/endpoint', cat:'Kategori', t:'flux2', desc:'açıklama' }
```

---

## Öğrenme Sistemi

- 3 kriter: **tutarlilik** / **dogallik** / **yeterlilik** (0-10)
- Her 5 puanlamada `_distillLearning()` → Claude analiz → `S.learningData.distilled`
- `getLearningContext()` her prompt üretiminde sistem prompt'una eklenir
- Tüm öğrenme kodu: `logic-learn.js`

---

## Yeni Özellik Eklerken

1. **Model/strateji ekle** → `config-models.js`
2. **Sistem promptu ekle/düzenle** → `config-prompts.js`
3. **İş mantığı** → ilgili `logic-*.js` modülü
4. **API çağrısı** → `api.js` + `server.js`
5. **UI** → ilgili `ui-*.js` veya yeni modül
