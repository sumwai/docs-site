# docs-site

可复用的文档站模板：Next.js + Fumadocs。框架负责渲染、搜索、Markdown 原文与 Agent 入口，内容是可替换的 Markdown。

```bash
npm install
npm run dev        # http://127.0.0.1:3000
npm run build      # 产物写入 .next-build
npm run start      # 以生产模式启动
```

开发服务器用 `.next`，构建与生产启动用 `.next-build`，两者可以同时运行。`next.config.mjs` 通过 `DOCS_DIST_DIR` 选择输出目录，`build` 与 `start` 已经固定为 `.next-build`。

## 站点品牌

品牌、首页文案与语言由环境变量传入，默认值在根目录 `site.config.ts`；空值或未设置都退回默认值。

| 变量 | 作用 |
| --- | --- |
| `DOCS_SITE_NAME` | 浏览器标题、导航标题、OG 图、`llms.txt` 与 `robots.txt` 头部 |
| `DOCS_SITE_TAGLINE` | 首页标题上方的小字 |
| `DOCS_SITE_DESCRIPTION` | 首页正文与 meta description |
| `DOCS_SITE_LOCALE` | `<html lang>` 与内置 UI 文案；以 `zh` 开头时启用中文覆盖，其余用 Fumadocs 默认英文 |

首页、导航、站点地图与 Agent 入口都读这些值，不在页面里写死站点名。`DOCS_SITE_NAME`、`DOCS_SITE_TAGLINE`、`DOCS_SITE_DESCRIPTION` 在构建时决定静态页面的文案，`robots.txt` 与 `llms.txt` 按请求生成，运行阶段还会再读一次，所以构建与运行要给同一组值。

内容仓库只需要提供这四个值，不必复制 `site.config.ts`。

## 内容

构建用的内容在 `content/docs/`，它不入库，由同步脚本生成。仓库自带的示例内容在 `content.example/docs/`，结构就是内容仓库该有的样子：`meta.json` 加两个页面。

页面是普通 Markdown / MDX，frontmatter 至少写 `title`，可选 `description`；侧边栏顺序与分隔线写在各级 `meta.json`。

正文可用标准 Markdown、GFM 表格，以及 Fumadocs 内置的 `<Cards>` / `<Card>` 与代码块高亮标记（`// [!code ++]`、`// [!code --]`）。内容不能 `import` 站点源码里的模块。

### 内容单独成仓

构建前运行 `scripts/fetch-content.mjs`，把内容同步进 `content/docs`：

| 变量 | 作用 |
| --- | --- |
| `DOCS_CONTENT_DIR` | 本地已 checkout 的内容目录，优先级最高 |
| `DOCS_CONTENT_REPO` | `owner/repo`，从 GitHub 拉 tarball |
| `DOCS_CONTENT_REF` | 拉哪个 ref，默认 `main`；发布时写 tag |
| `DOCS_CONTENT_SUBDIR` | 内容在仓库里的目录，默认 `content/docs` |
| `GITHUB_TOKEN` | 私有仓库或限流时需要；只进请求头，不打印 |
| `DOCS_CONTENT_DEST` | 同步到哪，默认 `content/docs`；用于测试或特殊构建 |

两个来源都没设置时，脚本沿用现有的 `content/docs`；它不存在时把 `content.example/docs` 复制进去，因此新 clone 直接 `npm run dev` 也能起。开发服务器不会在改动内容仓库后自动重同步，改完内容仓库要再跑一次 `npm run content`。

```bash
npm run content    # 按环境变量同步
npm run build      # 普通构建
```

内容仓库只需要 `content/docs`（`meta.json` + 至少一个 `.mdx`），不携带 `app/`、依赖或样式。示例内容在同步时会被整体替换。

静态资源目前只同步 `content/docs`：图片用外链，或扩展脚本把图片目录一起同步（站点没有 `public/` 目录）。

## 部署

站点用 Next.js 的 Node 服务器运行，不做静态导出：`/api/search` 需要服务端搜索索引，`proxy.ts` 负责 `.md` 与 `Accept: text/markdown` 的重写。

### Docker

构建阶段拉内容并完成 SSG，运行阶段只带 `.next-build` 与生产依赖。内容更新需要重新构建镜像。品牌走构建参数，构建时写进静态页面的标题与首页文案：

```bash
docker build -t docs-site .

docker build \
  --build-arg DOCS_SITE_NAME=<站点名> \
  --build-arg DOCS_SITE_TAGLINE=<首页小字> \
  --build-arg DOCS_SITE_DESCRIPTION=<首页正文> \
  --build-arg DOCS_SITE_LOCALE=zh-CN \
  -t docs-site .
```

私有内容仓库用 BuildKit secret，token 不进入镜像层：

```bash
printf '%s' "$GITHUB_TOKEN" > /tmp/gh-token
docker build \
  --build-arg DOCS_CONTENT_REPO=<owner>/<repo> \
  --build-arg DOCS_CONTENT_REF=<ref> \
  --secret id=github_token,src=/tmp/gh-token \
  -t docs-site .
rm -f /tmp/gh-token
```

构建环境的 npm registry 不是官方源时，加 `--build-arg NPM_REGISTRY=<镜像源>`。

运行：

```bash
docker run -d --name docs-site --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://docs.example.com \
  -e DOCS_SITE_NAME=<站点名> \
  docs-site
```

`DOCS_SITE_NAME` 等在运行阶段影响 `robots.txt` 与 `llms.txt` 的头部，要与构建参数一致。

只把端口绑在回环地址，由反向代理终止 TLS：

```caddyfile
docs.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

镜像自带 `HEALTHCHECK`，探测 `/docs`。反向代理可额外缓存 `/_next/static/*`。

### systemd

```bash
cd /path/to/docs-site
npm ci
npm run content
npm run build
```

```ini
[Unit]
Description=docs-site
After=network.target

[Service]
WorkingDirectory=/path/to/docs-site
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_SITE_URL=https://docs.example.com
Environment=DOCS_SITE_NAME=<站点名>
ExecStart=/usr/bin/node node_modules/.bin/next start -H 127.0.0.1 -p 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 内容更新

页面在构建时预渲染，内容仓库推新提交后必须重新构建。两种触发方式：

- 内容仓库 push 后向站点仓库发 `repository_dispatch`，站点仓库构建并替换镜像；
- 站点仓库定时或手动构建，`DOCS_CONTENT_REF` 指向 `main` 或某个 tag。

固定版本时把 `DOCS_CONTENT_REF` 写成 tag；正式站点不要长期跟随 `main`。

## Agent 入口

| 地址 | 内容 |
| --- | --- |
| `/llms.txt` | 文档索引，链接指向每页 Markdown 原文 |
| `/llms-full.txt` | 全部页面合并 |
| `<页面>.md` | 单页 Markdown 原文 |
| `Accept: text/markdown` | 同一地址返回 Markdown |
| `/sitemap.xml`、`/robots.txt` | 爬虫入口 |

响应头带 `Link: <...>; rel="alternate"; type="text/markdown"`，只读响应头的客户端也能找到原文。

## 结构

| 路径 | 作用 |
| --- | --- |
| `site.config.ts` | 品牌与语言的默认值，可被 `DOCS_SITE_*` 环境变量覆盖 |
| `content.example/docs/` | 示例内容，结构等同于一个内容仓库 |
| `content/docs/` | 构建用的内容，由同步脚本生成，不入库 |
| `app/(home)/page.tsx` | 首页 |
| `app/docs/[[...slug]]/page.tsx` | 文档页渲染 |
| `app/docs/layout.tsx` | 侧边栏与页面布局 |
| `app/api/search/route.ts` | 站内搜索 |
| `app/llms.txt`、`app/llms-full.txt` | Agent 索引与全文 |
| `app/llms.mdx/docs/[[...slug]]` | 每页 Markdown 原文 |
| `app/robots.txt`、`app/sitemap.ts` | 爬取说明与页面清单 |
| `app/og/docs/[...slug]` | OG 图 |
| `proxy.ts` | Markdown 缩写与 `Accept` 协商 |
| `lib/source.ts` | 内容源与 Fumadocs 加载器 |
| `lib/shared.ts` | 站点名、路由前缀、绝对地址 |
| `scripts/fetch-content.mjs` | 构建前同步内容 |
| `Dockerfile` | 构建与运行镜像 |

## 换一个项目

1. 用 `DOCS_SITE_NAME`、`DOCS_SITE_TAGLINE`、`DOCS_SITE_DESCRIPTION`、`DOCS_SITE_LOCALE` 给品牌与语言，或在 `site.config.ts` 改默认值。
2. 建一个只放内容的仓库：`content/docs` 下放 `meta.json` 与页面，不带 `app/`、依赖与样式。构建时用 `DOCS_CONTENT_DIR` 指本地 checkout，或 `DOCS_CONTENT_REPO` 指向远端仓库。
3. 需要改 UI 文案时改 `app/layout.tsx` 的 `zhTranslations`；其它语言用 Fumadocs 默认文案。
4. 字体栈与正文排版在 `app/global.css`。

参考实现：lax 的文档内容是独立的纯 MDX 仓库，用 `Makefile` 把 `DOCS_CONTENT_DIR` 与本仓库的同步、开发、构建命令串起来，品牌值同样写在那个 `Makefile` 里。

界面文案默认中文，内容语言不受限制。
