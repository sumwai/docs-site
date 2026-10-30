import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/site.config';
import { getRequestUrl } from '@/lib/shared';
import { AgentEntries } from '@/components/agent-entries';

// 按实际请求推导，预览换端口时 alternate 链接仍然指向本机。
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      types: {
        'text/plain': await getRequestUrl('/llms.txt'),
      },
    },
  };
}

export default function HomePage() {
  const zh = site.locale.startsWith('zh');

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {site.tagline && <p className="mb-3 text-sm text-fd-muted-foreground">{site.tagline}</p>}
      <h1 className="mb-4 text-4xl font-bold tracking-tight">{site.name}</h1>
      <p className="mb-8 max-w-xl text-fd-muted-foreground">{site.description}</p>
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          {zh ? '阅读文档' : 'Read the docs'}
        </Link>
        <AgentEntries siteName={site.name} locale={site.locale} />
      </div>
    </main>
  );
}
