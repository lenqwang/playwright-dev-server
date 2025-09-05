import type { Plugin } from '../types.js';

/**
 * 控制台日志插件
 * 监听页面的控制台输出并打印到终端
 */
export const consoleLoggerPlugin: Plugin = {
  name: 'console-logger',
  
  async onPageLoad(page, platformId, context) {
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
    
    console.log(`🎧 Console monitoring enabled: ${platformId}`);
  }
};