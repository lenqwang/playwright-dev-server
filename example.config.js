import { defineConfig, consoleLoggerPlugin, autoReloadPlugin } from './dist/index.js';

export default defineConfig({
  platforms: {
    // 示例平台 1: 本地开发页面
    local: {
      name: 'Local Development',
      url: 'https://www.baidu.com',
      scripts: [
        {
          path: './scripts/common.js',
          order: 1,
          autoInject: true,
        },
        {
          path: './scripts/dev-tools.js',
          order: 2,
          autoInject: true,
        },
        {
          path: './config/reload.js',
          order: 3,
          autoInject: true,
        }
      ],
      browserOptions: {
        viewport: { width: 1280, height: 720 }
      }
    }
  },
  
  // 文件监听规则
  watchRules: [
    {
      pattern: 'scripts/**/*.js',
      action: 'replace'  // 脚本文件变化时替换
    },
    {
      pattern: 'config/**/*.js',
      action: 'reload'   // 配置文件变化时重载页面
    },
    {
      pattern: 'assets/**/*.css',
      action: 'custom',
      async handler(filePath, page, context) {
        // 自定义 CSS 热重载逻辑
        console.log(`🎨 CSS file changed: ${filePath}`);
        await page.evaluate(() => {
          // 刷新所有样式表
          document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.href;
            link.href = href.includes('?') ? href.replace(/\?.*/, '') : href;
            link.href += '?t=' + Date.now();
          });
        });
      }
    }
  ],
  
  // 插件配置
  plugins: [
    consoleLoggerPlugin,
    autoReloadPlugin,
    
    // 自定义插件示例
    {
      name: 'custom-logger',
      async setup(context) {
        console.log('🔧 Custom plugin loaded');
      },
      async onPageLoad(page, platformId, context) {
        // 在页面加载时注入一些全局变量
        await page.evaluate((platform) => {
          window.__DEV_PLATFORM__ = platform;
          window.__DEV_TIMESTAMP__ = Date.now();
        }, platformId);
      },
      async beforeScriptInject(script, page, context) {
        // 在脚本注入前添加一些注释
        return `// Auto-injected at ${new Date().toISOString()}\n${script}`;
      }
    }
  ],
  
  // 全局浏览器选项
  browserOptions: {
    headless: false,
    devtools: true,
    slowMo: 100, // 减慢操作速度，便于调试
  }
});