'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  siteName: string;
  locale?: string;
};

// 首页上的「供 AI 代理」入口：默认收起，展开后给出一段可直接粘贴给代理的文字。
export function AgentEntries({ siteName, locale = 'zh-CN' }: Props) {
  const zh = locale.startsWith('zh');
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const text = zh
    ? {
        trigger: '供 AI 代理',
        hint: '把这段文字连同链接一起发给 AI 代理。',
        copy: '复制',
        copied: '已复制',
      }
    : {
        trigger: 'For AI agents',
        hint: 'Send this text together with the links to an AI agent.',
        copy: 'Copy',
        copied: 'Copied',
      };

  // 端口随实际访问变化，挂载后再取值，避免服务端渲染出错误地址。
  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const prompt = zh
    ? [
        `请先阅读 ${origin}/llms.txt。这是 ${siteName} 的文档索引，条目链接都指向对应页面的 Markdown 原文。`,
        `需要全部内容时读 ${origin}/llms-full.txt。`,
        '据此回答我的问题，不要凭猜测补全命令与参数。',
      ].join('\n')
    : [
        `Read ${origin}/llms.txt first. It is the documentation index for ${siteName}; every entry links to the Markdown source of that page.`,
        `Read ${origin}/llms-full.txt when the full content is needed.`,
        'Answer from those files and do not guess commands or parameters.',
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
    <div ref={container} className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="agent-entries"
        className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        {text.trigger}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id="agent-entries"
          className="absolute left-1/2 top-full z-20 mt-2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border bg-fd-background p-4 text-left shadow-lg"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-xs text-fd-muted-foreground">{text.hint}</p>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded border px-2 py-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              {copied ? text.copied : text.copy}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-md border bg-fd-muted/40 p-3 text-xs leading-relaxed">
            <code>{prompt}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
