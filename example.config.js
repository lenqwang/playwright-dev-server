import {
  defineConfig,
  consoleLoggerPlugin,
  autoReloadPlugin,
} from "./src/index.js";

export default defineConfig({
  platforms: {
    // Example platform: Local development page
    local: {
      name: "Local Development",
      url: "https://www.baidu.com/",
      scripts: [
        {
          path: "./scripts/common.js",
          order: 1,
          autoInject: true,
        },
        {
          path: "./config/reload.js",
          order: 2,
          autoInject: true,
        },
      ],
      styles: [
        {
          path: "./assets/style.css",
          order: 1,
          autoInject: true,
        },
      ],
      browserOptions: {
        viewport: { width: 1280, height: 720 },
      },
    },
  },

  // Plugin configuration
  plugins: [
    consoleLoggerPlugin(),
    autoReloadPlugin(),

    // Custom plugin example
    {
      name: "custom-logger",
      order: 100,
      
      buildStart() {
        console.log("🔧 Custom plugin loaded");
      },
      
      platformReady(platformId, page) {
        // Inject global variables when page is ready
        page.evaluate((platform) => {
          window.__DEV_PLATFORM__ = platform;
          window.__DEV_TIMESTAMP__ = Date.now();
        }, platformId);
      },
      
      transformScript(script, scriptPath, platformId) {
        // Add comments before script injection
        return `// Auto-injected at ${new Date().toISOString()}\n// Platform: ${platformId}\n// Script: ${scriptPath}\n${script}`;
      },
    },
  ],

  // Global browser options
  browserOptions: {
    headless: false,
    devtools: true,
    slowMo: 100, // Slow down operations for debugging
  },
});
