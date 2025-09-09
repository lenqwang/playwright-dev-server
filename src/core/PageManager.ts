import type { Page, BrowserContext } from 'playwright';
import type { DevServerConfig } from '../types.js';
import { PlaywrightManager } from './PlaywrightManager.js';
import { EventEmitter } from './EventEmitter.js';

/**
 * 页面管理器 - 负责管理所有平台的页面实例
 */
export class PageManager {
  private pages: Map<string, Page> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();

  constructor(
    private playwrightManager: PlaywrightManager,
    private config: DevServerConfig,
    private eventEmitter: EventEmitter
  ) {}

  /**
   * 启动所有平台页面
   */
  async launchPlatformPages(): Promise<void> {
    const platformEntries = Object.entries(this.config.platforms);
    
    for (const [platformId, platformConfig] of platformEntries) {
      try {
        console.log(`🚀 Launching platform: ${platformConfig.name} (${platformId})`);
        
        // 创建浏览器上下文
        let contextOptions = platformConfig.contextOptions || {};
        
        const context = await this.playwrightManager.createContext(contextOptions);
        
        this.contexts.set(platformId, context);

        // 创建页面
        const page = await context.newPage();
        this.pages.set(platformId, page);

        // 发射平台创建事件
        await this.eventEmitter.emit('platform:created', {
          platformId,
          page,
          context
        });

        // 导航到初始URL
        await page.goto(platformConfig.url);

        // 发射平台准备就绪事件
        await this.eventEmitter.emit('platform:ready', {
          platformId,
          page
        });

        console.log(`✅ Platform ready: ${platformConfig.name} (${platformId})`);
      } catch (error) {
        console.error(`❌ Failed to launch platform ${platformId}:`, error);
      }
    }
  }

  /**
   * 获取指定平台的页面
   */
  getPage(platformId: string): Page | undefined {
    return this.pages.get(platformId);
  }

  /**
   * 获取所有页面
   */
  getPages(): Map<string, Page> {
    return new Map(this.pages);
  }

  /**
   * 获取所有页面列表
   */
  async getPageList(): Promise<Array<{ platformId: string; url: string; title: string }>> {
    const list: Array<{ platformId: string; url: string; title: string }> = [];
    
    for (const [platformId, page] of this.pages) {
      try {
        const url = page.url();
        const title = await page.title();
        list.push({ platformId, url, title });
      } catch (error) {
        console.error(`Failed to get page info for ${platformId}:`, error);
      }
    }
    
    return list;
  }

  /**
   * 导航页面到指定URL
   */
  async navigatePage(platformId: string, url: string): Promise<void> {
    const page = this.pages.get(platformId);
    if (!page) {
      throw new Error(`Platform ${platformId} not found`);
    }

    await page.goto(url);
    
    // 发射导航事件
    await this.eventEmitter.emit('platform:navigate', {
      platformId,
      page,
      url
    });

    console.log(`🧭 Navigated ${platformId} to: ${url}`);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: DevServerConfig): void {
    this.config = newConfig;
  }

  /**
   * 关闭所有页面
   */
  async closeAllPages(): Promise<void> {
    for (const [platformId, page] of this.pages) {
      try {
        await this.eventEmitter.emit('platform:close', { platformId });
        await page.close();
        console.log(`🔒 Closed platform: ${platformId}`);
      } catch (error) {
        console.error(`Failed to close platform ${platformId}:`, error);
      }
    }

    for (const [platformId, context] of this.contexts) {
      try {
        await context.close();
      } catch (error) {
        console.error(`Failed to close context for ${platformId}:`, error);
      }
    }

    this.pages.clear();
    this.contexts.clear();
  }
}