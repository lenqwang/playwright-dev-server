# Playwright Dev Server

A plugin-based development server for injecting scripts and styles into web pages using Playwright. Inspired by Vite's architecture, it provides a flexible and extensible platform for web development automation.

## Features

- 🔌 **Plugin-based Architecture**: Extensible plugin system similar to Vite
- 🎯 **Multi-platform Support**: Manage multiple browser instances with different configurations
- 🔄 **Hot Reload**: Automatic script and style injection with file watching
- 📝 **Event-driven**: Rich event system for plugin communication
- 🎨 **Built-in Plugins**: Console logging, auto-reload, script/style injection
- ⚡ **Fast Development**: Optimized for rapid development workflows

## Quick Start

### Installation

```bash
npm install playwright-dev-server
```

### Initialize Configuration

```bash
npx playwright-dev init
```

This creates a `playwright-dev.config.js` file with example configuration.

### Start Development Server

```bash
npx playwright-dev start
```

## Configuration

### Basic Configuration

```javascript
import { defineConfig, consoleLoggerPlugin, autoReloadPlugin } from 'playwright-dev-server';

export default defineConfig({
  platforms: {
    myApp: {
      name: 'My Application',
      url: 'http://localhost:3000',
      scripts: [
        {
          path: './scripts/debug.js',
          order: 1,
          autoInject: true,
        }
      ],
      styles: [
        {
          path: './styles/debug.css',
          order: 1,
          autoInject: true,
        }
      ],
      browserOptions: {
        viewport: { width: 1280, height: 720 }
      }
    }
  },
  
  plugins: [
    consoleLoggerPlugin(),
    autoReloadPlugin(),
  ],
  
  // 日志配置
  logging: {
    enabled: true,  // 启用日志输出，默认为 false
    prefix: '[DEV]' // 可选的日志前缀
  },
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});
```

## 日志管理

Playwright Dev Server 提供了统一的日志管理系统，支持动态开启和关闭日志输出。

### 配置日志

在配置文件中设置日志选项：

```javascript
export default defineConfig({
  logging: {
    enabled: true,  // 启用日志输出，默认为 false
    prefix: '[DEV]' // 可选的日志前缀
  },
  // ... 其他配置
});
```

### API 控制日志

通过服务器实例动态控制日志：

```javascript
import { PlaywrightDevServer } from 'playwright-dev-server';

const server = new PlaywrightDevServer(config);

// 启用日志
server.enableLogging();

// 禁用日志
server.disableLogging();

// 检查日志状态
console.log(server.isLoggingEnabled()); // true/false

// 设置日志前缀
server.setLogPrefix('[CUSTOM]');

// 通过配置更新日志设置
server.updateConfig({
  logging: {
    enabled: true,
    prefix: '[UPDATED]'
  }
});
```

### 直接使用 Logger

也可以直接导入和使用 Logger 实例：

```javascript
import { logger } from 'playwright-dev-server';

// 各种日志级别
logger.log('普通日志');
logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志');
logger.debug('调试日志');

// 性能计时
logger.time('操作耗时');
// ... 执行操作
logger.timeEnd('操作耗时');
```

## Plugin System

### Built-in Plugins

#### Console Logger Plugin
Captures and displays browser console output in your terminal.

```javascript
import { consoleLoggerPlugin } from 'playwright-dev-server';

export default defineConfig({
  plugins: [
    consoleLoggerPlugin()
  ]
});
```

#### Auto Reload Plugin
Automatically reloads pages when HTML/CSS files change, with CSS hot-reload support.

```javascript
import { autoReloadPlugin } from 'playwright-dev-server';

export default defineConfig({
  plugins: [
    autoReloadPlugin()
  ]
});
```

### Creating Custom Plugins

Plugins are functions that return plugin objects with lifecycle hooks:

```javascript
function myCustomPlugin() {
  return {
    name: 'my-custom-plugin',
    order: 100, // Execution order (lower = earlier)
    
    // Server lifecycle
    buildStart() {
      console.log('Server starting...');
    },
    
    buildEnd() {
      console.log('Server started!');
    },
    
    // Platform lifecycle
    platformCreated(platformId, page) {
      console.log(`Platform ${platformId} created`);
    },
    
    platformReady(platformId, page) {
      console.log(`Platform ${platformId} ready`);
    },
    
    // File watching
    fileChanged(filePath, event) {
      console.log(`File ${filePath} was ${event}`);
    },
    
    // Content transformation
    transformScript(code, scriptPath, platformId) {
      // Modify script content before injection
      return `console.log('Loading ${scriptPath}');\n${code}`;
    },
    
    transformStyle(code, stylePath, platformId) {
      // Modify style content before injection
      return `/* ${stylePath} */\n${code}`;
    }
  };
}
```

### Plugin Hooks

- **buildStart**: Called when server starts
- **buildEnd**: Called when server is ready
- **platformCreated**: Called when a platform page is created
- **platformReady**: Called when a platform page is ready for interaction
- **fileChanged**: Called when watched files change
- **transformScript**: Transform script content before injection
- **transformStyle**: Transform style content before injection

### Event System

Plugins can listen to and emit events:

```javascript
function eventListenerPlugin() {
  return {
    name: 'event-listener',
    
    buildStart() {
      // Listen to events
      this.on('platform:ready', ({ platformId, page }) => {
        console.log(`Platform ${platformId} is ready!`);
      });
      
      // Emit custom events
      this.emit('custom:event', { data: 'hello' });
    }
  };
}
```

## API Reference

### PlaywrightDevServer

```javascript
import { PlaywrightDevServer } from 'playwright-dev-server';

const server = new PlaywrightDevServer(config);

// Start server
await server.start();

// Navigate platform
await server.navigatePage('myApp', 'http://localhost:3001');

// Inject script manually
await server.injectScript('myApp', './scripts/test.js');

// Get page list
const pages = await server.getPageList();

// Stop server
await server.stop();
```

## Examples

### Performance Monitoring Plugin

```javascript
function performancePlugin() {
  return {
    name: 'performance-monitor',
    
    async platformReady(platformId, page) {
      await page.addScriptTag({
        content: `
          window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
          });
        `
      });
    }
  };
}
```

### Auto Screenshot Plugin

```javascript
function autoScreenshotPlugin(options = {}) {
  return {
    name: 'auto-screenshot',
    
    async platformCreated(platformId, page) {
      page.on('pageerror', async () => {
        const filename = `error-${platformId}-${Date.now()}.png`;
        await page.screenshot({ path: filename });
        console.log(`Screenshot saved: ${filename}`);
      });
    }
  };
}
```

## License

MIT