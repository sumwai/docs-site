import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { categoryOptions, fixedLinks } from '@/lib/docs-nav';
import { CategorySwitcher } from '@/components/category-switcher';
import { SidebarFooter } from '@/components/sidebar-footer';

export default function Layout({ children }: LayoutProps<'/[[...slug]]'>) {
  const tree = source.getPageTree();
  const base = baseOptions();

  return (
    <DocsLayout
      tree={tree}
      // 切换器只列分类；固定入口（root 为 aux 的目录）以链接形式放在页面树上方。
      tabs={false}
      {...base}
      links={[...(base.links ?? []), ...fixedLinks(tree)]}
      sidebar={{
        banner: <CategorySwitcher options={categoryOptions(tree)} />,
        // 底部固定：左边切主题，右边是仓库地址。
        footer: <SidebarFooter />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
