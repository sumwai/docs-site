// 站点品牌与语言。换一个项目时先改这里。
export const site = {
  // 浏览器标题、导航标题、OG 图与 llms.txt / robots.txt 的头部都用它。
  name: 'Docs',
  // 首页第一行的小字，留空则不显示。
  tagline: '基于 Fumadocs 的文档站',
  // 首页正文与 meta description。
  description: 'Markdown 内容，带侧边栏、站内搜索、Markdown 原文与 llms.txt。',
  // 文档正文的语言由内容决定；这里控制 <html lang> 与内置 UI 文案。
  // 以 zh 开头时启用 app/layout.tsx 里的中文覆盖，其它语言用 Fumadocs 默认英文。
  locale: 'zh-CN',
};
