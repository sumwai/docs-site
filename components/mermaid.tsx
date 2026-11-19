'use client';

import { useEffect, useId, useState } from 'react';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'default'>('default');

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setTheme(root.classList.contains('dark') ? 'dark' : 'default');
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme,
        });

        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) {
          setSvg(rendered);
        }
      } catch (error) {
        console.error('Failed to render mermaid diagram:', error);
        if (!cancelled) {
          setSvg('');
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, id, theme]);

  if (!svg) {
    return (
      <div className="my-4 flex justify-center overflow-x-auto">
        <pre className="text-sm text-fd-muted-foreground">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto [&_svg]:max-w-none"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
