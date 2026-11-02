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
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { getPageImageUrl, getPageMarkdownUrl, getPageSourceUrl } from '@/lib/shared';
import { site } from '@/site.config';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <a
          href={getPageSourceUrl(page)}
          className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          Markdown
        </a>
        <ThemeSwitch className="ms-auto" />
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

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    // 首页标题与站点名相同，模板会拼成「lax | lax」；其余页面照常带站点名。
    title: params.slug?.length ? page.data.title : { absolute: site.name },
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
