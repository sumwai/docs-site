import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const result = rewriteSuffix(pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    // 首页没有 Markdown 正文，直接给文档索引：代理拿到根地址时不必再从 HTML 里找入口。
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/llms.txt', request.nextUrl), {
        headers: { Vary: 'Accept' },
      });
    }

    const result = rewriteDocs(pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: 'Accept' },
      });
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
