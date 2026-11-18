import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    // 主题切换放在侧边栏底部（见 components/sidebar-footer.tsx），
    // 导航栏与页头都不再放，免得同一页出现两个开关。
    slots: {
      themeSwitch: false,
    },
  };
}
