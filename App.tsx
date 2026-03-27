import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import DOMPurify from 'dompurify';
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
  Moon,
} from 'lucide-react';

import Mermaid from './components/Mermaid';
import Header from './components/Header';
import Preview from './components/Preview';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import {
  enhanceMarkdownContent,
  prepareMarkdownForPdfLayout,
} from './geminiService';
import { AppStatus, GeminiServiceError, ProcessingState, Theme } from './types';
import {
  PAGE_BREAK_TOKEN,
  KEEP_WITH_NEXT_TOKEN,
  MarkdownSection,
  splitMarkdownIntoBlocks,
  createMarkdownSections,
} from './utils/markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createPaginatedExportRoot, exportCanvasSlicesToPdf } from './hooks/usePdfExport';

const INITIAL_MD = ``;

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState(() => {
    return localStorage.getItem('mdupdf-content') || INITIAL_MD;
  });
  const [title, setTitle] = useState(() => {
    return localStorage.getItem('mdupdf-title') || 'Döküman Analiz Raporu';
  });
  const [status, setStatus] = useState<ProcessingState>({
    status: AppStatus.IDLE,
  });
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleEnhanceRef = useRef<(() => Promise<void>) | null>(null);
  const exportToPdfRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save title to localStorage on change
  useEffect(() => {
    localStorage.setItem('mdupdf-title', title);
  }, [title]);

  // Debounced save for markdown content
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('mdupdf-content', markdown);
    }, 500);
    return () => clearTimeout(timer);
  }, [markdown]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  };

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const sidebarWidth = 64;
        const newWidth =
          e.clientX - containerRef.current.offsetLeft - sidebarWidth;
        if (newWidth > 200 && newWidth < window.innerWidth - 300) {
          setEditorWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

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

  // Keyboard shortcuts - use refs to avoid dependency issues
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key === 's') {
        e.preventDefault();
        if (exportToPdfRef.current) exportToPdfRef.current();
      } else if (isMod && e.key === 'Enter') {
        e.preventDefault();
        if (handleEnhanceRef.current) handleEnhanceRef.current();
      } else if (isMod && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnhance = async () => {
    setStatus({
      status: AppStatus.PROCESSING,
      message: 'Gemini içeriği optimize ediyor...',
    });
    try {
      const enhanced = await enhanceMarkdownContent(markdown);
      setMarkdown(enhanced);
      setStatus({
        status: AppStatus.IDLE,
        message: 'İçerik zenginleştirildi!',
      });
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
    setStatus({
      status: AppStatus.EXPORTING,
      message: 'AI destekli PDF düzeni hazırlanıyor...',
    });
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

      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null))
      );
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null))
      );
      await new Promise((resolve) => setTimeout(resolve, 250));

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

      const paginatedRoot = createPaginatedExportRoot(
        sourceElement,
        exportContainer
      );

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pages = Array.from(
        paginatedRoot.querySelectorAll('.pdf-page')
      ) as HTMLDivElement[];

      if (pages.length <= 1) {
        exportContainer.replaceChildren(
          sourceElement.cloneNode(true) as HTMLDivElement
        );
        const fallbackElement =
          exportContainer.firstElementChild as HTMLDivElement;
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
            windowHeight: page.scrollHeight,
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
      setMarkdown((ev.target?.result as string) || '');
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
        <code
          className={`${className} bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium`}
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ children }: any) => (
      <div className="table-responsive my-6">
        <table className="min-w-full">{children}</table>
      </div>
    ),
    img: ({ src, alt }: any) => (
      <div className="my-8 flex flex-col items-center">
        <img
          src={DOMPurify.sanitize(src || '')}
          alt={DOMPurify.sanitize(alt || '')}
          className="shadow-md border border-slate-100"
        />
        {alt && (
          <span className="text-[10px] text-slate-400 mt-2 font-medium italic">
            {DOMPurify.sanitize(alt || '')}
          </span>
        )}
      </div>
    ),
  };

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300 ${isResizing ? 'is-resizing' : ''}`}
    >
      {/* Header Panel */}
      <Header
        title={title}
        onTitleChange={setTitle}
        theme={theme}
        onThemeToggle={toggleTheme}
        isEditorVisible={isEditorVisible}
        onToggleEditor={() => setIsEditorVisible(!isEditorVisible)}
        status={status}
        onEnhance={handleEnhance}
        onExportPdf={exportToPdf}
      />

      {/* Main Workspace */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isEditorVisible={isEditorVisible}
          setIsEditorVisible={setIsEditorVisible}
          setEditorWidth={setEditorWidth}
          onFileUpload={handleFileUpload}
          onClearContent={() => {
            if (confirm('Tüm içeriği temizlemek istiyor musunuz?'))
              setMarkdown('');
          }}
        />

        {/* Hidden file input for Ctrl+O shortcut */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleFileUpload}
        />

        <Editor
          markdown={markdown}
          onChange={setMarkdown}
          isEditorVisible={isEditorVisible}
          editorWidth={editorWidth}
          isResizing={isResizing}
        />

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
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                A4 Canlı Render
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
              <span className="italic">Çözünürlük: 300 DPI</span>
              <Maximize2
                size={13}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 md:p-12 scroll-smooth">
            <div className="mx-auto flex justify-center pb-20">
              <Preview
                ref={previewRef}
                sections={markdownSections}
                className="paper-shadow origin-top transition-all hover:shadow-2xl"
              />
            </div>
          </div>
        </div>
      </main>

      <div
        className="fixed left-[-99999px] top-0 pointer-events-none opacity-0"
        aria-hidden="true"
      >
        <Preview
          ref={exportPreviewRef}
          sections={exportSections}
          isExport={true}
        />
      </div>

      {/* Footer Info */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 z-30 transition-colors duration-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${status.status === AppStatus.IDLE ? 'bg-emerald-500' : 'bg-indigo-600 animate-pulse'}`}
              aria-hidden="true"
            ></div>
            <span className="text-slate-600 dark:text-slate-400 uppercase tracking-tight" aria-live="polite">
              {status.message || 'Sistem Hazır'}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex gap-4 opacity-50 uppercase tracking-tighter">
            <span>Satır: {markdown.split('\n').length}</span>
            <span>
              Kelime:{' '}
              {markdown.trim() ? markdown.trim().split(/\s+/).length : 0}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-5 text-slate-400 dark:text-slate-600">
          <span className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-help">
            <Info size={13} /> Destek
          </span>
          <span className="text-slate-100 dark:text-slate-800">|</span>
          <span className="text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase">
            Motor V5.2 DX
          </span>
        </div>
      </footer>

      {/* Processing Overlay */}
      {(status.status === AppStatus.PROCESSING ||
        status.status === AppStatus.EXPORTING) && (
        <div className="no-print fixed inset-0 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[6px] z-[100] flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-14 rounded-[4rem] shadow-2xl border border-white dark:border-slate-800 flex flex-col items-center gap-8 text-center max-w-sm">
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={32} className="text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-2xl tracking-tighter leading-none">
                {status.message}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-3 font-semibold uppercase tracking-widest opacity-60">
                Lütfen bekleyin...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
