'use client';

import { useMemo, useState } from 'react';
import Link from 'fumadocs-core/link';
import { useTreePath } from 'fumadocs-ui/contexts/tree';
import { useSidebar } from 'fumadocs-ui/components/sidebar/base';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { CategoryOption } from '@/lib/docs-nav';

/**
 * 侧边栏顶部的分类切换器。
 *
 * 只列分类；参考、版本这类固定入口由布局以链接形式放在页面树上方。
 * 当前页面不属于任何分类时显示占位文字，读者仍能从这里回到任意分类。
 */
export function CategorySwitcher({
  options,
  placeholder = '选择分类',
}: {
  options: CategoryOption[];
  placeholder?: string;
}) {
  const path = useTreePath();
  const [open, setOpen] = useState(false);
  const { closeOnRedirect } = useSidebar();

  const selected = useMemo(
    () =>
      options.findLast((option) =>
        path.some((node) => node.type === 'folder' && node.$id === option.folderId),
      ),
    [options, path],
  );

  const onClick = () => {
    // 移动端抽屉里点链接后要让侧边栏关闭。
    closeOnRedirect.current = true;
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 rounded-lg p-2 border bg-fd-secondary/50 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent data-[popup-open]:bg-fd-accent data-[popup-open]:text-fd-accent-foreground">
        {selected ? (
          <>
            <div className="size-9 shrink-0 empty:hidden md:size-5">{selected.icon}</div>
            <div>
              <p className="text-sm font-medium">{selected.title}</p>
              <p className="text-sm text-fd-muted-foreground empty:hidden md:hidden">
                {selected.description}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-fd-muted-foreground">{placeholder}</p>
        )}
        <ChevronsUpDown className="shrink-0 ms-auto size-4 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-1 w-(--anchor-width) p-1 fd-scroll-container">
        {options.map((option) => {
          const isActive = selected?.url === option.url;

          return (
            <Link
              key={option.url}
              href={option.url}
              onClick={onClick}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <div className="shrink-0 size-9 md:mb-auto md:size-5 empty:hidden">
                {option.icon}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{option.title}</p>
                <p className="text-[0.8125rem] text-fd-muted-foreground mt-1 empty:hidden">
                  {option.description}
                </p>
              </div>
              <Check
                className={`shrink-0 ms-auto size-3.5 text-fd-primary ${isActive ? '' : 'invisible'}`}
              />
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
