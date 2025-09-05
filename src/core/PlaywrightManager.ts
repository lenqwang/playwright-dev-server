import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { DevServerConfig } from '../types.js';

export class PlaywrightManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async initialize(config: DevServerConfig) {
    console.log('🚀 初始化 Playwright 浏览器...');
    
    this.browser = await chromium.launch({
      headless: config.browserOptions?.headless ?? false,
      devtools: config.browserOptions?.devtools ?? true,
      slowMo: config.browserOptions?.slowMo,
    });

    this.context = await this.browser.newContext();
    
    console.log('✅ Playwright 浏览器初始化完成');
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return this.browser;
  }

  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    return this.context;
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    console.log('🛑 Playwright 浏览器已关闭');
  }
}