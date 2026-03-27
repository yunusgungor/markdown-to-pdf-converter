import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import DOMPurify from 'dompurify';

import Mermaid from './Mermaid';
import { MarkdownSection } from '../utils/markdown';

export interface PreviewProps {
  sections: MarkdownSection[];
  isExport?: boolean;
  className?: string;
}

export interface PreviewHandle {
  getContainer: () => HTMLDivElement | null;
}

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

const Preview = forwardRef<HTMLDivElement, PreviewProps>(
  ({ sections, isExport = false, className = '' }, ref) => {
    const containerClassName = isExport
      ? 'bg-white w-[210mm] max-w-[210mm] min-h-[297mm] px-[15mm] py-[20mm] text-slate-800 break-words prose-pdf'
      : `bg-white w-full max-w-[800px] min-h-[1123px] paper-shadow px-[15mm] py-[20mm] md:px-[22mm] md:py-[25mm] text-slate-800 break-words prose-pdf origin-top transition-all hover:shadow-2xl rounded-[2px] ${className}`;

    return (
      <div ref={ref} className={containerClassName}>
        {sections.map((section, index) => {
          if (section.type === 'page-break') {
            return (
              <div
                key={`page-break-${index}`}
                className="page-break"
                aria-hidden="true"
              />
            );
          }

          return (
            <section
              key={`section-${index}`}
              className={`content-section ${section.keepWithNext ? 'keep-with-next' : ''}`}
            >
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
    );
  }
);

Preview.displayName = 'Preview';

export default Preview;