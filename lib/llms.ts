import { site } from '@/site.config';
import { docsLlms } from './source';
import { getRequestUrl } from './shared';

// 索引里的链接直接指向每页的 Markdown 原文：Agent 读到 llms.txt 之后不需要再猜
// 页面地址后面加什么后缀，也不必请求 HTML 再解析。
function toMarkdownLinks(index: string) {
  return index.replace(/\]\((\/docs[^)\s]*)\)/g, (_match, path: string) => {
    if (path.endsWith('.md')) return `](${path})`;
    return `](${path}.md)`;
  });
}

// docsLlms.index() 会同时输出加粗的文件夹标题与同名 index 页面。保留加粗标题
// 作为分组，删掉重复的 index 页面行（它和标题同名，但多一个链接与描述）。
function dropDuplicateFolders(index: string) {
  const lines = index.split('\n');
  return lines
    .filter((line, i) => {
      // 子目录会同时输出「- **配置**」与「- 配置」：保留前者作为分组标题，
      // 去掉没有链接的同名条目，否则 llms.txt 里同一层出现两次。
      if (/^  - [^\[].+$/.test(line)) {
        const heading = lines
          .slice(0, i)
          .reverse()
          .find((candidate) => /^  - \*\*.+\*\*$/.test(candidate));
        if (heading && heading.replace(/^  - \*\*(.+)\*\*$/, '$1') === line.slice(4)) return false;
      }
      if (!/^- [^\[].+$/.test(line)) return true;
      const heading = lines
        .slice(0, i)
        .reverse()
        .find((candidate) => /^- \*\*.+\*\*$/.test(candidate));
      return !heading || heading !== `- **${line.slice(2)}**`;
    })
    .join('\n')
    .replace(/\n[ \t]+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n');
}

export async function llmsIndex() {
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

  return [...header, '', index].join('\n');
}
