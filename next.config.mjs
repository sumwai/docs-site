import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // 构建与生产启动同时跑时各用各的输出目录，互不干扰（npm scripts 用 DOCS_DIST_DIR 指定）。
  distDir: process.env.DOCS_DIST_DIR || '.next',
  // 开发服务器既可能从 localhost 访问，也可能从 127.0.0.1 访问，
  // 不加这一条时按 IP 访问会拦掉按需加载的 chunk（搜索对话框就是这种）。
  allowedDevOrigins: ['127.0.0.1'],
};

export default withMDX(config);
