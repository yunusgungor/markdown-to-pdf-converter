
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

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
            // SVG'yi direkt göster - inline SVG html2canvas tarafından daha iyi desteklenir
            ref.current.innerHTML = svg;

            // SVG elementine özel stil ekle (PDF uyumluluğu için)
            const svgElement = ref.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.maxWidth = '100%';
              svgElement.style.height = 'auto';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
              // PDF için önemli: background rengi
              svgElement.style.backgroundColor = 'white';
            }
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
