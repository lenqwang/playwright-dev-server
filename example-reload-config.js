import { defineConfig, consoleLoggerPlugin, scriptInjectionPlugin, styleInjectionPlugin } from './src/index.js';

export default defineConfig({
  platforms: {
    example: {
      name: 'Reload Strategy Example',
      url: 'https://example.com',
      scripts: [
        {
          path: './scripts/config.js',
          order: 1,
          autoInject: true,
          reloadOnChange: true,  // 🔄 这个脚本修改后会刷新页面
        },
        {
          path: './scripts/init.js',
          order: 2,
          autoInject: true,
          reloadOnChange: true,  // 🔄 初始化脚本也需要刷新页面
        },
        {
          path: './scripts/utils.js',
          order: 3,
          autoInject: true,
          // reloadOnChange 默认为 false，所以会热替换
        },
        {
          path: './scripts/ui-components.js',
          order: 4,
          autoInject: true,
          reloadOnChange: false, // 🔥 明确指定热替换
        }
      ],
      styles: [
        {
          path: './styles/reset.css',
          order: 1,
          autoInject: true,
          reloadOnChange: true,  // 🔄 重置样式修改后刷新页面
        },
        {
          path: './styles/theme.css',
          order: 2,
          autoInject: true,
          reloadOnChange: true,  // 🔄 主题样式修改后刷新页面
        },
        {
          path: './styles/components.css',
          order: 3,
          autoInject: true,
          // 默认热替换，适合组件样式调试
        }
      ]
    }
  },
  
  plugins: [
    consoleLoggerPlugin(),
    scriptInjectionPlugin(),
    styleInjectionPlugin(),
  ],
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});