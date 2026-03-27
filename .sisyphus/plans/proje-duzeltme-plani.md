# MDuPDF Proje Düzeltme Planı

## TL;DR

> **Hızlı Özet**: Proje 10 kritik sorun tespit edilmiştir. Güvenlik ve mimari düzeltmeleri ağırlıklı, 6 dalda 20+ görev planlanmıştır.
> 
> **Öncelikli Çıktılar**:
> - XSS koruması (DOMPurify)
> - TypeScript tiplerinin düzeltilmesi
> - Test altyapısı kurulumu
> - Component ayrıştırma
> - Erişilebilirlik iyileştirmeleri
> 
> **Tahmini Süre**: 12-16 saat (dalga dalga)
> **Paralel Çalışma**: DALGA 1-3 paralel, DALGA 4+ sıralı
> **Kritik Yol**: ESLint/Prettier → Component Ayrıştırma → Test → Güvenlik

---

## Bağlam

### Orijinal Talep
Kullanıcı projeyi "tüm yönleriyle eksiksiz bir şekilde analiz ederek eksik yada hatalı yönlerini araştırmamı" ve "sorunların tespiti için kapsamlı bir plan oluşturmamı" istedi.

### Analiz Özeti

**Tespit Edilen 10 Kritik Sorun**:
1. **API Key Güvenliği** - Frontend'de exposure ( Kritik)
2. **XSS Koruması Eksik** - Kullanıcı içeriği sanitize edilmiyor (Kritik)
3. **TypeScript `any` Tipi** - 5+ kez滥用 (Yüksek)
4. **Component Ayrıştırma** - App.tsx 770 satır monolitik (Yüksek)
5. **Test Altyapısı Yok** - Hiç test dosyası yok (Yüksek)
6. **ESLint/Prettier Yok** - Kod kalitesi araçları eksik (Orta)
7. **Erişilebilirlik Eksik** - ARIA, keyboard nav yetersiz (Orta)
8. **LocalStorage Yok** - İçerik kalıcılığı sağlanmıyor (Orta)
9. **Lazy Loading Yok** - Performans iyileştirme fırsatı (Düşük)
10. **Error Boundary Yok** - Hata yönetimi eksik (Orta)

### Metis Danışması Sonuçları

**Bağımlılık Analizi**:
- Güvenlik + Tip Güvenliği: Birbirine bağımlı (#1, #2, #3)
- Kod Kalitesi Altyapısı: (#5, #6, #10) birlikte kurulmalı
- Performans + UX: (#8, #9, #7) paralel geliştirilebilir

**Öncelik Sıralaması**:
- P0: API Key Güvenliği, XSS Koruması (Üretim için OLMAZSA OLMAZ)
- P1: Component Ayrıştırma, Test Altyapısı (Bakım için kritik)
- P2: Error Boundary (Stabilite için gerekli)

---

## Çalışma Hedefleri

### Temel Hedef
Üretim kalitesinde, güvenli ve sürdürülebilir bir kod tabanı oluşturmak.

### Somut Çıktılar
- [ ] ESLint + Prettier yapılandırması
- [ ] DOMPurify ile XSS koruması
- [ ] 5+ ayrı component (Header, Sidebar, Editor, Preview, utils)
- [ ] Vitest test altyapısı + minimum testler
- [ ] Error Boundary component
- [ ] LocalStorage ile içerik kalıcılığı
- [ ] ARIA etiketleri ve keyboard navigation

### Kesinlikle Yapılmaması Gerekenler
- Yeni özellik ekleme (feature creep)
- Backend mimarisi değişikliği (mevcut frontend-only yapı korunacak)
- Breaking change gerektiren büyük refactor (küçük adımlarla ilerleme)

---

## Doğrulama Stratejisi

> **İNSAN MÜDAHALESİ YOK** - Tüm doğrulama agent tarafından çalıştırılır. "Kullanıcı manuel test eder" kabul edilemez.

### Test Altyapısı Kararı
- **Mevcut**: Test yok
- **Karar**: Vitest kurulacak (TDD yaklaşımı)
- **Framework**: vitest + @testing-library/react

### QA Politikası
Her görev mutlaka agent-executed QA senaryoları içermelidir (aşağıda TODO şablonunda).

---

## Çalışma Stratejisi

### Paralel Dalga Yapısı

```
DALGA 1 (Hemen - Altyapı):
├── T1: ESLint + Prettier + TypeScript strict
├── T2: .env.example oluştur
└── T3: Proje yapılandırma güncellemeleri

DALGA 2 (DALGA 1 sonrası - Güvenlik):
├── T4: XSS koruması (DOMPurify)
├── T5: API key validation iyileştirme
└── T6: CSP headers (index.html)

DALGA 3 (DALGA 1 sonrası - Refactor):
├── T7: Markdown utilities extraction
├── T8: usePdfExport hook
├── T9: Header component
├── T10: Sidebar component
├── T11: Editor component
├── T12: Preview component
└── T13: Error Boundary

DALGA 4 (DALGA 3 sonrası - Test):
├── T14: Test altyapısı kurulum
├── T15: geminiService unit test
├── T16: Markdown utilities test
└── T17: Component test (basic)

DALGA 5 (DALGA 4 sonrası - UX):
├── T18: LocalStorage persistence
├── T19: Keyboard shortcuts
└── T20: Accessibility improvements

DALGA FİNAL (TÜM görevler sonrası):
├── F1: Plan compliance audit
├── F2: Code quality review
├── F3: Manual QA
└── F4: Scope fidelity check
```

### Bağımlılık Matrisi

- **T1-T3**: — — Dalga 2-5, Tüm bağımlılıklar
- **T4-T6**: Dalga 1 — Tüm bağımsız
- **T7-T13**: Dalga 1 — Tüm bağımsız (paralel çalışabilir)
- **T14-T17**: T7-T13 — Test altyapısı kurulunca
- **T18-T20**: T14 — Test sonrası

### Agent Dağılımı

- **DALGA 1**: T1 → `unspecified-high`, T2 → `quick`, T3 → `quick`
- **DALGA 2**: T4 → `quick`, T5 → `quick`, T6 → `quick`
- **DALGA 3**: T7 → `unspecified-low`, T8 → `unspecified-medium`, T9 → `visual-engineering`, T10 → `visual-engineering`, T11 → `visual-engineering`, T12 → `visual-engineering`, T13 → `quick`
- **DALGA 4**: T14 → `unspecified-high`, T15 → `unspecified-medium`, T16 → `unspecified-medium`, T17 → `unspecified-medium`
- **DALGA 5**: T18 → `quick`, T19 → `quick`, T20 → `visual-engineering`
- **FİNAL**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODO'lar

- [ ] 1. ESLint + Prettier + TypeScript strict yapılandırması

  **Yapılacaklar**:
  - ESLint kurulumu: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks`
  - Prettier kurulumu: `npm install -D prettier`
  - `.eslintrc.cjs` ve `.prettierrc` dosyaları oluştur
  - `tsconfig.json`'a `strict: true` ekle
  - Mevcut lint hatalarını düzelt

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-high`
  > - Neden: Yapılandırma dosyaları oluşturma, linting kuralları belirleme, mevcut kodda lint hatalarını düzeltme
  > **Skills**: []
  > **Skills Evaluated but Omitted**:
  > - `eslint`: Kurulum ve config oluşturma bu görevde yapılacak

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 1 (T1, T2, T3 ile)
  - **Blocks**: Tüm diğer dalgalar
  - **Blocked By**: Yok (hemen başlayabilir)

  **References**:
  - `package.json` - Mevcut dependencies ve devDependencies
  - `tsconfig.json` - TypeScript yapılandırması
  - Vite ESLint plugin dokümantasyonu

  **Kabul Kriterleri**:
  - [ ] `npm run lint` çalışıyor ve hata vermiyor
  - [ ] `npx prettier --check .` çalışıyor
  - [ ] TypeScript strict mode aktif
  - [ ] Mevcut kodda lint hatası yok

  **QA Senaryoları**:
  ```
  Senaryo: ESLint yapılandırması çalışıyor
    Tool: bash
    Preconditions: ESLint kurulu değil
    Steps:
      1. npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
      2. .eslintrc.cjs dosyası oluştur
      3. npm run lint çalıştır
    Expected Result: Lint komutu çalışır, mevcut hatalar listelenir
    Evidence: .sisyphus/evidence/task-1-lint-output.txt

  Senaryo: Prettier yapılandırması çalışıyor
    Tool: bash
    Preconditions: Prettier kurulu değil
    Steps:
      1. npm install -D prettier
      2. .prettierrc dosyası oluştur
      3. npx prettier --check . çalıştır
    Expected Result: Prettier çalışır ve format kontrolü yapar
    Evidence: .sisyphus/evidence/task-1-prettier-output.txt

  Senaryo: TypeScript strict mode
    Tool: bash
    Steps:
      1. tsconfig.json dosyasını güncelle (strict: true)
      2. npx tsc --noEmit çalıştır
    Expected Result: TypeScript derleme hataları görünür (düzeltme değil, sadece tespit)
    Evidence: .sisyphus/evidence/task-1-tsc-output.txt
  ```

  **Commit**: YES
  - Message: `chore: add ESLint + Prettier + TypeScript strict config`
  - Files: `.eslintrc.cjs`, `.prettierrc`, `tsconfig.json`
  - Pre-commit: `npm run lint && npx prettier --write .`

- [ ] 2. .env.example dosyası oluştur

  **Yapılacaklar**:
  - `.env.example` dosyası oluştur
  - Gerekli environment değişkenlerini listele
  - README.md'yi güncelle

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Basit bir yapılandırma dosyası oluşturma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 1 (T1, T2, T3 ile)
  - **Blocks**: Yok
  - **Blocked By**: Yok

  **References**:
  - `geminiService.ts` - Okunan environment değişkenleri
  - `vite.config.ts` - Environment prefix tanımları

  **Kabul Kriterleri**:
  - [ ] `.env.example` dosyası mevcut
  - [ ] Gerekli değişkenler açıkça belirtilmiş
  - [ ] README.md'de .env kurulumu dokümante edilmiş

  **QA Senaryoları**:
  ```
  Senaryo: .env.example mevcut ve doğru
    Tool: bash
    Steps:
      1. ls -la .env.example
      2. cat .env.example içeriğini kontrol et
    Expected Result: Dosya mevcut ve VITE_GEMINI_API_KEY içeriyor
    Evidence: .sisyphus/evidence/task-2-env-example.txt
  ```

  **Commit**: YES
  - Message: `docs: add .env.example template`
  - Files: `.env.example`, `README.md`

- [ ] 3. Proje yapılandırma güncellemeleri

  **Yapılacaklar**:
  - package.json scripts güncelleme (lint, format komutları)
  - git hooks (opsiyonel)
  - Editor config ekleme

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: package.json güncelleme ve basit yapılandırma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 1 (T1, T2, T3 ile)
  - **Blocks**: Yok
  - **Blocked By**: Yok

  **References**:
  - `package.json` - Mevcut scripts

  **Kabul Kriterleri**:
  - [ ] `npm run lint` script'i çalışıyor
  - [ ] `npm run format` script'i çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Scripts çalışıyor
    Tool: bash
    Steps:
      1. npm pkg get scripts
      2. npm run lint çalıştır
    Expected Result: Scripts tanımlı ve çalışıyor
    Evidence: .sisyphus/evidence/task-3-scripts.txt
  ```

  **Commit**: YES
  - Message: `chore: update package.json scripts`
  - Files: `package.json`

- [ ] 4. XSS koruması (DOMPurify)

  **Yapılacaklar**:
  - DOMPurify kurulumu: `npm install dompurify @types/dompurify`
  - Markdown rendering'de sanitize uygula
  - img, code component'lerinde sanitize et
  - geminiService.ts'de sanitize uygula

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Güvenlik kütüphanesi entegrasyonu, tek dosya değişikliği
  > **Skills**: []
  > **Skills Evaluated but Omitted**:
  > - `security`: DOMPurify basit entegrasyon, bu görevde öğrenilecek

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 2 (T4, T5, T6 ile)
  - **Blocks**: Test altyapısı (güvenlik testleri yazılabilir)
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:507-530` - markdownComponents
  - `geminiService.ts` - AI çıktısı sanitize edilmeli

  **Kabul Kriterleri**:
  - [ ] DOMPurify kurulu
  - [ ] img component'inde src ve alt sanitize ediliyor
  - [ ] XSS test payload'ları engelleniyor

  **QA Senaryoları**:
  ```
  Senaryo: XSS koruması çalışıyor
    Tool: bash
    Preconditions: DOMPurify kurulu
    Steps:
      1. Test dosyası oluştur: xss-test.ts
      2. <script>alert('xss')</script> testi
      3. <img onerror=alert(1)> testi
      4. DOMPurify.sanitize() sonuçlarını kontrol et
    Expected Result: Tüm XSS payload'ları engellenmeli
    Evidence: .sisyphus/evidence/task-4-xss-test.txt

  Senaryo: img component korunuyor
    Tool: grep
    Steps:
      1. App.tsx'de DOMPurify import kontrolü
      2. img component'inde sanitize kullanımı kontrolü
    Expected Result: Sanitize kullanılıyor
    Evidence: .sisyphus/evidence/task-4-sanitize-usage.txt
  ```

  **Commit**: YES
  - Message: `security: add XSS protection with DOMPurify`
  - Files: `App.tsx`, `package.json`
  - Pre-commit: Test ile doğrula

- [ ] 5. API key validation iyileştirme

  **Yapılacaklar**:
  - Environment key validation ekle
  - Kullanıcıya net hata mesajları göster
  - Placeholder key kontrolü

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Hata mesajları iyileştirme, tek dosya değişikliği
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 2 (T4, T5, T6 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `geminiService.ts:8-24` - readGeminiApiKey fonksiyonu
  - `types.ts` - GeminiServiceError

  **Kabul Kriterleri**:
  - [ ] Eksik key için net hata mesajı
  - [ ] Geçersiz key için net hata mesajı
  - [ ] Placeholder key engelleniyor

  **QA Senaryoları**:
  ```
  Senaryo: API key validation
    Tool: bash
    Steps:
      1. readGeminiApiKey fonksiyonunu test et (boş, geçersiz, placeholder)
      2. Hata mesajlarını kontrol et
    Expected Result: Her durum için uygun hata mesajı
    Evidence: .sisyphus/evidence/task-5-validation.txt
  ```

  **Commit**: YES
  - Message: `security: improve API key validation`
  - Files: `geminiService.ts`

- [ ] 6. CSP headers (index.html)

  **Yapılacaklar**:
  - index.html'e meta tag ekle
  - Content-Security-Policy yapılandır
  - Gerekli allowlist'leri ekle

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Tek dosya değişikliği
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 2 (T4, T5, T6 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `index.html` - Mevcut yapı
  - Google AI Studio CSP gereksinimleri

  **Kabul Kriterleri**:
  - [ ] CSP meta tag mevcut
  - [ ] Gemini API domain allowlist edilmiş
  - [ ] Gerekli script/style source'ları allowlist edilmiş

  **QA Senaryoları**:
  ```
  Senaryo: CSP header mevcut
    Tool: grep
    Steps:
      1. index.html'de CSP meta tag kontrolü
    Expected Result: meta http-equiv="Content-Security-Policy" mevcut
    Evidence: .sisyphus/evidence/task-6-csp.txt
  ```

  **Commit**: YES
  - Message: `security: add Content-Security-Policy headers`
  - Files: `index.html`

- [ ] 7. Markdown utilities extraction

  **Yapılacaklar**:
  - `utils/markdown.ts` dosyası oluştur
  - `splitMarkdownIntoBlocks` fonksiyonunu taşı
  - `createMarkdownSections` fonksiyonunu taşı
  - App.tsx'de import güncelle

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-low`
  > - Neden: Utility fonksiyonları ayrı dosyaya taşıma, refactoring
  > **Skills**: []
  > **Skills Evaluated but Omitted**:
  > - `refactor`: Basit utility extraction, ayrı agent gerekmiyor

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Test altyapısı (utils test edilebilir hale gelecek)
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:41-115` - Utility fonksiyonları
  - `types.ts` - Tip tanımları

  **Kabul Kriterleri**:
  - [ ] utils/markdown.ts mevcut
  - [ ] Fonksiyonlar doğru çalışıyor (test ile doğrula)
  - [ ] App.tsx'de import güncellenmiş

  **QA Senaryoları**:
  ```
  Senaryo: Markdown utilities çalışıyor
    Tool: bash
    Preconditions: utils/markdown.ts mevcut
    Steps:
      1. Fonksiyonları test et (splitMarkdownIntoBlocks, createMarkdownSections)
      2. Örnek markdown ile doğrula
    Expected Result: Fonksiyonlar aynı sonuçları döndürüyor
    Evidence: .sisyphus/evidence/task-7-utils-test.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract markdown utilities to separate file`
  - Files: `utils/markdown.ts`, `App.tsx`

- [ ] 8. usePdfExport hook

  **Yapılacaklar**:
  - `hooks/usePdfExport.ts` oluştur
  - PDF export logic'ini hook'a taşı
  - App.tsx'de hook'u kullan

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-medium`
  > - Neden: Custom hook oluşturma, state yönetimi
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Component test
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:282-335` - exportCanvasSlicesToPdf
  - `App.tsx:117-280` - createPaginatedExportRoot

  **Kabul Kriterleri**:
  - [ ] usePdfExport hook mevcut
  - [ ] PDF export hala çalışıyor
  - [ ] exportToPdf fonksiyonu hook içinde

  **QA Senaryoları**:
  ```
  Senaryo: PDF export hook çalışıyor
    Tool: bash
    Preconditions: hooks/usePdfExport.ts mevcut
    Steps:
      1. Hook'u test et (basit render testi)
      2. Export fonksiyonunun varlığını kontrol et
    Expected Result: Hook doğru çalışıyor
    Evidence: .sisyphus/evidence/task-8-hook-test.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract PDF export to usePdfExport hook`
  - Files: `hooks/usePdfExport.ts`, `App.tsx`

- [ ] 9. Header component

  **Yapılacaklar**:
  - `components/Header.tsx` oluştur
  - Header logic'ini taşı
  - App.tsx'de import et

  **Önerilen Agent Profili**:
  > **Category**: `visual-engineering`
  > - Neden: UI component oluşturma, stil kopyalama
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:534-590` - Header JSX

  **Kabul Kriterleri**:
  - [ ] Header component mevcut
  - [ ] Doğru render ediliyor
  - [ ] Theme toggle çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Header component render ediliyor
    Tool: grep
    Steps:
      1. components/Header.tsx mevcut
      2. App.tsx'de import edilmiş
    Expected Result: Component mevcut ve import edilmiş
    Evidence: .sisyphus/evidence/task-9-header.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract Header component`
  - Files: `components/Header.tsx`, `App.tsx`

- [ ] 10. Sidebar component

  **Yapılacaklar**:
  - `components/Sidebar.tsx` oluştur
  - Sidebar logic'ini taşı
  - App.tsx'de import et

  **Önerilen Agent Profili**:
  > **Category**: `visual-engineering`
  > - Neden: UI component oluşturma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:594-629` - Sidebar JSX

  **Kabul Kriterleri**:
  - [ ] Sidebar component mevcut
  - [ ] Doğru render ediliyor
  - [ ] File upload çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Sidebar component render ediliyor
    Tool: grep
    Steps:
      1. components/Sidebar.tsx mevcut
      2. App.tsx'de import edilmiş
    Expected Result: Component mevcut ve import edilmiş
    Evidence: .sisyphus/evidence/task-10-sidebar.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract Sidebar component`
  - Files: `components/Sidebar.tsx`, `App.tsx`

- [ ] 11. Editor component

  **Yapılacaklar**:
  - `components/Editor.tsx` oluştur
  - Editor logic'ini taşı
  - App.tsx'de import et

  **Önerilen Agent Profili**:
  > **Category**: `visual-engineering`
  > - Neden: UI component oluşturma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:631-646` - Editor JSX

  **Kabul Kriterleri**:
  - [ ] Editor component mevcut
  - [ ] Doğru render ediliyor
  - [ ] Text input çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Editor component render ediliyor
    Tool: grep
    Steps:
      1. components/Editor.tsx mevcut
      2. App.tsx'de import edilmiş
    Expected Result: Component mevcut ve import edilmiş
    Evidence: .sisyphus/evidence/task-11-editor.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract Editor component`
  - Files: `components/Editor.tsx`, `App.tsx`

- [ ] 12. Preview component

  **Yapılacaklar**:
  - `components/Preview.tsx` oluştur
  - Preview logic'ini taşı
  - App.tsx'de import et

  **Önerilen Agent Profili**:
  > **Category**: `visual-engineering`
  > - Neden: UI component oluşturma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - `App.tsx:662-727` - Preview JSX

  **Kabul Kriterleri**:
  - [ ] Preview component mevcut
  - [ ] Doğru render ediliyor
  - [ ] Markdown rendering çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Preview component render ediliyor
    Tool: grep
    Steps:
      1. components/Preview.tsx mevcut
      2. App.tsx'de import edilmiş
    Expected Result: Component mevcut ve import edilmiş
    Evidence: .sisyphus/evidence/task-12-preview.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract Preview component`
  - Files: `components/Preview.tsx`, `App.tsx`

- [ ] 13. Error Boundary

  **Yapılacaklar**:
  - `components/ErrorBoundary.tsx` oluştur
  - App.tsx'de sarmala
  - Fallback UI ekle

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Error handling component
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: DALGA 3 (T7-T13 ile)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 1

  **References**:
  - React Error Boundary dokümantasyonu
  - `App.tsx` - Main app wrapper

  **Kabul Kriterleri**:
  - [ ] ErrorBoundary component mevcut
  - [ ] App.tsx'de kullanılıyor
  - [ ] Fallback UI çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: ErrorBoundary çalışıyor
    Tool: bash
    Steps:
      1. Test error oluştur
      2. Fallback gösterimi kontrol et
    Expected Result: Error durumunda fallback gösteriliyor
    Evidence: .sisyphus/evidence/task-13-errorboundary.txt
  ```

  **Commit**: YES
  - Message: `feat: add Error Boundary component`
  - Files: `components/ErrorBoundary.tsx`, `App.tsx`

- [ ] 14. Test altyapısı kurulum

  **Yapılacaklar**:
  - Vitest kurulumu: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - vitest.config.ts oluştur
  - İlk örnek test yaz
  - package.json'a test script'i ekle

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-high`
  > - Neden: Test altyapısı kurma, yapılandırma, ilk test yazma
  > **Skills**: []
  > **Skills Evaluated but Omitted**:
  > - `testing-library`: Bu görevde kurulacak

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 4 (T14-T17)
  - **Blocks**: İntegration testler
  - **Blocked By**: DALGA 3 (özellikle T7-T13)

  **References**:
  - `package.json` - Mevcut dependencies
  - Vitest dokümantasyonu

  **Kabul Kriterleri**:
  - [ ] vitest kurulu
  - [ ] vitest.config.ts mevcut
  - [ ] `npm test` çalışıyor
  - [ ] En az 1 test geçiyor

  **QA Senaryoları**:
  ```
  Senaryo: Test altyapısı çalışıyor
    Tool: bash
    Preconditions: vitest kurulu değil
    Steps:
      1. npm install -D vitest @testing-library/react
      2. vitest.config.ts oluştur
      3. Örnek test yaz
      4. npm test çalıştır
    Expected Result: Test çalışıyor ve geçiyor
    Evidence: .sisyphus/evidence/task-14-test-setup.txt
  ```

  **Commit**: YES
  - Message: `test: add Vitest test infrastructure`
  - Files: `vitest.config.ts`, `package.json`, `__tests__/example.test.ts`

- [ ] 15. geminiService unit test

  **Yapılacaklar**:
  - `__tests__/geminiService.test.ts` oluştur
  - readGeminiApiKey testi
  - normalizeGeminiError testi
  - Mock API calls

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-medium`
  > - Neden: Unit test yazma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 4 (T14-T17)
  - **Blocks**: Yok
  - **Blocked By**: T14

  **References**:
  - `geminiService.ts` - Test edilecek kod

  **Kabul Kriterleri**:
  - [ ] geminiService testleri mevcut
  - [ ] En az 3 test case
  - [ ] Tüm testler geçiyor

  **QA Senaryoları**:
  ```
  Senaryo: geminiService testleri çalışıyor
    Tool: bash
    Steps:
      1. npm test -- geminiService.test.ts
    Expected Result: Tüm testler geçiyor
    Evidence: .sisyphus/evidence/task-15-gemini-test.txt
  ```

  **Commit**: YES
  - Message: `test: add geminiService unit tests`
  - Files: `__tests__/geminiService.test.ts`

- [ ] 16. Markdown utilities test

  **Yapılacaklar**:
  - `__tests__/markdown.test.ts` oluştur
  - splitMarkdownIntoBlocks testi
  - createMarkdownSections testi

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-medium`
  > - Neden: Unit test yazma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 4 (T14-T17)
  - **Blocks**: Yok
  - **Blocked By**: T14, T7

  **References**:
  - `utils/markdown.ts` - Test edilecek kod

  **Kabul Kriterleri**:
  - [ ] markdown testleri mevcut
  - [ ] En az 5 test case
  - [ ] Tüm testler geçiyor

  **QA Senaryoları**:
  ```
  Senaryo: markdown utilities testleri çalışıyor
    Tool: bash
    Steps:
      1. npm test -- markdown.test.ts
    Expected Result: Tüm testler geçiyor
    Evidence: .sisyphus/evidence/task-16-markdown-test.txt
  ```

  **Commit**: YES
  - Message: `test: add markdown utilities unit tests`
  - Files: `__tests__/markdown.test.ts`

- [ ] 17. Component test (basic)

  **Yapılacaklar**:
  - `__tests__/App.test.tsx` oluştur
  - Basic render testi
  - Theme toggle testi

  **Önerilen Agent Profili**:
  > **Category**: `unspecified-medium`
  > - Neden: Component test yazma
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 4 (T14-T17)
  - **Blocks**: Yok
  - **Blocked By**: T14

  **References**:
  - `App.tsx` - Test edilecek component

  **Kabul Kriterleri**:
  - [ ] App component testleri mevcut
  - [ ] En az 2 test case
  - [ ] Testler geçiyor

  **QA Senaryoları**:
  ```
  Senaryo: App component testleri çalışıyor
    Tool: bash
    Steps:
      1. npm test -- App.test.tsx
    Expected Result: Testler geçiyor
    Evidence: .sisyphus/evidence/task-17-app-test.txt
  ```

  **Commit**: YES
  - Message: `test: add App component tests`
  - Files: `__tests__/App.test.tsx`

- [ ] 18. LocalStorage persistence

  **Yapılacaklar**:
  - İçerik ve başlık localStorage'a kaydet
  - Sayfa yüklendiğinde geri yükle
  - Debounce ile yazma optimizasyonu

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: LocalStorage mantığı ekleme
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 5 (T18-T20)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 4 (T14)

  **References**:
  - `App.tsx` - Mevcut state yönetimi

  **Kabul Kriterleri**:
  - [ ] İçerik localStorage'a kaydediliyor
  - [ ] Sayfa yenilendiğinde içerik geri geliyor
  - [ ] Başlık da kaydediliyor

  **QA Senaryoları**:
  ```
  Senaryo: LocalStorage persistence çalışıyor
    Tool: bash
    Steps:
      1. Markdown yaz
      2. Sayfayı yenile
      3. İçeriğin korunduğunu kontrol et
    Expected Result: İçerik korunuyor
    Evidence: .sisyphus/evidence/task-18-localstorage.txt
  ```

  **Commit**: YES
  - Message: `feat: add localStorage persistence for content`
  - Files: `App.tsx`

- [ ] 19. Keyboard shortcuts

  **Yapılacaklar**:
  - Ctrl+S: PDF export
  - Ctrl+Enter: AI enhance
  - Ctrl+O: Dosya açma

  **Önerilen Agent Profili**:
  > **Category**: `quick`
  > - Neden: Event handler ekleme
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 5 (T18-T20)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 4 (T14)

  **References**:
  - `App.tsx` - Event handlers

  **Kabul Kriterleri**:
  - [ ] Ctrl+S PDF export tetikliyor
  - [ ] Ctrl+Enter AI enhance tetikliyor
  - [ ] Kısayollar çalışıyor

  **QA Senaryoları**:
  ```
  Senaryo: Keyboard shortcuts çalışıyor
    Tool: interactive_bash
    Steps:
      1. Uygulamayı başlat
      2. Ctrl+S tuşla
      3. PDF export tetiklendiğini kontrol et
    Expected Result: PDF export çalışıyor
    Evidence: .sisyphus/evidence/task-19-shortcuts.txt
  ```

  **Commit**: YES
  - Message: `feat: add keyboard shortcuts`
  - Files: `App.tsx`

- [ ] 20. Accessibility improvements

  **Yapılacaklar**:
  - ARIA etiketleri ekle
  - aria-live region ekle (status)
  - Focus management iyileştir
  - Skip link ekle

  **Önerilen Agent Profili**:
  > **Category**: `visual-engineering`
  > - Neden: UI iyileştirme, erişilebilirlik
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: DALGA 5 (T18-T20)
  - **Blocks**: Yok
  - **Blocked By**: DALGA 4 (T14)

  **References**:
  - `App.tsx` - Mevcut JSX
  - WCAG 2.1 guidelines

  **Kabul Kriterleri**:
  - [ ] aria-label mevcut
  - [ ] aria-live region çalışıyor
  - [ ] Lighthouse A11y score artmış

  **QA Senaryoları**:
  ```
  Senaryo: Accessibility iyileştirmeleri çalışıyor
    Tool: bash
    Steps:
      1. aria-label attribute'larını kontrol et
      2. aria-live region'ı test et
    Expected Result: ARIA attribute'ları mevcut
    Evidence: .sisyphus/evidence/task-20-a11y.txt
  ```

  **Commit**: YES
  - Message: `a11y: add ARIA labels and keyboard navigation`
  - Files: `App.tsx`, `components/*.tsx`

---

## Final Doğrulama Dalgası

> TÜM uygulama görevleri tamamlandıktan sonra 4 parallel agent çalışır. HEPSİ ONAY vermelidir. Kullanıcıya sonuçlar sunulur ve açık "onay" alınmadan ilerlenmez.

- [ ] F1. **Plan Uyumluluk Denetimi** — `oracle`
  Planı baştan sona oku. Her "OLMALI" için: uygulama olduğunu doğrula (dosyayı oku, curl endpoint çalıştır, komut çalıştır). Her "YAPILMAMALI" için: kod tabanında yasaklı pattern'leri ara — bulunursa dosya:satır ile reddet. Evidence dosyalarının .sisyphus/evidence/ içinde olduğunu kontrol et. Plan çıktılarıyla karşılaştır.
  Output: `Olmali [N/N] | Yapilmamali [N/N] | Gorevler [N/N] | KARAR: ONAY/red`

- [ ] F2. **Kod Kalitesi İncelemesi** — `unspecified-high`
  `npx tsc --noEmit` + linter + `npm test` çalıştır. Değiştirilmiş tüm dosyaları incele: `as any`/`@ts-ignore`, boş catch'ler, prod'da console.log, yorum satırı kod, kullanılmayan import'lar. AI slop kontrolü: aşırı yorumlar, over-abstraction, generic isimler (data/result/item/temp).
  Output: `Build [GEÇTI/BAŞARISIZ] | Lint [GEÇTI/BAŞARISIZ] | Testler [N geç/N başarısız] | Dosyalar [N temiz/N sorunlu] | KARAR`

- [ ] F3. **Gerçek Manuel QA** — `unspecified-high` (+ `playwright` skill eğer UI varsa)
  Temiz durumdan başla. HER görevden HER QA senaryosunu çalıştır — exact adımları takip et, evidence kaydet. Çapraz-görev entegrasyonunu test et (birlikte çalışan özellikler, izolasyonda değil). Edge case'leri test et: boş state, geçersiz input, hızlı işlemler. .sisyphus/evidence/final-qa/ içine kaydet.
  Output: `Senaryolar [N/N geçti] | Entegrasyon [N/N] | Edge Case'ler [N test edildi] | KARAR`

- [ ] F4. **Kapsam Sadakati Kontrolü** — `deep`
  Her görev için: "Ne yapılmalı" kısmını oku, gerçek diff'i oku (git log/diff). 1:1 doğrula — spec'deki her şey inşa edildi (eksik yok), spec'in ötesinde bir şey inşa edilmedi (creep yok). "Yapılmaması" uyumluluğunu kontrol et. Görevler arası bulaşmayı tespit et: Görev N, Görev M'nin dosyalarına dokunuyor. Hesaplanmamış değişiklikleri işaretle.
  Output: `Gorevler [N/N uyumlu] | Bulaşma [TEMIZ/N sorun] | Hesaplanmamış [TEMIZ/N dosya] | KARAR`

---

## Commit Stratejisi

Her görev için commit mesajı ve dosyalar TODO'da belirtilmiştir.

---

## Başarı Kriterleri

### Doğrulama Komutları
```bash
npm run lint  # ESLint hataları yok
npx prettier --check .  # Format hataları yok
npm test  # Tüm testler geçiyor
npx tsc --noEmit  # TypeScript hataları yok
```

### Son Kontrol Listesi
- [ ] Tüm "OLMALI" maddeler mevcut
- [ ] Tüm "YAPILMAMALI" maddeler yok
- [ ] Tüm testler geçiyor
- [ ] Lint hataları yok
- [ ] TypeScript derleme hatası yok
- [ ] Plan çıktıları kaydedilmiş

