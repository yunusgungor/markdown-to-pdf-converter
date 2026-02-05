# MDuPDF - AI Powered Markdown to PDF

**MDuPDF**, Markdown belgelerinizi yapay zeka desteğiyle stilize eden ve yüksek kaliteli PDF'lere dönüştüren modern bir web uygulamasıdır. Gemini AI kullanarak metinlerinizi daha profesyonel hale getirir ve tek tıkla paylaşılabilir dökümanlar oluşturur.

🚀 **Canlı Demo:** [mdupdf.netlify.app](https://mdupdf.netlify.app/)

---

## ✨ Özellikler

- **AI Destekli Düzenleme:** Yazdığınız Markdown içeriğini yapay zeka ile otomatik iyileştirin.
- **Canlı Önizleme:** Yazarken anlık olarak PDF çıktısını görüntüleyin.
- **Yüksek Kaliteli Export:** Tablolar, Mermaid diyagramları ve matematiksel (LaTeX) formüller dahil kusursuz PDF çıktısı.
- **Modern Arayüz:** Karanlık mod desteği ve temiz, kullanıcı dostu tasarım.
- **Gelişmiş Markdown Desteği:** GitHub Flavored Markdown (GFM) ve daha fazlası.

## 🛠️ Kurulum

Projeyi yerel makinenizde çalıştırmak için:

1. **Depoyu klonlayın:**
   ```bash
   git clone git@github.com:yunusgungor/markdown-ai-pdf-converter.git
   cd markdown-ai-pdf-converter
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **API Anahtarını ayarlayın:**
   `.env.local` dosyası oluşturun ve Gemini API anahtarınızı ekleyin:
   ```env
   GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```

4. **Uygulamayı başlatın:**
   ```bash
   npm run dev
   ```

## 🚀 Yayınlama (Netlify)

Bu proje Netlify için optimize edilmiştir:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** Netlify panelinden `GEMINI_API_KEY` değişkenini tanımlamayı unutmayın.

---

**Geliştirici:** [Yunus Güngör](https://github.com/yunusgungor)  
**Lisans:** MIT
