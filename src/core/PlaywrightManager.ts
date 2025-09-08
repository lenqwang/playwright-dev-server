import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { DevServerConfig } from '../types.js';

export class PlaywrightManager {
  private browser: Browser | null = null;
  private defaultContext: BrowserContext | null = null;

  async initialize(config: DevServerConfig) {
    console.log('🚀 Initializing Playwright browser...');
    
    this.browser = await chromium.launch({
      headless: config.browserOptions?.headless ?? false,
      devtools: config.browserOptions?.devtools ?? true,
      slowMo: config.browserOptions?.slowMo,
    });

    this.defaultContext = await this.browser.newContext();
    
    console.log('✅ Playwright browser initialization completed');
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
  async createContext(contextOptions?: import('../types.js').BrowserContextOptions): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // 构建 Playwright 的上下文选项
    const playwrightOptions: any = {};

    if (contextOptions) {
      // 基本选项
      if (contextOptions.viewport !== undefined) playwrightOptions.viewport = contextOptions.viewport;
      if (contextOptions.userAgent) playwrightOptions.userAgent = contextOptions.userAgent;
      if (contextOptions.deviceScaleFactor) playwrightOptions.deviceScaleFactor = contextOptions.deviceScaleFactor;
      if (contextOptions.isMobile !== undefined) playwrightOptions.isMobile = contextOptions.isMobile;
      if (contextOptions.hasTouch !== undefined) playwrightOptions.hasTouch = contextOptions.hasTouch;
      if (contextOptions.locale) playwrightOptions.locale = contextOptions.locale;
      if (contextOptions.timezoneId) playwrightOptions.timezoneId = contextOptions.timezoneId;
      if (contextOptions.permissions) playwrightOptions.permissions = contextOptions.permissions;
      if (contextOptions.extraHTTPHeaders) playwrightOptions.extraHTTPHeaders = contextOptions.extraHTTPHeaders;
      if (contextOptions.offline !== undefined) playwrightOptions.offline = contextOptions.offline;
      if (contextOptions.httpCredentials) playwrightOptions.httpCredentials = contextOptions.httpCredentials;
      if (contextOptions.ignoreHTTPSErrors !== undefined) playwrightOptions.ignoreHTTPSErrors = contextOptions.ignoreHTTPSErrors;
      if (contextOptions.colorScheme) playwrightOptions.colorScheme = contextOptions.colorScheme;
      if (contextOptions.reducedMotion) playwrightOptions.reducedMotion = contextOptions.reducedMotion;
      if (contextOptions.forcedColors) playwrightOptions.forcedColors = contextOptions.forcedColors;
      if (contextOptions.acceptDownloads !== undefined) playwrightOptions.acceptDownloads = contextOptions.acceptDownloads;
      if (contextOptions.bypassCSP !== undefined) playwrightOptions.bypassCSP = contextOptions.bypassCSP;
      if (contextOptions.recordVideo) playwrightOptions.recordVideo = contextOptions.recordVideo;
      if (contextOptions.recordHar) playwrightOptions.recordHar = contextOptions.recordHar;
    }

    console.log(`🌐 Creating browser context with options:`, Object.keys(playwrightOptions));
    return await this.browser.newContext(playwrightOptions);
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
    
    console.log('🛑 Playwright browser closed');
  }
}