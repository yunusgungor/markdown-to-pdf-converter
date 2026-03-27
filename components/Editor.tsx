import React from 'react';

export interface EditorProps {
  markdown: string;
  onChange: (value: string) => void;
  isEditorVisible: boolean;
  editorWidth: number;
  isResizing: boolean;
}

const Editor: React.FC<EditorProps> = ({
  markdown,
  onChange,
  isEditorVisible,
  editorWidth,
  isResizing,
}) => {
  return (
    <div
      style={{
        width: isEditorVisible ? `${editorWidth}px` : '0px',
        transition: isResizing
          ? 'none'
          : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="no-print flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative border-r border-slate-100 dark:border-slate-800 transition-colors duration-300"
    >
      <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between whitespace-nowrap">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Markdown Kaynağı
        </span>
      </div>
      <textarea
        aria-label="Markdown içerik düzenleyici"
        className="flex-1 p-8 editor-font text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed selection:bg-indigo-100 dark:selection:bg-indigo-900/40 min-w-[300px] transition-colors duration-300"
        placeholder="Yazmaya başlayın..."
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;