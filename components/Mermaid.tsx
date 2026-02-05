
import React, { useEffect, useRef } from 'react';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (ref.current && chart) {
        try {
          ref.current.removeAttribute('data-processed');
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid Render Error:", error);
          if (ref.current) {
            ref.current.innerHTML = `<div class="bg-red-50 text-red-500 p-2 text-xs border border-red-200 rounded">Error rendering diagram</div>`;
          }
        }
      }
    };

    renderChart();
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid flex justify-center my-6 overflow-x-auto" />;
};

export default Mermaid;
