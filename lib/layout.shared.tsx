import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    // 主题切换由文档页的页头渲染（见 app/docs/[[...slug]]/page.tsx），
    // 侧边栏底部不再放。
    slots: {
      themeSwitch: false,
    },
  };
}
