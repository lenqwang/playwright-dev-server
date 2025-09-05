import type { Page } from "playwright";
import type {
  DevServerConfig,
  PlatformConfig,
  PluginContext,
} from "../types.js";
import { PlaywrightManager } from "./PlaywrightManager.js";
import { ScriptInjector } from "./ScriptInjector.js";

export class PageManager {
  private pages: Map<string, Page> = new Map();
  private playwrightManager: PlaywrightManager;
  private scriptInjector: ScriptInjector;
  private config: DevServerConfig;
  private context: PluginContext;

  constructor(
    playwrightManager: PlaywrightManager,
    scriptInjector: ScriptInjector,
    config: DevServerConfig,
    context: PluginContext
  ) {
    this.playwrightManager = playwrightManager;
    this.scriptInjector = scriptInjector;
    this.config = config;
    this.context = context;
  }

  /**
   * 启动所有平台页面
   */
  async launchPlatformPages(): Promise<void> {
    const browserContext = this.playwrightManager.getContext();

    for (const [platformId, platformConfig] of Object.entries(
      this.config.platforms
    )) {
      console.log(`🌐 启动平台页面: ${platformConfig.name} (${platformId})`);

      const page = await browserContext.newPage();

      // 设置视口
      if (platformConfig.browserOptions?.viewport) {
        await page.setViewportSize(platformConfig.browserOptions.viewport);
      }

      // 导航到目标URL
      await page.goto(platformConfig.url);

      // 等待页面加载
      await page.waitForLoadState("domcontentloaded");

      // 执行插件的 onPageLoad 钩子
      for (const plugin of this.config.plugins || []) {
        if (plugin.onPageLoad) {
          await plugin.onPageLoad(page, platformId, this.context);
        }
      }

      // 注入脚本
      await this.scriptInjector.injectScripts(
        page,
        platformConfig.scripts,
        platformId
      );

      this.pages.set(platformId, page);
      console.log(`✅ 平台页面启动完成: ${platformConfig.name}`);
    }
  }

  /**
   * 获取指定平台的页面
   */
  getPage(platformId: string): Page | undefined {
    return this.pages.get(platformId);
  }

  /**
   * 获取所有页面列表
   */
  getPageList(): Array<{ platformId: string; url: string; title: string }> {
    const result: Array<{ platformId: string; url: string; title: string }> =
      [];

    for (const [platformId, page] of this.pages) {
      result.push({
        platformId,
        url: page.url(),
        title: "", // 可以异步获取 page.title()
      });
    }

    return result;
  }

  /**
   * 导航页面到指定URL
   */
  async navigatePage(platformId: string, url: string): Promise<void> {
    const page = this.getPage(platformId);
    if (!page) {
      throw new Error(`平台 ${platformId} 未找到`);
    }

    await page.goto(url);
    await page.waitForLoadState("domcontentloaded");

    // 重新注入脚本
    const platformConfig = this.config.platforms[platformId];
    if (platformConfig) {
      await this.scriptInjector.injectScripts(
        page,
        platformConfig.scripts,
        platformId
      );
    }
  }

  /**
   * 重新加载所有脚本
   */
  async reloadAllScripts(): Promise<void> {
    for (const [platformId, page] of this.pages) {
      const platformConfig = this.config.platforms[platformId];
      if (platformConfig) {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
        await this.scriptInjector.injectScripts(
          page,
          platformConfig.scripts,
          platformId
        );
      }
    }
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
        await page.close();
        console.log(`🛑 页面已关闭: ${platformId}`);
      } catch (error) {
        console.error(`❌ 关闭页面失败: ${platformId}`, error);
      }
    }

    this.pages.clear();
  }
}
