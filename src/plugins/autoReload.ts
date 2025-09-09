import type { Plugin } from '../types.js';
import { logger } from '../core/Logger.js'

/**
 * 自动重载插件
 * 当 HTML 或 CSS 文件变化时自动重载页面
 */
export function autoReloadPlugin(): Plugin {
  return {
    name: 'auto-reload',
    order: 50,
    watchPatterns: ['**/*.html', '**/*.css'],

    async fileChanged(filePath, event) {
      if (event === 'unlink') {
        return;
      }

      const pages = this.getPages();
      
      if (filePath.endsWith('.html')) {
        // HTML 文件变化，重载所有页面
        for (const [platformId, page] of pages) {
          try {
            await page.reload();
            logger.log(`🔄 Page reloaded for platform: ${platformId} due to HTML change: ${filePath}`);
          } catch (error) {
            logger.error(`❌ Failed to reload page for platform ${platformId}:`, error);
          }
        }
      } else if (filePath.endsWith('.css')) {
        // CSS 文件变化，尝试热重载
        for (const [platformId, page] of pages) {
          try {
            await page.evaluate(() => {
              // 重新加载所有 CSS 文件
              const links = document.querySelectorAll('link[rel="stylesheet"]');
              links.forEach((link: any) => {
                const href = link.href;
                link.href = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();
              });
            });
            logger.log(`🎨 CSS hot reload for platform: ${platformId} due to change: ${filePath}`);
          } catch (error) {
            logger.warn(`⚠️  CSS hot reload failed for platform ${platformId}, performing full reload:`, error);
            try {
              await page.reload();
            } catch (reloadError) {
              logger.error(`❌ Failed to reload page for platform ${platformId}:`, reloadError);
            }
          }
        }
      }
    }
  };
}