import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred } from 'fumadocs-core/negotiation';
import { llmsIndex } from '@/lib/llms';
import { docsLlms, source } from '@/lib/source';

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

// 文档页挂在根路径上，没有统一前缀可判断，只好反过来排除站点自己的路由：
// 剩下的路径只要能在内容里查到页面，就按文档页处理。
const reservedPrefixes = [
  '/api/',
  '/og/',
  '/llms.mdx/',
  '/_next/',
  '/llms.txt',
  '/llms-full.txt',
  '/robots.txt',
  '/sitemap.xml',
];

function isReserved(pathname: string) {
  return reservedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

// 页面地址是 /quickstart，它的 Markdown 原文是 /quickstart.md。
// 根页面没有路径可加后缀，原文地址定为 /index.md，这里把两者都还原成根页面。
function getDocsPage(pathname: string): DocsPage | undefined {
  if (isReserved(pathname)) return undefined;

  const isMarkdown = pathname.endsWith('.md');
  const slugs = (isMarkdown ? pathname.slice(0, -'.md'.length) : pathname)
    .split('/')
    .filter(Boolean);

  // 带扩展名的是图片、字体这类静态文件，不是页面。
  if (!isMarkdown && slugs.length > 0 && slugs[slugs.length - 1].includes('.')) {
    return undefined;
  }
  if (slugs.length === 1 && slugs[0] === 'index') return source.getPage(undefined);

  return source.getPage(slugs.length > 0 ? slugs : undefined);
}

async function markdown(page: DocsPage) {
  return new Response(await docsLlms.page(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只写了 /docs 的旧入口指向根地址。这条规则放在 next.config.mjs 里时
  // Next 会拼出空的 Location，浏览器落到空白页，所以在这里显式给出完整地址。
  if (pathname === '/docs') {
    return NextResponse.redirect(new URL('/', request.url), 308);
  }

  if (isReserved(pathname)) return NextResponse.next();

  const page = getDocsPage(pathname);

  // 页面地址后加 .md 直接给 Markdown 原文；根页面的原文地址是 /index.md。
  if (pathname.endsWith('.md')) {
    return page ? markdown(page) : new NextResponse('Not Found', { status: 404 });
  }

  if (page && isMarkdownPreferred(request)) {
    // 根地址是公开入口页，但代理更需要索引：拿到站点根时不必再从 HTML 里找入口。
    if (pathname === '/') {
      return new Response(await llmsIndex(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          Vary: 'Accept',
        },
      });
    }
    return markdown(page);
  }

  const response = NextResponse.next();

  // 只读响应头的客户端也能找到 Markdown 原文与索引，不必解析 HTML。
  if (page) {
    const sourceUrl = pathname === '/' ? '/index.md' : `${pathname}.md`;
    response.headers.append('Link', `<${sourceUrl}>; rel="alternate"; type="text/markdown"`);
  }
  if (pathname === '/') {
    response.headers.append('Link', '</llms.txt>; rel="alternate"; type="text/plain"');
  }
  response.headers.append('Link', '</llms.txt>; rel="index"; type="text/plain"');

  return response;
}
