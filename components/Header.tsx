import React from 'react';
import { 
  Layers, 
  Check, 
  PanelLeftClose, 
  PanelLeft, 
  Moon, 
  Sun, 
  Sparkles, 
  Download, 
  Loader2 
} from 'lucide-react';
import { Theme, AppStatus } from '../types';

interface HeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
  isEditorVisible: boolean;
  onToggleEditor: () => void;
  status: {
    status: AppStatus;
    message?: string;
  };
  onEnhance: () => void;
  onExportPdf: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  theme,
  onThemeToggle,
  isEditorVisible,
  onToggleEditor,
  status,
  onEnhance,
  onExportPdf,
}) => {
  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between z-30 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
            <Layers size={22} />
          </div>
          <div className="hidden sm:block">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              aria-label="Döküman başlığı"
              className="font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 rounded px-1 transition-all bg-transparent text-lg"
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              <Check size={11} className="text-indigo-500" />
              Vektörel Motor & AI Aktif
            </div>
          </div>
        </div>

        <button
          onClick={onToggleEditor}
          aria-label={isEditorVisible ? 'Editörü kapat, tam önizleme moduna geç' : 'Editörü aç, bölünmüş görünüm moduna geç'}
          className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all border ${isEditorVisible ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750' : 'bg-indigo-600 text-white border-indigo-600 shadow-md'}`}
        >
          {isEditorVisible ? (
            <PanelLeftClose size={14} />
          ) : (
            <PanelLeft size={14} />
          )}
          {isEditorVisible ? 'Odak Modu' : 'Editörü Göster'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onThemeToggle}
          aria-label={theme === Theme.LIGHT ? 'Karanlık moda geç' : 'Aydınlık moda geç'}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-sm"
        >
          {theme === Theme.LIGHT ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button
          onClick={onEnhance}
          disabled={status.status !== AppStatus.IDLE}
          aria-label="AI ile içeriği iyileştir"
          className="group relative bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles
            size={18}
            className="text-indigo-500 group-hover:animate-pulse"
          />
          AI İyileştir
        </button>

        <button
          onClick={onExportPdf}
          disabled={status.status !== AppStatus.IDLE}
          aria-label={status.status === AppStatus.EXPORTING ? 'PDF dışa aktarılıyor, lütfen bekleyin' : 'PDF olarak kaydet'}
          className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
        >
          {status.status === AppStatus.EXPORTING ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Download size={18} />
          )}
          PDF Kaydet
        </button>
      </div>
    </header>
  );
};

export default Header;