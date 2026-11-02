import { site } from '@/site.config';
import { docsLlms } from '@/lib/source';
import { getRequestUrl } from '@/lib/shared';

export const dynamic = 'force-dynamic';

// 索引里的链接直接指向每页的 Markdown 原文：Agent 读到 llms.txt 之后不需要再猜
// 页面地址后面加什么后缀，也不必请求 HTML 再解析。
function toMarkdownLinks(index: string) {
  return index.replace(/\]\((\/docs[^)\s]*)\)/g, (_match, path: string) => {
    if (path.endsWith('.md')) return `](${path})`;
    return `](${path}.md)`;
  });
}

// docsLlms.index() 会同时输出加粗的文件夹标题与同名 index 页面。分组标题不带
// 页面链接，保留它只会让索引里出现两行同名内容，因此只保留带链接的页面条目。
function dropDuplicateFolders(index: string) {
  return index
    .split('\n')
    .filter((line) => {
      if (/^- \*\*.+\*\*$/.test(line)) return false;
      return !/^- [^\[].+$/.test(line);
    })
    .join('\n');
}

export async function GET() {
  const zh = site.locale.startsWith('zh');
  // docsLlms.index() 自己带一级标题，这里去掉，换成带读取说明的头部。
  const index = dropDuplicateFolders(
    toMarkdownLinks(await docsLlms.index()).replace(/^# .*\n+/, ''),
  );

  const header = zh
    ? [
        `# ${site.name} 文档`,
        '',
        '> 面向 Agent 的读取方式：本文件是索引，每条的链接都是对应页面的 Markdown 原文。',
        '> 全文合并版在 /llms-full.txt；任意页面地址后加 .md 也能取到 Markdown。',
        `> 站点根地址：${await getRequestUrl()}`,
      ]
    : [
        `# ${site.name} docs`,
        '',
        '> For agents: this file is the index, and every entry links to the Markdown source of that page.',
        '> The combined full text is at /llms-full.txt; appending .md to any page URL also returns Markdown.',
        `> Site root: ${await getRequestUrl()}`,
      ];

  const body = [...header, '', index].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
