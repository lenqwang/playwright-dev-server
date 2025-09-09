import type { Plugin } from '../types.js';
import { logger } from '../core/Logger.js';

/**
 * 示例插件：页面标题监控
 * 监控页面标题变化并记录日志
 */
export function pageTitleMonitorPlugin(): Plugin {
  return {
    name: 'page-title-monitor',
    order: 20,

    async platformReady(platformId, page) {
      // 监听页面标题变化
      await page.evaluate((platformId) => {
        const observer = new MutationObserver(() => {
          console.log(`[${platformId}] Page title changed to: ${document.title}`);
        });
        
        observer.observe(document.querySelector('title') || document.head, {
          childList: true,
          subtree: true
        });
      }, platformId);

      logger.log(`📋 Title monitoring enabled for platform: ${platformId}`);
    }
  };
}

/**
 * 示例插件：性能监控
 * 监控页面性能指标
 */
export function performanceMonitorPlugin(): Plugin {
  return {
    name: 'performance-monitor',
    order: 30,

    async platformReady(platformId, page) {
      // 注入性能监控脚本
      await page.addScriptTag({
        content: `
          // 监控页面加载性能
          window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('[${platformId}] Page Load Performance:', {
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
              totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
          });

          // 监控资源加载
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 1000) { // 超过1秒的资源
                console.warn('[${platformId}] Slow resource:', entry.name, entry.duration + 'ms');
              }
            }
          });
          observer.observe({ entryTypes: ['resource'] });
        `
      });

      logger.log(`⚡ Performance monitoring enabled for platform: ${platformId}`);
    }
  };
}

/**
 * 示例插件：自动截图
 * 在特定事件发生时自动截图
 */
export function autoScreenshotPlugin(options: {
  onError?: boolean;
  onNavigate?: boolean;
  outputDir?: string;
} = {}): Plugin {
  const { onError = true, onNavigate = false, outputDir = './screenshots' } = options;

  return {
    name: 'auto-screenshot',
    order: 40,

    async platformCreated(platformId, page) {
      if (onError) {
        // 监听页面错误并截图
        page.on('pageerror', async (error) => {
          try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${outputDir}/${platformId}-error-${timestamp}.png`;
            await page.screenshot({ path: filename, fullPage: true });
            logger.log(`📸 Error screenshot saved: ${filename}`);
          } catch (screenshotError) {
            logger.error('Failed to take error screenshot:', screenshotError);
          }
        });
      }
    },

    async platformNavigate(platformId, page, url) {
      if (onNavigate) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${outputDir}/${platformId}-navigate-${timestamp}.png`;
          await page.screenshot({ path: filename, fullPage: true });
          logger.log(`📸 Navigation screenshot saved: ${filename} (${url})`);
        } catch (error) {
          logger.error('Failed to take navigation screenshot:', error);
        }
      }
    }
  };
}

/**
 * 示例插件：脚本转换器
 * 在脚本注入前进行转换（例如添加调试信息）
 */
export function scriptTransformPlugin(): Plugin {
  return {
    name: 'script-transform',
    order: 5, // 早期执行，在脚本注入之前

    async transformScript(code, scriptPath, platformId) {
      // 在脚本开头添加调试信息
      const debugInfo = `
        console.log('[${platformId}] Loading script: ${scriptPath}');
        console.time('[${platformId}] Script execution: ${scriptPath}');
      `;
      
      // 在脚本结尾添加调试信息
      const debugEnd = `
        console.timeEnd('[${platformId}] Script execution: ${scriptPath}');
        console.log('[${platformId}] Script loaded: ${scriptPath}');
      `;

      return debugInfo + code + debugEnd;
    }
  };
}

/**
 * 示例插件：环境变量注入
 * 将环境变量注入到页面中
 */
export function envInjectionPlugin(envVars: Record<string, string> = {}): Plugin {
  return {
    name: 'env-injection',
    order: 1, // 最早执行

    async platformReady(platformId, page) {
      // 注入环境变量到 window 对象
      await page.addScriptTag({
        content: `
          window.__ENV__ = ${JSON.stringify({
            NODE_ENV: process.env.NODE_ENV || 'development',
            PLATFORM_ID: platformId,
            ...envVars
          })};
          console.log('[${platformId}] Environment variables injected:', window.__ENV__);
        `
      });

      console.log(`🌍 Environment variables injected for platform: ${platformId}`);
    }
  };
}