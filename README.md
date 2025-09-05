# Playwright Dev Server

一个基于 Playwright 的开发服务器，用于向网页注入脚本并提供热重载功能。

## 特性

- 🚀 基于 Playwright 的无头浏览器自动化
- 📝 脚本自动注入和热重载
- 🔌 插件系统，支持自定义行为
- 👀 文件监听，支持多种重载策略
- 🎯 多平台支持，可同时操作多个页面
- ⚙️ 类似 Vite 的配置系统

## 安装

```bash
npm install playwright-dev-server
# 或
pnpm add playwright-dev-server
```

## 快速开始

### 1. 初始化配置

```bash
npx playwright-dev init
```

### 2. 编辑配置文件

```javascript
// playwright-dev.config.js
import { defineConfig } from 'playwright-dev-server';

export default defineConfig({
  platforms: {
    mysite: {
      name: 'My Website',
      url: 'https://example.com',
      scripts: [
        {
          path: './scripts/main.js',
          order: 1,
          autoInject: true,
        }
      ]
    }
  },
  
  watchRules: [
    {
      pattern: 'scripts/**/*.js',
      action: 'replace'
    }
  ]
});
```

### 3. 启动开发服务器

```bash
npx playwright-dev start
```

## 配置选项

### 平台配置 (PlatformConfig)

```typescript
interface PlatformConfig {
  name: string;                    // 平台名称
  url: string;                     // 初始URL
  scripts: ScriptConfig[];         // 脚本列表
  browserOptions?: {               // 浏览器选项
    headless?: boolean;
    devtools?: boolean;
    viewport?: { width: number; height: number };
  };
}
```

### 脚本配置 (ScriptConfig)

```typescript
interface ScriptConfig {
  path: string;        // 脚本文件路径
  order?: number;      // 注入顺序
  autoInject?: boolean; // 是否自动注入
}
```

### 文件监听规则 (FileWatchRule)

```typescript
interface FileWatchRule {
  pattern: string;     // 文件匹配模式
  action: 'reload' | 'replace' | 'custom'; // 行为类型
  handler?: (filePath: string, page: Page, context: PluginContext) => Promise<void>;
}
```

## 插件系统

### 使用内置插件

```javascript
import { defineConfig, consoleLoggerPlugin, autoReloadPlugin } from 'playwright-dev-server';

export default defineConfig({
  plugins: [
    consoleLoggerPlugin,
    autoReloadPlugin,
  ],
  // ...其他配置
});
```

### 创建自定义插件

```javascript
const myPlugin = {
  name: 'my-plugin',
  
  async setup(context) {
    console.log('插件初始化');
  },
  
  async onPageLoad(page, platformId, context) {
    console.log(\`页面加载: \${platformId}\`);
  },
  
  watchRules: [
    {
      pattern: '**/*.json',
      action: 'custom',
      async handler(filePath, page, context) {
        // 自定义处理逻辑
        console.log(\`JSON 文件变化: \${filePath}\`);
      }
    }
  ]
};
```

## 编程接口

除了 CLI 工具，你也可以在代码中直接使用：

```javascript
import { PlaywrightDevServer, defineConfig } from 'playwright-dev-server';

const config = defineConfig({
  platforms: {
    test: {
      name: 'Test Site',
      url: 'https://example.com',
      scripts: [{ path: './test.js' }]
    }
  }
});

const server = new PlaywrightDevServer(config);

// 启动服务器
await server.start();

// 手动注入脚本
await server.injectScript('test', './custom.js');

// 导航页面
await server.navigatePage('test', 'https://another-url.com');

// 停止服务器
await server.stop();
```

## API 参考

### PlaywrightDevServer

#### 方法

- `start()`: 启动服务器
- `stop()`: 停止服务器
- `injectScript(platformId, scriptPath)`: 手动注入脚本
- `navigatePage(platformId, url)`: 导航页面
- `reloadScripts()`: 重新加载所有脚本
- `getPageList()`: 获取页面列表
- `getConfig()`: 获取配置
- `updateConfig(newConfig)`: 更新配置

## 内置插件

### consoleLoggerPlugin

监听页面控制台输出并打印到终端。

### autoReloadPlugin

当 HTML 或 CSS 文件变化时自动重载页面，CSS 文件支持热重载。

## 许可证

MIT