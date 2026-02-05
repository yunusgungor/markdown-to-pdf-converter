
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter',
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

          // Render with useMaxWidth: true in the render options if possible, 
          // but mermaid.render doesn't take many options. 
          // We'll handle it via CSS and individual SVG manipulation.
          const { svg } = await mermaid.render(id, chart);

          if (ref.current) {
            ref.current.innerHTML = svg;

            const svgElement = ref.current.querySelector('svg');
            if (svgElement) {
              // Sadece style üzerinden müdahale et, öznitelikleri (attributes) tamamen silme
              // Bu sayede tarayıcı intrinsic aspect ratio'yu koruyabilir.
              svgElement.style.maxWidth = '100%';
              svgElement.style.height = 'auto';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
              svgElement.style.backgroundColor = 'white';

              // Mobilde veya küçük alanlarda taşmayı önle
              svgElement.style.width = '100%';
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
