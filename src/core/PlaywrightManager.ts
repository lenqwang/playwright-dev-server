import { chromium, type Browser, type BrowserContext, type BrowserContextOptions } from 'playwright';
import type { DevServerConfig } from '../types.js';
import { logger } from './Logger.js'

export class PlaywrightManager {
  private browser: Browser | null = null;
  private defaultContext: BrowserContext | null = null;

  async initialize(config: DevServerConfig) {
    logger.log('🚀 Initializing Playwright browser...');
    
    this.browser = await chromium.launch({
      headless: config.browserOptions?.headless ?? false,
      devtools: config.browserOptions?.devtools ?? true,
      slowMo: config.browserOptions?.slowMo,
    });

    this.defaultContext = await this.browser.newContext();
    
    logger.log('✅ Playwright browser initialization completed');
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return this.browser;
  }

  getContext(): BrowserContext {
    if (!this.defaultContext) {
      throw new Error('Browser context not initialized');
    }
    return this.defaultContext;
  }

  /**
   * 创建新的浏览器上下文
   */
  async createContext(contextOptions: BrowserContextOptions = {}): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    logger.log(`🌐 Creating browser context with options:`, Object.keys(contextOptions));
    
    return await this.browser.newContext(contextOptions);
  }

  async close() {
    if (this.defaultContext) {
      await this.defaultContext.close();
      this.defaultContext = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    logger.log('🛑 Playwright browser closed');
  }
}