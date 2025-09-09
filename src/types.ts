import type { Page, BrowserContext, BrowserContextOptions } from 'playwright';

// ============ 基础配置类型 ============

export interface ScriptConfig {
  /** 脚本文件路径 */
  path: string;
  /** 注入顺序 */
  order?: number;
  /** 是否在页面加载时自动注入 */
  autoInject?: boolean;
  /** 文件变化时是否刷新页面而不是替换脚本 */
  reloadOnChange?: boolean;
}

export interface StyleConfig {
  /** CSS 文件路径 */
  path: string;
  /** 注入顺序 */
  order?: number;
  /** 是否在页面加载时自动注入 */
  autoInject?: boolean;
  /** 文件变化时是否刷新页面而不是替换样式 */
  reloadOnChange?: boolean;
}

export interface PlatformConfig {
  /** 平台名称 */
  name: string;
  /** 初始URL */
  url: string;
  /** 要注入的脚本列表 */
  scripts?: ScriptConfig[];
  /** 要注入的样式列表 */
  styles?: StyleConfig[];
  /** 浏览器上下文选项 */
  contextOptions?: BrowserContextOptions;
  /** 浏览器选项（已废弃，请使用 contextOptions） */
  browserOptions?: {
    headless?: boolean;
    devtools?: boolean;
    viewport?: { width: number; height: number };
  };
}

// ============ 事件系统类型 ============

export interface ServerEvents {
  'server:start': { config: DevServerConfig };
  'server:stop': {};
  'platform:created': { platformId: string; page: Page; context: BrowserContext };
  'platform:ready': { platformId: string; page: Page };
  'platform:navigate': { platformId: string; page: Page; url: string };
  'platform:close': { platformId: string };
  'file:changed': { filePath: string; event: 'add' | 'change' | 'unlink' };
  'script:inject': { platformId: string; page: Page; scriptPath: string; content: string };
  'style:inject': { platformId: string; page: Page; stylePath: string; content: string };
}

export type EventName = keyof ServerEvents;
export type EventPayload<T extends EventName> = ServerEvents[T];
export type EventHandler<T extends EventName> = (payload: EventPayload<T>) => void | Promise<void>;

// ============ 插件系统类型 ============

export interface PluginContext {
  /** 项目根目录 */
  projectRoot: string;
  /** 配置对象 */
  config: DevServerConfig;
  /** 事件发射器 */
  emit: <T extends EventName>(event: T, payload: EventPayload<T>) => Promise<void>;
  /** 事件监听器 */
  on: <T extends EventName>(event: T, handler: EventHandler<T>) => void;
  /** 移除事件监听器 */
  off: <T extends EventName>(event: T, handler: EventHandler<T>) => void;
  /** 获取页面实例 */
  getPage: (platformId: string) => Page | undefined;
  /** 获取所有页面 */
  getPages: () => Map<string, Page>;
  /** 注入脚本方法 (由插件扩展) */
  injectScript?: (platformId: string, page: Page, script: ScriptConfig) => Promise<void>;
  /** 注入样式方法 (由插件扩展) */
  injectStyle?: (platformId: string, page: Page, style: StyleConfig) => Promise<void>;
  /** 重新注入所有资源方法 (由插件扩展) */
  reInjectAllAssets?: (platformId: string, page: Page) => Promise<void>;
  /** 执行转换钩子方法 (由插件管理器扩展) */
  executeTransformHook?: (hookName: 'transformScript' | 'transformStyle', code: string, filePath: string, platformId: string) => Promise<string>;
}

export interface PluginHooks {
  /** 服务器启动前 */
  buildStart?: (this: PluginContext) => void | Promise<void>;
  /** 服务器启动后 */
  buildEnd?: (this: PluginContext) => void | Promise<void>;
  /** 平台页面创建后 */
  platformCreated?: (this: PluginContext, platformId: string, page: Page) => void | Promise<void>;
  /** 平台页面准备就绪 */
  platformReady?: (this: PluginContext, platformId: string, page: Page) => void | Promise<void>;
  /** 平台页面导航时 */
  platformNavigate?: (this: PluginContext, platformId: string, page: Page, url: string) => void | Promise<void>;
  /** 文件变化时 */
  fileChanged?: (this: PluginContext, filePath: string, event: 'add' | 'change' | 'unlink') => void | Promise<void>;
  /** 脚本注入前 - 可以修改脚本内容 */
  transformScript?: (this: PluginContext, code: string, scriptPath: string, platformId: string) => string | Promise<string>;
  /** 样式注入前 - 可以修改样式内容 */
  transformStyle?: (this: PluginContext, code: string, stylePath: string, platformId: string) => string | Promise<string>;
}

export interface Plugin extends PluginHooks {
  /** 插件名称 */
  name: string;
  /** 插件执行顺序，数字越小越先执行 */
  order?: number;
  /** 文件监听模式 */
  watchPatterns?: string[];
}

export type PluginOption = Plugin | (() => Plugin) | (() => Promise<Plugin>);

// ============ 主配置类型 ============

export interface DevServerConfig {
  /** 平台配置 */
  platforms: Record<string, PlatformConfig>;
  /** 插件列表 */
  plugins?: PluginOption[];
  /** 全局浏览器选项 */
  browserOptions?: {
    headless?: boolean;
    devtools?: boolean;
    slowMo?: number;
  };
  /** 项目根目录 */
  root?: string;
}