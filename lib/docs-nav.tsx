import type { ReactNode } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';

/**
 * 分区 meta.json 里把 root 写成这个字符串时，该目录只是侧边栏顶部的固定入口，
 * 不参与分类切换器。分类用 `"root": true`。
 */
export const FIXED_ROOT = 'aux';

export interface CategoryOption {
  url: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** 对应分区的目录 id，用来判断当前页面属于哪个分类。 */
  folderId?: string;
}

function firstUrl(nodes: PageTree.Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') return node.url;
    if (node.type === 'folder') {
      const url = node.index?.url ?? firstUrl(node.children);
      if (url) return url;
    }
  }
  return undefined;
}

/** 分区的入口地址：优先分区首页，其次第一个页面。 */
export function folderUrl(folder: PageTree.Folder): string | undefined {
  return folder.index?.url ?? firstUrl(folder.children);
}

/** 顶层带 root 标记的目录，分成可切换的分类与固定入口两类。 */
export function rootFolders(tree: PageTree.Root) {
  const categories: PageTree.Folder[] = [];
  const fixed: PageTree.Folder[] = [];

  for (const node of tree.children) {
    if (node.type !== 'folder' || !node.root) continue;
    if (node.root === FIXED_ROOT) fixed.push(node);
    else categories.push(node);
  }

  return { categories, fixed };
}

// 与 Fumadocs 自带的图标包装一致：图标默认 24px，需要铺满切换器里的小方块。
function tabIcon(folder: PageTree.Folder): ReactNode {
  if (!folder.icon) return undefined;

  return (
    <div className="size-full [&_svg]:size-full max-md:p-1.5 max-md:rounded-md max-md:border max-md:bg-fd-secondary">
      {folder.icon}
    </div>
  );
}

/** 分类切换器的选项。分区既没有首页也没有页面时跳过。 */
export function categoryOptions(tree: PageTree.Root): CategoryOption[] {
  return rootFolders(tree).categories.flatMap((folder) => {
    const url = folderUrl(folder);
    if (!url) return [];

    return [
      {
        url,
        title: folder.name,
        description: folder.description,
        icon: tabIcon(folder),
        folderId: folder.$id,
      },
    ];
  });
}

/** 固定入口：始终显示在页面树上方，不进分类切换器。 */
export function fixedLinks(tree: PageTree.Root): LinkItemType[] {
  return rootFolders(tree).fixed.flatMap((folder) => {
    const url = folderUrl(folder);
    if (!url) return [];

    return [
      {
        type: 'main' as const,
        url,
        text: folder.name,
        description: folder.description,
        icon: folder.icon,
        on: 'menu' as const,
        active: 'nested-url' as const,
      },
    ];
  });
}

/** 第一个分类的地址，用作文档入口的落点。没有分类时返回 undefined。 */
export function firstCategoryUrl(tree: PageTree.Root): string | undefined {
  const [first] = rootFolders(tree).categories;
  return first ? folderUrl(first) : undefined;
}
