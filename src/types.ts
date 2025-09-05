import type { Page } from 'playwright';

export interface ScriptConfig {
  /** 脚本文件路径 */
  path: string;
  /** 注入顺序 */
  order?: number;
  /** 是否在页面加载时自动注入 */
  autoInject?: boolean;
}

export interface PlatformConfig {
  /** 平台名称 */
  name: string;
  /** 初始URL */
  url: string;
  /** 要注入的脚本列表 */
  scripts: ScriptConfig[];
  /** 浏览器选项 */
  browserOptions?: {
    headless?: boolean;
    devtools?: boolean;
    viewport?: { width: number; height: number };
  };
}

export interface FileWatchRule {
  /** 监听的文件模式 */
  pattern: string;
  /** 文件变化时的行为 */
  action: 'reload' | 'replace' | 'custom';
  /** 自定义处理函数 */
  handler?: (filePath: string, page: Page, context: PluginContext) => Promise<void>;
}

export interface PluginContext {
  /** 项目根目录 */
  projectRoot: string;
  /** 配置对象 */
  config: DevServerConfig;
  /** 页面管理器 */
  pageManager: any;
  /** 脚本注入器 */
  scriptInjector: any;
}

export interface Plugin {
  /** 插件名称 */
  name: string;
  /** 插件初始化 */
  setup?: (context: PluginContext) => void | Promise<void>;
  /** 文件监听规则 */
  watchRules?: FileWatchRule[];
  /** 页面加载后的钩子 */
  onPageLoad?: (page: Page, platformId: string, context: PluginContext) => void | Promise<void>;
  /** 脚本注入前的钩子 */
  beforeScriptInject?: (script: string, page: Page, context: PluginContext) => string | Promise<string>;
  /** 脚本注入后的钩子 */
  afterScriptInject?: (page: Page, context: PluginContext) => void | Promise<void>;
}

export interface DevServerConfig {
  /** 平台配置 */
  platforms: Record<string, PlatformConfig>;
  /** 插件列表 */
  plugins?: Plugin[];
  /** 全局文件监听规则 */
  watchRules?: FileWatchRule[];
  /** 全局浏览器选项 */
  browserOptions?: {
    headless?: boolean;
    devtools?: boolean;
    slowMo?: number;
  };
}