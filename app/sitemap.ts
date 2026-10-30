import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { getRequestUrl } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await Promise.all(
    source.getPages().map(async (page) => ({
      url: await getRequestUrl(page.url),
      changeFrequency: 'weekly' as const,
      priority: page.url === '/docs' ? 1 : 0.7,
    })),
  );

  return pages;
}
