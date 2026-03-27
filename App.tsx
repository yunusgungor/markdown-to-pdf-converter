
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Download,
  Sparkles,
  Trash2,
  PlusCircle,
  Eye,
  Maximize2,
  Table as TableIcon,
  Columns,
  PanelLeftClose,
  PanelLeft,
  Info,
  Layers,
  Check,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

import Mermaid from './components/Mermaid';
import { enhanceMarkdownContent, prepareMarkdownForPdfLayout } from './geminiService';
import { AppStatus, GeminiServiceError, ProcessingState, Theme } from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const INITIAL_MD = `# 🚀 Profesyonel PDF Dönüştürücü

Bu uygulama, karmaşık Markdown içeriklerini yüksek hassasiyetle PDF dökümanına çevirir.

## 📦 Temel Özellikler
1. **Mermaid Diyagramları**: Tam çözünürlüklü SVG aktarımı.
2. **Tablo Yönetimi**: A4 genişliğine tam uyumlu tablolar.
3. **Matematiksel Formüller**: KaTeX motoru ile kusursuz render.
4. **Emoji Desteği**: Gece modunda da parlayan emojiler 🚀🔥✨.

| Özellik | Durum | Teknoloji |
| :--- | :---: | :--- |
| **Diyagram** | ✅ | Mermaid.js |
| **Tema Desteği**| ✅ | Dark / Light |
| **Formül** | ✅ | KaTeX |
| **AI Optimizasyon** | ✅ | Gemini 3 |

## 📐 Matematiksel Örnek
$$
E = mc^2 \\quad \\text{ve} \\quad \\int_a^b f(x)dx
$$

\`\`\`mermaid
graph LR
    MD[Markdown Giriş] --> Theme{Tema Seçimi}
    Theme -- Dark --> DarkUI[Gece Modu]
    Theme -- Light --> LightUI[Aydınlık Mod]
    DarkUI --> PDF[High-Res PDF]
    LightUI --> PDF
\`\`\`

> Not: PDF çıktısı her zaman profesyonel beyaz kağıt standardında üretilir.
`;

const PAGE_BREAK_TOKEN = '<<<PAGE_BREAK>>>';
const KEEP_WITH_NEXT_TOKEN = '<<<KEEP_WITH_NEXT>>>';

type MarkdownSection =
  | { type: 'section'; content: string; keepWithNext: boolean }
  | { type: 'page-break' };

const splitMarkdownIntoBlocks = (content: string): string[] => {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeFence = false;

  const flushBlock = () => {
    const block = currentBlock.join('\n').trim();
    if (block) {
      blocks.push(block);
    }
    currentBlock = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence && (trimmedLine === PAGE_BREAK_TOKEN || trimmedLine === `<<<PAGE_BREAK>>>`)) {
      flushBlock();
      blocks.push(PAGE_BREAK_TOKEN);
      continue;
    }

    if (!inCodeFence && (trimmedLine === KEEP_WITH_NEXT_TOKEN || trimmedLine === `<<<KEEP_WITH_NEXT>>>`)) {
      flushBlock();
      blocks.push(KEEP_WITH_NEXT_TOKEN);
      continue;
    }

    if (!inCodeFence && trimmedLine === '') {
      flushBlock();
      continue;
    }

    currentBlock.push(line);
  }

  flushBlock();

  return blocks;
};

const createMarkdownSections = (content: string): MarkdownSection[] => {
  const safeContent = content.trim() ? content : '_Doküman boş._';
  const blocks = splitMarkdownIntoBlocks(safeContent);
  const sections: MarkdownSection[] = [];
  let keepWithNext = false;

  for (const block of blocks) {
    if (block === PAGE_BREAK_TOKEN || block === `<<<PAGE_BREAK>>>`) {
      sections.push({ type: 'page-break' });
      keepWithNext = false;
      continue;
    }

    if (block === KEEP_WITH_NEXT_TOKEN || block === `<<<KEEP_WITH_NEXT>>>`) {
      keepWithNext = true;
      continue;
    }

    sections.push({
      type: 'section',
      content: block,
      keepWithNext: keepWithNext || /^#{1,6}\s/.test(block)
    });
    keepWithNext = false;
  }

  return sections.length > 0 ? sections : [{ type: 'section', content: safeContent, keepWithNext: false }];
};

const createPaginatedExportRoot = (
  sourceNode: HTMLDivElement,
  mountContainer: HTMLDivElement
): HTMLDivElement => {
  const PAGE_SAFETY_BUFFER_PX = 20;

  const exportRoot = document.createElement('div');
  exportRoot.style.width = '210mm';
  exportRoot.style.maxWidth = '210mm';
  exportRoot.style.background = '#ffffff';
  exportRoot.style.margin = '0';
  exportRoot.style.padding = '0';
  mountContainer.replaceChildren(exportRoot);

  const sourceWidthPx = sourceNode.getBoundingClientRect().width || 794;
  const pageHeightPx = Math.round((sourceWidthPx * 297) / 210);
  const sourceStyles = window.getComputedStyle(sourceNode);
  const paddingTop = parseFloat(sourceStyles.paddingTop || '20mm') * 3.7795275591;
  const paddingBottom = parseFloat(sourceStyles.paddingBottom || '20mm') * 3.7795275591;
  const maxContentHeightPx = Math.max(pageHeightPx - paddingTop - paddingBottom - PAGE_SAFETY_BUFFER_PX, 200);
  type ExportUnit =
    | { type: 'page-break' }
    | { type: 'content'; node: HTMLDivElement; height: number; keepWithNext: boolean };

  const createPage = () => {
    const page = sourceNode.cloneNode(false) as HTMLDivElement;
    page.classList.add('pdf-page');
    page.style.width = '210mm';
    page.style.maxWidth = '210mm';
    page.style.minHeight = '297mm';
    page.style.height = `${pageHeightPx}px`;
    page.style.margin = '0';
    page.style.boxShadow = 'none';
    page.style.borderRadius = '0';
    page.style.overflow = 'hidden';
    page.style.breakAfter = 'page';
    page.style.pageBreakAfter = 'always';
    return page;
  };

  const getElementOuterHeight = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const marginTop = parseFloat(styles.marginTop || '0');
    const marginBottom = parseFloat(styles.marginBottom || '0');
    return rect.height + marginTop + marginBottom;
  };

  const exportUnits: ExportUnit[] = [];

  for (const child of Array.from(sourceNode.children) as HTMLDivElement[]) {
    if (child.classList.contains('page-break')) {
      exportUnits.push({ type: 'page-break' });
      continue;
    }

    exportUnits.push({
      type: 'content',
      node: child.cloneNode(true) as HTMLDivElement,
      height: Math.max(getElementOuterHeight(child), 1),
      keepWithNext: child.classList.contains('keep-with-next')
    });
  }

  let currentPage = createPage();
  let currentApproxHeight = 0;
  exportRoot.appendChild(currentPage);

  for (let unitIndex = 0; unitIndex < exportUnits.length; unitIndex += 1) {
    const unit = exportUnits[unitIndex];
    if (unit.type === 'page-break') {
      if (currentPage.childElementCount === 0) {
        continue;
      }

      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
      continue;
    }

    const nextUnit = exportUnits[unitIndex + 1];
    const nextHeight = nextUnit && nextUnit.type === 'content' ? nextUnit.height : 0;
    const shouldMoveUnitToNextPage =
      unit.keepWithNext &&
      currentApproxHeight > 0 &&
      currentApproxHeight + unit.height + nextHeight > maxContentHeightPx;

    if (shouldMoveUnitToNextPage) {
      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
    }

    const blockClone = unit.node.cloneNode(true) as HTMLDivElement;
    currentPage.appendChild(blockClone);

    if (currentPage.scrollHeight <= currentPage.clientHeight + 1) {
      currentApproxHeight += unit.height;
      continue;
    }

    currentPage.removeChild(blockClone);

    if (currentPage.childElementCount > 0) {
      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
      currentPage.appendChild(blockClone);
      currentApproxHeight += unit.height;
    } else if (unit.height > maxContentHeightPx) {
      const firstChildTag = blockClone.firstElementChild?.tagName?.toLowerCase();
      const canOverflowSinglePage = firstChildTag !== 'p' && firstChildTag !== 'li';

      if (canOverflowSinglePage) {
        currentPage.appendChild(blockClone);
        currentPage.style.height = 'auto';
        currentPage.style.overflow = 'visible';
        currentPage.style.minHeight = '297mm';

        currentPage = createPage();
        currentApproxHeight = 0;
        exportRoot.appendChild(currentPage);
      } else {
        currentPage.appendChild(blockClone);
        currentApproxHeight += unit.height;
      }
    } else {
      currentPage.appendChild(blockClone);
      currentApproxHeight += unit.height;
    }
  }

  if (currentPage.childElementCount === 0) {
    currentPage.remove();
  }

  const pages = Array.from(exportRoot.querySelectorAll('.pdf-page')) as HTMLDivElement[];
  const lastPage = pages[pages.length - 1];
  if (lastPage) {
    lastPage.style.breakAfter = 'auto';
    lastPage.style.pageBreakAfter = 'auto';
  }

  return exportRoot;
};

const exportCanvasSlicesToPdf = async (
  element: HTMLDivElement,
  pdf: jsPDF,
  startWithBlankDocument: boolean
) => {
  const fullCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const pageHeightPx = Math.floor((fullCanvas.width * 297) / 210);
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < fullCanvas.height) {
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = pageHeightPx;

    const context = sliceCanvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    context.drawImage(
      fullCanvas,
      0,
      offsetY,
      fullCanvas.width,
      Math.min(pageHeightPx, fullCanvas.height - offsetY),
      0,
      0,
      fullCanvas.width,
      Math.min(pageHeightPx, fullCanvas.height - offsetY)
    );

    const imageData = sliceCanvas.toDataURL('image/jpeg', 0.98);

    if (!startWithBlankDocument || pageIndex > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    offsetY += pageHeightPx;
    pageIndex += 1;
  }
};

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MD);
  const [title, setTitle] = useState("Döküman Analiz Raporu");
  const [status, setStatus] = useState<ProcessingState>({ status: AppStatus.IDLE });
  const [editorWidth, setEditorWidth] = useState(window.innerWidth * 0.4);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [exportMarkdown, setExportMarkdown] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || Theme.LIGHT;
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const exportPreviewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const sidebarWidth = 64;
      const newWidth = e.clientX - containerRef.current.offsetLeft - sidebarWidth;
      if (newWidth > 200 && newWidth < window.innerWidth - 300) {
        setEditorWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      const handleMouseUp = () => setIsResizing(false);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resize]);

  const handleEnhance = async () => {
    setStatus({ status: AppStatus.PROCESSING, message: 'Gemini içeriği optimize ediyor...' });
    try {
      const enhanced = await enhanceMarkdownContent(markdown);
      setMarkdown(enhanced);
      setStatus({ status: AppStatus.IDLE, message: 'İçerik zenginleştirildi!' });
      setTimeout(() => setStatus({ status: AppStatus.IDLE }), 3000);
    } catch (err) {
      const message =
        err instanceof GeminiServiceError
          ? err.message
          : 'AI işlemi başarısız.';
      setStatus({ status: AppStatus.ERROR, message });
    }
  };

  const exportToPdf = async () => {
    setStatus({ status: AppStatus.EXPORTING, message: 'AI destekli PDF düzeni hazırlanıyor...' });
    let exportContainer: HTMLDivElement | null = null;

    try {
      let preparedMarkdown = markdown;
      try {
        preparedMarkdown = await prepareMarkdownForPdfLayout(markdown);
      } catch (err) {
        const fallbackMessage =
          err instanceof GeminiServiceError
            ? `${err.message} Yerel PDF düzenine geçiliyor...`
            : 'AI düzeni hazırlanamadı. Yerel PDF düzenine geçiliyor...';
        setStatus({ status: AppStatus.EXPORTING, message: fallbackMessage });
      }
      setExportMarkdown(preparedMarkdown);

      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      await new Promise(resolve => setTimeout(resolve, 250));

      const sourceElement = exportPreviewRef.current;
      if (!sourceElement) {
        throw new Error('Export preview unavailable');
      }

      exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-99999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.padding = '0';
      exportContainer.style.margin = '0';
      exportContainer.style.zIndex = '-1';
      document.body.appendChild(exportContainer);

      const paginatedRoot = createPaginatedExportRoot(sourceElement, exportContainer);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pages = Array.from(paginatedRoot.querySelectorAll('.pdf-page')) as HTMLDivElement[];

      if (pages.length <= 1) {
        exportContainer.replaceChildren(sourceElement.cloneNode(true) as HTMLDivElement);
        const fallbackElement = exportContainer.firstElementChild as HTMLDivElement;
        await exportCanvasSlicesToPdf(fallbackElement, pdf, true);
      } else {
        for (let index = 0; index < pages.length; index += 1) {
          const page = pages[index];
          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: page.scrollWidth,
            windowHeight: page.scrollHeight
          });

          const imageData = canvas.toDataURL('image/jpeg', 0.98);

          if (index > 0) {
            pdf.addPage('a4', 'portrait');
          }

          pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        }
      }

      pdf.save(`${(title || 'document').trim() || 'document'}.pdf`);

      setStatus({ status: AppStatus.IDLE, message: 'PDF kaydedildi!' });
      setTimeout(() => setStatus({ status: AppStatus.IDLE }), 2500);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setStatus({ status: AppStatus.ERROR, message: 'PDF oluşturma hatası' });
    } finally {
      exportContainer?.remove();
      setExportMarkdown(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMarkdown(ev.target?.result as string || '');
      setTitle(file.name.replace('.md', ''));
    };
    reader.readAsText(file);
  };

  const markdownSections = createMarkdownSections(markdown);
  const exportSections = createMarkdownSections(exportMarkdown ?? markdown);

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'mermaid') {
        return (
          <div className="mermaid-wrapper my-4 flex justify-center overflow-visible">
            <Mermaid chart={String(children).replace(/\n$/, '')} />
          </div>
        );
      }
      return (
        <code className={`${className} bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium`} {...props}>
          {children}
        </code>
      );
    },
    table: ({ children }: any) => <div className="table-responsive my-6"><table className="min-w-full">{children}</table></div>,
    img: ({ src, alt }: any) => (
      <div className="my-8 flex flex-col items-center">
        <img src={src} alt={alt} className="shadow-md border border-slate-100" />
        {alt && <span className="text-[10px] text-slate-400 mt-2 font-medium italic">{alt}</span>}
      </div>
    )
  };

  return (
    <div className={`min-h-screen flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300 ${isResizing ? 'is-resizing' : ''}`}>
      {/* Header Panel */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between z-30 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <Layers size={22} />
            </div>
            <div className="hidden sm:block">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 rounded px-1 transition-all bg-transparent text-lg"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                <Check size={11} className="text-indigo-500" />
                Vektörel Motor & AI Aktif
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditorVisible(!isEditorVisible)}
            className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all border ${isEditorVisible ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750' : 'bg-indigo-600 text-white border-indigo-600 shadow-md'}`}
          >
            {isEditorVisible ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
            {isEditorVisible ? 'Odak Modu' : 'Editörü Göster'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-sm"
            title={theme === Theme.LIGHT ? "Karanlık Moda Geç" : "Aydınlık Moda Geç"}
          >
            {theme === Theme.LIGHT ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button
            onClick={handleEnhance}
            disabled={status.status !== AppStatus.IDLE}
            className="group relative bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={18} className="text-indigo-500 group-hover:animate-pulse" />
            AI İyileştir
          </button>

          <button
            onClick={exportToPdf}
            disabled={status.status !== AppStatus.IDLE}
            className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {status.status === AppStatus.EXPORTING ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            PDF Kaydet
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="no-print w-16 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-8 gap-8 bg-white dark:bg-slate-900 z-20 transition-colors duration-300">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { setIsEditorVisible(true); setEditorWidth(window.innerWidth * 0.4); }}
              className={`p-3 rounded-2xl transition-all ${isEditorVisible ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Split Görünüm"
            >
              <Columns size={20} />
            </button>
            <button
              onClick={() => setIsEditorVisible(false)}
              className={`p-3 rounded-2xl transition-all ${!isEditorVisible ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Tam Önizleme"
            >
              <Eye size={20} />
            </button>
          </div>

          <div className="h-px w-8 bg-slate-100 dark:bg-slate-800"></div>

          <div className="flex flex-col gap-4">
            <label className="p-3 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all cursor-pointer">
              <PlusCircle size={20} />
              <input type="file" accept=".md" className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              onClick={() => { if (confirm('Tüm içeriği temizlemek istiyor musunuz?')) setMarkdown(''); }}
              className="p-3 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
              title="Temizle"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div
          style={{ width: isEditorVisible ? `${editorWidth}px` : '0px', transition: isResizing ? 'none' : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          className="no-print flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative border-r border-slate-100 dark:border-slate-800 transition-colors duration-300"
        >
          <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between whitespace-nowrap">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Markdown Kaynağı</span>
          </div>
          <textarea
            className="flex-1 p-8 editor-font text-[14px] resize-none focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed selection:bg-indigo-100 dark:selection:bg-indigo-900/40 min-w-[300px] transition-colors duration-300"
            placeholder="Yazmaya başlayın..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Resizer Handle */}
        {isEditorVisible && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`resize-handle ${isResizing ? 'resizing' : ''} dark:bg-slate-800 dark:hover:bg-indigo-500`}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-20 dark:opacity-40 group-hover:opacity-100">
              <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
              <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
              <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            </div>
          </div>
        )}

        {/* PDF Preview Area */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative preview-container text-slate-300 dark:text-slate-800 transition-colors duration-300">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">A4 Canlı Render</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
              <span className="italic">Çözünürlük: 300 DPI</span>
              <Maximize2 size={13} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer" />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 md:p-12 scroll-smooth">
            <div className="mx-auto flex justify-center pb-20">
              <div
                ref={previewRef}
                className="bg-white w-full max-w-[800px] min-h-[1123px] paper-shadow px-[15mm] py-[20mm] md:px-[22mm] md:py-[25mm] text-slate-800 break-words prose-pdf origin-top transition-all hover:shadow-2xl rounded-[2px]"
              >
                {markdownSections.map((section, index) => {
                  if (section.type === 'page-break') {
                    return <div key={`page-break-${index}`} className="page-break" aria-hidden="true" />;
                  }

                  return (
                    <section key={`section-${index}`} className={`content-section ${section.keepWithNext ? 'keep-with-next' : ''}`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[[rehypeKatex, { strict: false }]]}
                        components={markdownComponents}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed left-[-99999px] top-0 pointer-events-none opacity-0" aria-hidden="true">
        <div
          ref={exportPreviewRef}
          className="bg-white w-[210mm] max-w-[210mm] min-h-[297mm] px-[15mm] py-[20mm] text-slate-800 break-words prose-pdf"
        >
          {exportSections.map((section, index) => {
            if (section.type === 'page-break') {
              return <div key={`export-page-break-${index}`} className="page-break" aria-hidden="true" />;
            }

            return (
              <section key={`export-section-${index}`} className={`content-section ${section.keepWithNext ? 'keep-with-next' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  components={markdownComponents}
                >
                  {section.content}
                </ReactMarkdown>
              </section>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 z-30 transition-colors duration-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.status === AppStatus.IDLE ? 'bg-emerald-500' : 'bg-indigo-600 animate-pulse'}`}></div>
            <span className="text-slate-600 dark:text-slate-400 uppercase tracking-tight">{status.message || 'Sistem Hazır'}</span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex gap-4 opacity-50 uppercase tracking-tighter">
            <span>Satır: {markdown.split('\n').length}</span>
            <span>Kelime: {markdown.trim() ? markdown.trim().split(/\s+/).length : 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-5 text-slate-400 dark:text-slate-600">
          <span className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-help"><Info size={13} /> Destek</span>
          <span className="text-slate-100 dark:text-slate-800">|</span>
          <span className="text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase">Motor V5.2 DX</span>
        </div>
      </footer>

      {/* Processing Overlay */}
      {(status.status === AppStatus.PROCESSING || status.status === AppStatus.EXPORTING) && (
        <div className="no-print fixed inset-0 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[6px] z-[100] flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-14 rounded-[4rem] shadow-2xl border border-white dark:border-slate-800 flex flex-col items-center gap-8 text-center max-w-sm">
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={32} className="text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-2xl tracking-tighter leading-none">{status.message}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-3 font-semibold uppercase tracking-widest opacity-60">Lütfen bekleyin...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
