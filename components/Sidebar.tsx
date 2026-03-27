import React from 'react';
import {
  Columns,
  Eye,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export interface SidebarProps {
  isEditorVisible: boolean;
  setIsEditorVisible: (visible: boolean) => void;
  setEditorWidth: (width: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearContent: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isEditorVisible,
  setIsEditorVisible,
  setEditorWidth,
  onFileUpload,
  onClearContent,
}) => {
  return (
    <div className="no-print w-16 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-8 gap-8 bg-white dark:bg-slate-900 z-20 transition-colors duration-300">
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            setIsEditorVisible(true);
            setEditorWidth(window.innerWidth * 0.4);
          }}
          aria-label="Bölünmüş görünüm moduna geç"
          className={`p-3 rounded-2xl transition-all ${isEditorVisible ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Columns size={20} />
        </button>
        <button
          onClick={() => setIsEditorVisible(false)}
          aria-label="Tam önizleme moduna geç"
          className={`p-3 rounded-2xl transition-all ${!isEditorVisible ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Eye size={20} />
        </button>
      </div>

      <div className="h-px w-8 bg-slate-100 dark:bg-slate-800"></div>

      <div className="flex flex-col gap-4">
        <label className="p-3 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all cursor-pointer" aria-label="Markdown dosyası yükle">
          <PlusCircle size={20} />
          <input
            type="file"
            accept=".md"
            className="hidden"
            onChange={onFileUpload}
          />
        </label>

        <button
          onClick={onClearContent}
          aria-label="İçeriği temizle"
          className="p-3 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
