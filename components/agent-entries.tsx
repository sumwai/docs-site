'use client';

import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  sourceUrl: string;
  siteName?: string;
  locale?: string;
};

// 文档页顶部的「让 AI 代理阅读」入口：收起时与 Copy Markdown 按钮对齐，
// 展开后提供当前页 Markdown 原文直链、可直接复制的代理提示词与一键复制按钮。
export function AgentEntries({ sourceUrl, locale = 'zh-CN' }: Props) {
  const zh = locale.startsWith('zh');
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const text = zh
    ? {
        trigger: '让 AI 代理阅读',
        sourceLabel: 'Markdown 原文',
        promptLabel: '代理提示词',
        copy: '复制',
        copied: '已复制',
      }
    : {
        trigger: 'For Agent',
        sourceLabel: 'Markdown source',
        promptLabel: 'Prompt for agent',
        copy: 'Copy',
        copied: 'Copied',
      };

  // 端口随实际访问变化，挂载后再取值，避免服务端渲染出错误地址。
  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!open) {
      setOffsetX(0);
      return;
    }

    const updatePosition = () => {
      const el = popoverRef.current;
      const anchor = container.current;
      if (!el || !anchor) return;
      const margin = 16;
      const anchorRect = anchor.getBoundingClientRect();
      const overflowRight = anchorRect.left + el.offsetWidth - (window.innerWidth - margin);
      if (overflowRight > 0) {
        const maxShiftLeft = Math.max(0, anchorRect.left - margin);
        setOffsetX(-Math.min(overflowRight, maxShiftLeft));
      } else {
        setOffsetX(0);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const fullSourceUrl = origin ? `${origin}${sourceUrl}` : sourceUrl;
  const fullLlmsUrl = origin ? `${origin}/llms.txt` : '/llms.txt';

  const prompt = zh
    ? [
        `请先阅读 ${fullSourceUrl} 了解相关内容，并据此回答我的问题。`,
        `如需查阅全站文档索引，请访问 ${fullLlmsUrl}。`,
      ].join('\n')
    : [
        `Read ${fullSourceUrl} first to understand the relevant content, and answer my questions based on it.`,
        `For the full documentation index, see ${fullLlmsUrl}.`,
      ].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div ref={container} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="agent-entries"
        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-fd-border bg-fd-secondary px-2.5 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground"
      >
        {text.trigger}
        <ChevronDown
          aria-hidden="true"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open && (
        <div
          ref={popoverRef}
          id="agent-entries"
          role="dialog"
          aria-label={text.trigger}
          style={{ transform: offsetX ? `translateX(${offsetX}px)` : undefined }}
          className="absolute left-0 top-full z-30 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-fd-border bg-fd-popover p-3.5 text-left text-fd-popover-foreground shadow-lg"
        >
          <div className="mb-3 rounded-md border border-fd-border bg-fd-muted/40 px-3 py-2">
            <div className="mb-1 text-[11px] font-medium text-fd-muted-foreground">
              {text.sourceLabel}
            </div>
            <a
              href={fullSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 break-all font-mono text-xs text-fd-primary underline-offset-4 hover:underline"
            >
              <span>{fullSourceUrl}</span>
              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            </a>
          </div>

          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-fd-muted-foreground">
              {text.promptLabel}
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-fd-border bg-fd-secondary px-2 py-1 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? text.copied : text.copy}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-md border border-fd-border bg-fd-muted/40 p-2.5 text-xs leading-relaxed text-fd-foreground">
            <code>{prompt}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
