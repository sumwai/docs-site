import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { llmsIndex } from '@/lib/llms';
import { docsLlms, source } from '@/lib/source';
import { docsContentRoute, docsRoute } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

async function markdown(pathname: string) {
  const slugs = pathname.slice(docsRoute.length).replace(/^\/|\.md$/g, '');
  const page = source.getPage(slugs ? slugs.split('/') : undefined);
  if (!page) return new NextResponse('Not Found', { status: 404 });

  return new Response(await docsLlms.page(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const result = rewriteSuffix(pathname);
  if (result) {
    return markdown(pathname);
  }

  if (isMarkdownPreferred(request)) {
    // 首页没有 Markdown 正文，直接给文档索引：代理拿到根地址时不必再从 HTML 里找入口。
    if (pathname === '/') {
      return new Response(await llmsIndex(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          Vary: 'Accept',
        },
      });
    }

    const result = rewriteDocs(pathname);

    if (result) {
      return markdown(pathname);
    }
  }

  const response = NextResponse.next();

  // 只读响应头的客户端也能找到 Markdown 原文与索引，不必解析 HTML。
  if (pathname === docsRoute || pathname.startsWith(`${docsRoute}/`)) {
    response.headers.append('Link', `<${pathname}.md>; rel="alternate"; type="text/markdown"`);
  } else if (pathname === '/') {
    response.headers.append('Link', '</llms.txt>; rel="alternate"; type="text/plain"');
  }
  response.headers.append('Link', '</llms.txt>; rel="index"; type="text/plain"');

  return response;
}
