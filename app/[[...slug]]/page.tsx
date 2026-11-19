import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, getPageMarkdownUrl, getPageSourceUrl } from '@/lib/shared';
import { AgentEntries } from '@/components/agent-entries';
import { site } from '@/site.config';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  // 根地址就是「公开入口」页：读者一进来就能看到 Agent 的读取入口。
  const isEntry = page.url === '/';

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row flex-wrap gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <a
          href={getPageSourceUrl(page)}
          className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          Markdown
        </a>
        {isEntry && <AgentEntries siteName={site.name} locale={site.locale} />}
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    // 根地址也是一个普通文档页，标题同样带站点名。
    title: page.data.title,
    description: page.data.description,
    // Agent 与爬虫可以从 HTML 的 <link rel="alternate"> 直接找到该页的 Markdown 原文。
    alternates: {
      canonical: page.url,
      types: {
        'text/markdown': getPageSourceUrl(page),
      },
    },
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
