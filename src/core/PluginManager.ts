import type { Plugin, PluginOption, PluginContext, DevServerConfig } from '../types.js';
import { EventEmitter } from './EventEmitter.js';
import { logger } from './Logger.js'

/**
 * 插件管理器 - 负责插件的加载、排序和执行
 */
export class PluginManager {
  private plugins: Plugin[] = [];
  private context: PluginContext;

  constructor(
    private config: DevServerConfig,
    private eventEmitter: EventEmitter,
    private projectRoot: string
  ) {
    this.context = this.createPluginContext();
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器，将事件转发给插件钩子
   */
  private setupEventListeners(): void {
    // 监听平台创建事件
    this.eventEmitter.on('platform:created', async ({ platformId, page }) => {
      await this.executeHook('platformCreated', platformId, page);
    });

    // 监听平台准备就绪事件
    this.eventEmitter.on('platform:ready', async ({ platformId, page }) => {
      await this.executeHook('platformReady', platformId, page);
    });

    // 监听文件变化事件
    this.eventEmitter.on('file:changed', async ({ filePath, event }) => {
      await this.executeHook('fileChanged', filePath, event);
    });

    // 监听平台导航事件
    this.eventEmitter.on('platform:navigate', async ({ platformId, page, url }) => {
      await this.executeHook('platformNavigate', platformId, page, url);
    });
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(): PluginContext {
    return {
      projectRoot: this.projectRoot,
      config: this.config,
      emit: this.eventEmitter.emit.bind(this.eventEmitter),
      on: this.eventEmitter.on.bind(this.eventEmitter),
      off: this.eventEmitter.off.bind(this.eventEmitter),
      getPage: (platformId: string) => {
        // 这里需要从 PageManager 获取页面实例
        // 暂时返回 undefined，后续会在 PlaywrightDevServer 中注入
        return undefined;
      },
      getPages: () => {
        // 这里需要从 PageManager 获取所有页面
        // 暂时返回空 Map，后续会在 PlaywrightDevServer 中注入
        return new Map();
      }
    };
  }

  /**
   * 加载插件
   */
  async loadPlugins(pluginOptions: PluginOption[] = []): Promise<void> {
    this.plugins = [];

    for (const pluginOption of pluginOptions) {
      try {
        let plugin: Plugin;

        if (typeof pluginOption === 'function') {
          plugin = await pluginOption();
        } else {
          plugin = pluginOption;
        }

        this.plugins.push(plugin);
      } catch (error) {
        logger.error(`Failed to load plugin:`, error);
      }
    }

    // 按 order 排序插件
    this.plugins.sort((a, b) => (a.order || 100) - (b.order || 100));

    logger.log(`Loaded ${this.plugins.length} plugins:`, this.plugins.map(p => p.name));
  }

  /**
   * 执行插件钩子
   */
  async executeHook(hookName: string, ...args: any[]): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = (plugin as any)[hookName];
      if (typeof hook === 'function') {
        try {
          await hook.call(this.context, ...args);
        } catch (error) {
          logger.error(`Error executing ${hookName} hook in plugin ${plugin.name}:`, error);
        }
      }
    }
  }

  /**
   * 执行转换钩子（可以修改内容）
   */
  async executeTransformHook<T extends 'transformScript' | 'transformStyle'>(
    hookName: T,
    code: string,
    filePath: string,
    platformId: string
  ): Promise<string> {
    let transformedCode = code;

    for (const plugin of this.plugins) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await hook.call(this.context, transformedCode, filePath, platformId);
          if (typeof result === 'string') {
            transformedCode = result;
          }
        } catch (error) {
          logger.error(`Error executing ${hookName} hook in plugin ${plugin.name}:`, error);
        }
      }
    }

    return transformedCode;
  }

  /**
   * 执行单个插件钩子并返回结果
   */
  async executePluginHook(hookName: string, ...args: any[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const plugin of this.plugins) {
      const hook = (plugin as any)[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await hook.call(this.context, ...args);
          results.push(result);
        } catch (error) {
          logger.error(`Error executing ${hookName} hook in plugin ${plugin.name}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 获取所有插件的文件监听模式
   */
  getWatchPatterns(): string[] {
    const patterns: string[] = [];
    
    for (const plugin of this.plugins) {
      if (plugin.watchPatterns) {
        patterns.push(...plugin.watchPatterns);
      }
    }

    return patterns;
  }

  /**
   * 更新插件上下文
   */
  updateContext(updates: Partial<PluginContext>): void {
    Object.assign(this.context, updates);
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * 获取插件上下文
   */
  getContext(): PluginContext {
    return this.context;
  }
}