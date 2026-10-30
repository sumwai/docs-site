import { createGetUrl } from 'fumadocs-core/source';
import { headers } from 'next/headers';
import { site } from '@/site.config';

export const appName = site.name;
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// 用于静态元数据（metadataBase）。需要在响应里给出精确地址的地方用 getRequestUrl。
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000').replace(
  /\/$/,
  '',
);

// llms.txt、robots.txt、sitemap.xml 里的绝对地址按实际请求推导，
// 这样开发服务器、生产预览、自定义端口下都对得上。
export async function getRequestUrl(path = '') {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${siteUrl}${path}`;
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '127.0.0.1:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}${path}`;
}

// 页面地址后加 .md 就是该页的 Markdown 原文，由 proxy.ts 重写到 content.md。
export function getPageSourceUrl(page: { url: string }) {
  return `${page.url}.md`;
}

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
