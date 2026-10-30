import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { site } from '@/site.config';
import { siteUrl } from '@/lib/shared';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

// Fumadocs 的内置文案按「原文(位置)」做键，这里只覆盖界面上会看到的那些。
const zhTranslations = {
  'Search(search trigger)': '搜索',
  'Open Search(search trigger)(aria-label)': '打开搜索',
  'Search(search dialog)': '搜索文档',
  'Search failed(search dialog)': '搜索失败',
  'No results found(search dialog)': '没有找到相关内容',
  'On this page(table of contents)': '本页目录',
  'Table of Contents(inline table of contents)': '目录',
  'No Headings(table of contents)': '本页没有小标题',
  'Previous Page(pagination)': '上一页',
  'Next Page(pagination)': '下一页',
  'Theme(site menu)': '主题',
  'Toggle Theme(theme switcher)(aria-label)': '切换主题',
  'Light(theme switcher)(aria-label)': '浅色',
  'Dark(theme switcher)(aria-label)': '深色',
  'System(theme switcher)(aria-label)': '跟随系统',
  'Copy Text(code block)(aria-label)': '复制',
  'Copied Text(code block)(aria-label)': '已复制',
  'Copy Markdown(page actions)': '复制 Markdown',
  'Copied Markdown(page actions)': '已复制 Markdown',
  'View as Markdown(page actions)': '查看 Markdown',
  'Page Not Found(404 not found page)': '页面不存在',
  'Back to Home(404 not found page)': '返回首页',
  'Open Sidebar(aria-label)': '打开侧边栏',
  'Close Sidebar(aria-label)': '关闭侧边栏',
  'Toggle Menu(home layout header)(aria-label)': '切换菜单',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  const i18n = site.locale.startsWith('zh')
    ? { locale: site.locale, translations: zhTranslations }
    : { locale: site.locale };

  return (
    <html lang={site.locale} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={i18n}>{children}</RootProvider>
      </body>
    </html>
  );
}
