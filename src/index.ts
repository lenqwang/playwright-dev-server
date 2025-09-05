// 导出主要类和类型
export { PlaywrightDevServer } from './PlaywrightDevServer.js';
export { defineConfig } from './config.js';

// 导出类型定义
export type {
  DevServerConfig,
  PlatformConfig,
  ScriptConfig,
  Plugin,
  PluginContext,
  FileWatchRule,
} from './types.js';

// 导出核心模块（供高级用户使用）
export { PlaywrightManager } from './core/PlaywrightManager.js';
export { ScriptInjector } from './core/ScriptInjector.js';
export { PageManager } from './core/PageManager.js';
export { FileWatcher } from './core/FileWatcher.js';

// 导出内置插件
export { consoleLoggerPlugin } from './plugins/consoleLogger.js';
export { autoReloadPlugin } from './plugins/autoReload.js';