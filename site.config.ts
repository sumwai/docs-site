// 站点品牌与语言。默认值面向模板本身；分仓部署时用环境变量覆盖，
// 这样内容仓库只放 Markdown，不必为一套文案复制一份站点代码。
// 构建时决定页面文案，运行时 robots.txt 与 llms.txt 还会再读一次，
// 因此构建与运行两边要给同一组值。空值或未设置都退回默认值。

const env = process.env;

function pick(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export const site = {
  // 浏览器标题、导航标题、OG 图与 llms.txt / robots.txt 的头部都用它。
  name: pick(env.DOCS_SITE_NAME, 'Docs'),
  // 首页第一行的小字。
  tagline: pick(env.DOCS_SITE_TAGLINE, '基于 Fumadocs 的文档站'),
  // 首页正文与 meta description。
  description: pick(env.DOCS_SITE_DESCRIPTION, 'Markdown 内容，带侧边栏、站内搜索、Markdown 原文与 llms.txt。'),
  // 文档正文的语言由内容决定；这里控制 <html lang> 与内置 UI 文案。
  // 以 zh 开头时启用 app/layout.tsx 里的中文覆盖，其它语言用 Fumadocs 默认英文。
  locale: pick(env.DOCS_SITE_LOCALE, 'zh-CN'),
};
