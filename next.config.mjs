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
  // 分类按读者重排后，旧地址与更早的 hosted 地址都保留永久跳转，避免外部书签落到 404。
  async redirects() {
    return [
      // 更早的目录首页地址带 /index；现在目录首页就是目录本身。
      { source: '/docs/:section/:folder/index', destination: '/docs/:section/:folder', permanent: true },
      { source: '/docs/clients/auth', destination: '/docs/public/auth', permanent: true },
      { source: '/docs/clients/troubleshooting', destination: '/docs/public/troubleshooting', permanent: true },
      { source: '/docs/clients', destination: '/docs/public/clients', permanent: true },
      { source: '/docs/clients/:path*', destination: '/docs/public/clients/:path*', permanent: true },
      { source: '/docs/concepts', destination: '/docs/self-hosted/concepts', permanent: true },
      { source: '/docs/concepts/:path*', destination: '/docs/self-hosted/concepts/:path*', permanent: true },
      { source: '/docs/reference/cli', destination: '/docs/self-hosted/cli', permanent: true },
      { source: '/docs/reference/faq', destination: '/docs/self-hosted/faq', permanent: true },
      { source: '/docs/hosted', destination: '/docs/public', permanent: true },
      { source: '/docs/hosted/clients', destination: '/docs/public/clients', permanent: true },
      { source: '/docs/hosted/auth', destination: '/docs/public/auth', permanent: true },
      { source: '/docs/start/clients', destination: '/docs/public/clients', permanent: true },
    ];
  },
};

export default withMDX(config);
