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
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});
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