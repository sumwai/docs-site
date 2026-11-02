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
  // 旧侧边栏与外部书签仍可能指向 hosted 路径；保留永久跳转，避免落到 404。
  async redirects() {
    return [
      { source: '/docs/hosted', destination: '/docs/clients', permanent: true },
      { source: '/docs/hosted/clients', destination: '/docs/clients', permanent: true },
      { source: '/docs/hosted/auth', destination: '/docs/clients/auth', permanent: true },
      { source: '/docs/start/clients', destination: '/docs/clients', permanent: true },
    ];
  },
};

export default withMDX(config);
