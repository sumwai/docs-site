<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 站点事实

- 这是可复用的文档站框架，不绑定具体项目：品牌与语言来自 `DOCS_SITE_*` 环境变量，默认值在 `site.config.ts`。
- `content/docs/` 是构建产物，不入库，由 `scripts/fetch-content.mjs` 生成；示例内容在 `content.example/docs/`，结构等同于一个内容仓库。
- 内容仓库只放 `meta.json` 与 `.mdx`，不携带 `app/`、依赖与样式；框架改动不要要求内容仓库同步改代码。
- 改完跑 `npm run build`：它同时做类型检查与生产构建，输出到 `.next-build`。
- 站点面向使用者：内容里不写设计取舍、踩坑记录与提交过程。

