import { resolve } from "path";
import type { DevServerConfig, PluginOption } from "./types.js";
import { PlaywrightManager } from "./core/PlaywrightManager.js";
import { PageManager } from "./core/PageManager.js";
import { FileWatcher } from "./core/FileWatcher.js";
import { EventEmitter } from "./core/EventEmitter.js";
import { PluginManager } from "./core/PluginManager.js";
import { logger } from "./core/Logger.js";
import {
  scriptInjectionPlugin,
  extendContextWithScriptInjection,
} from "./plugins/scriptInjection.js";
import {
  styleInjectionPlugin,
  extendContextWithStyleInjection,
} from "./plugins/styleInjection.js";

/**
 * Playwright 开发服务器 - 基于插件的架构
 */
export class PlaywrightDevServer {
  private projectRoot: string;
  private config: DevServerConfig;
  private eventEmitter: EventEmitter;
  private playwrightManager: PlaywrightManager;
  private pageManager: PageManager | null = null;
  private fileWatcher: FileWatcher | null = null;
  private pluginManager: PluginManager;
  private isStarted = false;

  constructor(config: DevServerConfig, projectRoot?: string) {
    this.projectRoot = resolve(projectRoot || config.root || process.cwd());
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.playwrightManager = new PlaywrightManager();
    this.pluginManager = new PluginManager(
      this.config,
      this.eventEmitter,
      this.projectRoot
    );

    // 初始化日志配置
    this.initializeLogger();

    logger.log(`📁 Project root: ${this.projectRoot}`);
  }

  /**
   * 初始化日志配置
   */
  private initializeLogger(): void {
    const loggingConfig = this.config.logging;
    
    if (loggingConfig?.enabled) {
      logger.enable();
    } else {
      logger.disable();
    }
    
    if (loggingConfig?.prefix) {
      logger.setPrefix(loggingConfig.prefix);
    }
  }

  /**
   * 启动开发服务器
   */
  async start(): Promise<this> {
    if (this.isStarted) {
      logger.warn("⚠️  Server is already started");
      return this;
    }

    try {
      logger.log("🚀 Starting Playwright Dev Server...");

      // 1. 初始化 Playwright
      await this.playwrightManager.initialize(this.config);

      // 2. 创建页面管理器
      this.pageManager = new PageManager(
        this.playwrightManager,
        this.config,
        this.eventEmitter
      );

      // 3. 创建文件监听器
      this.fileWatcher = new FileWatcher(
        this.projectRoot,
        this.config,
        this.eventEmitter
      );

      // 4. 加载插件（包括内置插件）
      await this.loadPlugins();

      // 5. 更新插件上下文，注入页面管理器方法
      this.updatePluginContext();

      // 6. 执行插件的 buildStart 钩子
      await this.pluginManager.executeHook("buildStart");

      // 7. 发射服务器启动事件
      await this.eventEmitter.emit("server:start", { config: this.config });

      // 8. 启动所有平台页面
      await this.pageManager.launchPlatformPages();

      // 9. 启动文件监听
      const watchPatterns = this.pluginManager.getWatchPatterns();
      this.fileWatcher.startWatching(watchPatterns);

      // 10. 执行插件的 buildEnd 钩子
      await this.pluginManager.executeHook("buildEnd");

      this.isStarted = true;
      logger.log("✅ Playwright Dev Server started successfully!");

      return this;
    } catch (error) {
      logger.error("❌ Failed to start server:", error);
      await this.stop();
      throw error;
    }
  }

  /**
   * 加载插件
   */
  private async loadPlugins(): Promise<void> {
    const plugins: PluginOption[] = [
      // 内置插件
      scriptInjectionPlugin(),
      styleInjectionPlugin(),
      // 用户插件
      ...(this.config.plugins || []),
    ];

    await this.pluginManager.loadPlugins(plugins);
  }

  /**
   * 更新插件上下文
   */
  private updatePluginContext(): void {
    const context = this.pluginManager.getContext();

    // 注入页面管理器方法
    context.getPage = (platformId: string) => {
      return this.pageManager?.getPage(platformId);
    };

    context.getPages = () => {
      return this.pageManager?.getPages() || new Map();
    };

    // 扩展上下文，添加脚本和样式注入方法
    extendContextWithScriptInjection(context);
    extendContextWithStyleInjection(context);

    // 添加转换钩子执行方法
    (context as any).executeTransformHook =
      this.pluginManager.executeTransformHook.bind(this.pluginManager);

    this.pluginManager.updateContext(context);
  }

  /**
   * 手动注入脚本到指定平台
   */
  async injectScript(platformId: string, scriptPath: string): Promise<void> {
    if (!this.isStarted) {
      throw new Error("Server is not started");
    }

    const page = this.pageManager?.getPage(platformId);
    if (!page) {
      throw new Error(`Platform ${platformId} not found`);
    }

    const context = this.pluginManager.getContext();
    await (context as any).injectScript(platformId, page, { path: scriptPath });
  }

  /**
   * 导航到指定URL
   */
  async navigatePage(platformId: string, url: string): Promise<void> {
    if (!this.pageManager) {
      throw new Error("Server is not started");
    }

    await this.pageManager.navigatePage(platformId, url);
  }

  /**
   * 获取页面列表
   */
  async getPageList(): Promise<
    Array<{ platformId: string; url: string; title: string }>
  > {
    if (!this.pageManager) {
      return [];
    }

    return await this.pageManager.getPageList();
  }

  /**
   * 获取配置信息
   */
  getConfig(): DevServerConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DevServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.pageManager?.updateConfig(this.config);
    
    // 重新初始化日志配置
    this.initializeLogger();
  }

  /**
   * 启用日志输出
   */
  enableLogging(): void {
    logger.enable();
  }

  /**
   * 禁用日志输出
   */
  disableLogging(): void {
    logger.disable();
  }

  /**
   * 检查日志是否启用
   */
  isLoggingEnabled(): boolean {
    return logger.isEnabled();
  }

  /**
   * 设置日志前缀
   */
  setLogPrefix(prefix: string): void {
    logger.setPrefix(prefix);
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      logger.log("🛑 Stopping Playwright Dev Server...");

      // 发射服务器停止事件
      await this.eventEmitter.emit("server:stop", {});

      // 停止文件监听
      if (this.fileWatcher) {
        await this.fileWatcher.stopWatching();
        this.fileWatcher = null;
      }

      // 关闭所有页面
      if (this.pageManager) {
        await this.pageManager.closeAllPages();
        this.pageManager = null;
      }

      // 关闭 Playwright
      await this.playwrightManager.close();

      // 清理事件监听器
      this.eventEmitter.removeAllListeners();

      this.isStarted = false;
      logger.log("✅ Playwright Dev Server stopped");
    } catch (error) {
      logger.error("❌ Error stopping server:", error);
    }
  }
}
