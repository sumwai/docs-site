import { site } from '@/site.config';
import { getRequestUrl } from '@/lib/shared';

export const dynamic = 'force-dynamic';

// 用路由而不是 metadata 的 robots：需要写注释告诉 Agent 索引与 Markdown 在哪。
export async function GET() {
  const zh = site.locale.startsWith('zh');
  const body = [
    zh ? `# ${site.name} 文档` : `# ${site.name} docs`,
    zh
      ? '# 面向 Agent：索引在 /llms.txt，全文在 /llms-full.txt，'
      : '# For agents: the index is /llms.txt, the full text is /llms-full.txt,',
    zh
      ? '# 任意页面地址后加 .md 返回该页的 Markdown 原文。'
      : '# Append .md to any page URL to get its Markdown source.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${await getRequestUrl('/sitemap.xml')}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
