import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // 生产发布只带 server.js 与它需要的最小依赖，不在目标机器上 npm ci 或 next build。
  output: 'standalone',
  // 构建与生产启动同时跑时各用各的输出目录，互不干扰（npm scripts 用 DOCS_DIST_DIR 指定）。
  distDir: process.env.DOCS_DIST_DIR || '.next',
  // 开发服务器既可能从 localhost 访问，也可能从 127.0.0.1 访问，
  // 不加这一条时按 IP 访问会拦掉按需加载的 chunk（搜索对话框就是这种）。
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    // 记录升级路径：本项目的 Next.js 版本只跟随安全公告升级，不追新。
    agentUpgrade: 'security',
  },
  // 文档页面从 /docs/<分区>/... 搬到站点根路径。旧地址保留永久跳转，外部书签与
  // 外部引用不会落到 404；更早的 hosted、concepts、reference/cli 等别名也指到新地址。
  // 顺序有讲究：具体地址在前，/docs/:path* 兜底在后。
  async redirects() {
    return [
      // 公开入口：/docs/public 就是现在的根地址。
      { source: '/docs/public', destination: '/', permanent: true },
      { source: '/docs/public/:path*', destination: '/:path*', permanent: true },
      // 更早的目录首页地址带 /index；现在目录首页就是目录本身。
      { source: '/docs/:section/:folder/index', destination: '/:section/:folder', permanent: true },
      { source: '/docs/clients/auth', destination: '/auth', permanent: true },
      { source: '/docs/clients/troubleshooting', destination: '/troubleshooting', permanent: true },
      { source: '/docs/clients', destination: '/clients', permanent: true },
      { source: '/docs/clients/:path*', destination: '/clients/:path*', permanent: true },
      { source: '/docs/concepts', destination: '/self-hosted/concepts', permanent: true },
      { source: '/docs/concepts/:path*', destination: '/self-hosted/concepts/:path*', permanent: true },
      { source: '/docs/reference/cli', destination: '/self-hosted/cli', permanent: true },
      { source: '/docs/reference/faq', destination: '/self-hosted/faq', permanent: true },
      { source: '/docs/hosted/clients', destination: '/clients', permanent: true },
      { source: '/docs/hosted/auth', destination: '/auth', permanent: true },
      { source: '/docs/hosted', destination: '/', permanent: true },
      { source: '/docs/start/clients', destination: '/clients', permanent: true },
      // 只写了 /docs 的旧入口在 proxy.ts 里跳到根地址：这条规则交给跳转表时，
      // Next 拼出来的 Location 是空的，只能显式给目标地址。
      { source: '/docs/:path+', destination: '/:path+', permanent: true },
    ];
  },
};

export default withMDX(config);
