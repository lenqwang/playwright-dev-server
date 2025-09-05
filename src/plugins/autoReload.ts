import type { Plugin } from '../types.js';

/**
 * 自动重载插件
 * 当 HTML 或 CSS 文件变化时自动重载页面
 */
export const autoReloadPlugin: Plugin = {
  name: 'auto-reload',
  
  watchRules: [
    {
      pattern: '**/*.html',
      action: 'reload'
    },
    {
      pattern: '**/*.css',
      action: 'custom',
      async handler(filePath, page, context) {
        // 对于 CSS 文件，尝试热重载而不是完全刷新页面
        try {
          await page.evaluate(() => {
            // 重新加载所有 CSS 文件
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            links.forEach((link: any) => {
              const href = link.href;
              link.href = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();
            });
          });
          console.log(`🎨 CSS 热重载: ${filePath}`);
        } catch (error) {
          console.warn(`⚠️  CSS 热重载失败，执行完整重载: ${filePath}`);
          await page.reload();
        }
      }
    }
  ]
};