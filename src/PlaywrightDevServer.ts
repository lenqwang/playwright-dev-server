import { resolve } from 'path';
import type { DevServerConfig, PluginContext } from './types.js';
import { PlaywrightManager } from './core/PlaywrightManager.js';
import { ScriptInjector } from './core/ScriptInjector.js';
import { PageManager } from './core/PageManager.js';
import { FileWatcher } from './core/FileWatcher.js';
import { defaultConfig } from './config.js';

export class PlaywrightDevServer {
  private projectRoot: string;
  private config: DevServerConfig;
  private playwrightManager: PlaywrightManager;
  private scriptInjector: ScriptInjector | null = null;
  private pageManager: PageManager | null = null;
  private fileWatcher: FileWatcher | null = null;
  private context: PluginContext;

  constructor(config: DevServerConfig, projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.config = { ...defaultConfig, ...config };
    this.playwrightManager = new PlaywrightManager();
    
    // 创建插件上下文
    this.context = {
      projectRoot: this.projectRoot,
      config: this.config,
      pageManager: null as any, // 稍后设置
      scriptInjector: null as any, // 稍后设置
    };
  }

  /**
   * 启动开发服务器
   */
  async start(): Promise<this> {
    try {
      console.log('🚀 Starting Playwright development server...');
      
      // 1. 初始化 Playwright
      await this.playwrightManager.initialize(this.config);
      
      // 2. 初始化脚本注入器
      this.scriptInjector = new ScriptInjector(this.projectRoot, this.context);
      this.context.scriptInjector = this.scriptInjector;
      
      // 3. 初始化页面管理器
      this.pageManager = new PageManager(
        this.playwrightManager,
        this.scriptInjector,
        this.config,
        this.context
      );
      this.context.pageManager = this.pageManager;
      
      // 4. 初始化插件
      await this.initializePlugins();
      
      // 5. 启动平台页面
      await this.pageManager.launchPlatformPages();
      
      // 6. 设置文件监控
      this.setupFileWatcher();
      
      console.log('✅ Playwright development server is ready!');
      console.log('📱 Supported platforms:', Object.keys(this.config.platforms).join(', '));
      
      return this;
    } catch (error) {
      console.error('❌ Failed to start development server:', error);
      throw error;
    }
  }

  /**
   * 初始化插件
   */
  private async initializePlugins(): Promise<void> {
    if (!this.config.plugins) return;

    console.log('🔌 Initializing plugins...');
    
    for (const plugin of this.config.plugins) {
      try {
        if (plugin.setup) {
          await plugin.setup(this.context);
        }
        console.log(`✅ Plugin initialization completed: ${plugin.name}`);
      } catch (error) {
        console.error(`❌ Plugin initialization failed: ${plugin.name}`, error);
      }
    }
  }

  /**
   * 设置文件监控
   */
  private setupFileWatcher(): void {
    const watchRules = this.config.watchRules || [];
    
    this.fileWatcher = new FileWatcher(
      this.projectRoot,
      this.pageManager!,
      this.context,
      watchRules
    );
    
    this.fileWatcher.startWatching();
  }

  /**
   * 手动注入脚本到指定平台
   */
  async injectScript(platformId: string, scriptPath: string): Promise<void> {
    if (!this.pageManager || !this.scriptInjector) {
      throw new Error('Server not started');
    }

    const page = this.pageManager.getPage(platformId);
    if (!page) {
      throw new Error(`Platform ${platformId} not found`);
    }

    return await this.scriptInjector.injectScript(page, scriptPath, platformId);
  }

  /**
   * 导航到指定URL
   */
  async navigatePage(platformId: string, url: string): Promise<void> {
    if (!this.pageManager) {
      throw new Error('Server not started');
    }

    return await this.pageManager.navigatePage(platformId, url);
  }

  /**
   * 获取页面列表
   */
  getPageList(): Array<{ platformId: string; url: string; title: string }> {
    if (!this.pageManager) {
      return [];
    }

    return this.pageManager.getPageList();
  }

  /**
   * 重新加载脚本
   */
  async reloadScripts(): Promise<void> {
    if (!this.pageManager) {
      throw new Error('Server not started');
    }

    return await this.pageManager.reloadAllScripts();
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
    
    if (this.pageManager) {
      this.pageManager.updateConfig(this.config);
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    console.log('🛑 Shutting down Playwright development server...');
    
    try {
      // 停止文件监控
      if (this.fileWatcher) {
        await this.fileWatcher.stopWatching();
      }
      
      // 关闭所有页面
      if (this.pageManager) {
        await this.pageManager.closeAllPages();
      }
      
      // 关闭浏览器
      if (this.playwrightManager) {
        await this.playwrightManager.close();
      }
      
      console.log('🛑 Playwright development server stopped');
    } catch (error) {
      console.error('❌ Error occurred while shutting down development server:', error);
    }
  }
}