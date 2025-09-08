import type { Plugin } from '../types.js';

/**
 * 控制台日志插件
 * 监听页面的控制台输出并打印到终端
 */
export function consoleLoggerPlugin(): Plugin {
  return {
    name: 'console-logger',
    order: 1, // 最早执行，确保能监听到所有日志

    async platformCreated(platformId, page) {
      page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        const prefix = `[${platformId}]`;
        
        switch (type) {
          case 'error':
            console.error(`🔴 ${prefix} ${text}`);
            break;
          case 'warning':
            console.warn(`🟡 ${prefix} ${text}`);
            break;
          case 'info':
            console.info(`🔵 ${prefix} ${text}`);
            break;
          default:
            console.log(`⚪ ${prefix} ${text}`);
        }
      });
      
      // 监听页面错误
      page.on('pageerror', (error) => {
        console.error(`🔴 [${platformId}] Page Error:`, error.message);
      });

      // 监听请求失败
      page.on('requestfailed', (request) => {
        console.error(`🔴 [${platformId}] Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
      });
      
      console.log(`🎧 Console monitoring enabled: ${platformId}`);
    }
  };
}