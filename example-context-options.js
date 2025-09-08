import { defineConfig, consoleLoggerPlugin, scriptInjectionPlugin } from './src/index.js';

export default defineConfig({
  platforms: {
    // 桌面平台配置
    desktop: {
      name: 'Desktop Platform',
      url: 'https://example.com',
      contextOptions: {
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        colorScheme: 'light',
        reducedMotion: 'no-preference',
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        extraHTTPHeaders: {
          'X-Custom-Header': 'desktop-testing'
        }
      },
      scripts: [
        { path: './scripts/desktop.js', autoInject: true }
      ]
    },

    // 移动平台配置
    mobile: {
      name: 'Mobile Platform',
      url: 'https://example.com',
      contextOptions: {
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
        colorScheme: 'light',
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        permissions: ['geolocation', 'notifications'],
        extraHTTPHeaders: {
          'X-Custom-Header': 'mobile-testing'
        }
      },
      scripts: [
        { path: './scripts/mobile.js', autoInject: true }
      ]
    },

    // 平板配置
    tablet: {
      name: 'Tablet Platform',
      url: 'https://example.com',
      contextOptions: {
        viewport: { width: 768, height: 1024 }, // iPad
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        colorScheme: 'dark',
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
        permissions: ['camera', 'microphone'],
        extraHTTPHeaders: {
          'X-Device-Type': 'tablet',
          'X-Test-Environment': 'development'
        }
      },
      scripts: [
        { path: './scripts/tablet.js', autoInject: true }
      ]
    },

    // 高级配置示例
    advanced: {
      name: 'Advanced Testing Platform',
      url: 'https://example.com',
      contextOptions: {
        viewport: { width: 1440, height: 900 },
        userAgent: 'Custom Test Agent 1.0',
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        forcedColors: 'active',
        deviceScaleFactor: 1.5,
        isMobile: false,
        hasTouch: false,
        offline: false,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        bypassCSP: true,
        permissions: ['geolocation', 'camera', 'microphone', 'notifications'],
        extraHTTPHeaders: {
          'Authorization': 'Bearer test-token',
          'X-API-Version': 'v2',
          'X-Test-Suite': 'advanced-features'
        },
        httpCredentials: {
          username: 'testuser',
          password: 'testpass'
        },
        // 录制选项（可选）
        recordVideo: {
          dir: './test-videos/',
          size: { width: 1440, height: 900 }
        },
        recordHar: {
          path: './test-logs/network.har',
          mode: 'full',
          content: 'attach'
        }
      },
      scripts: [
        { path: './scripts/advanced.js', autoInject: true }
      ]
    }
  },
  
  plugins: [
    consoleLoggerPlugin(),
    scriptInjectionPlugin(),
    
    // 自定义插件：显示上下文信息
    {
      name: 'context-info',
      order: 100,
      
      async platformReady(platformId, page) {
        // 注入脚本来显示上下文信息
        await page.addScriptTag({
          content: `
            console.log('🌐 Platform Context Info:', {
              platform: '${platformId}',
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
              },
              userAgent: navigator.userAgent,
              language: navigator.language,
              cookieEnabled: navigator.cookieEnabled,
              onLine: navigator.onLine,
              touchSupport: 'ontouchstart' in window
            });
            
            // 在页面上显示平台信息
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = \`
              <h3>Platform: ${platformId}</h3>
              <p>Viewport: \${window.innerWidth}x\${window.innerHeight}</p>
              <p>Device Pixel Ratio: \${window.devicePixelRatio}</p>
              <p>Language: \${navigator.language}</p>
              <p>Touch Support: \${'ontouchstart' in window ? 'Yes' : 'No'}</p>
            \`;
            infoDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; z-index: 9999;';
            document.body.appendChild(infoDiv);
          `
        });
      }
    }
  ],
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});