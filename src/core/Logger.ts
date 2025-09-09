/**
 * 日志管理器
 * 提供统一的日志输出接口，支持动态开启/关闭日志
 */
export class Logger {
  private static instance: Logger;
  private enabled: boolean = false;
  private prefix: string = '';

  private constructor() {}

  /**
   * 获取Logger单例实例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 启用日志输出
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用日志输出
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 检查日志是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置日志前缀
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * 获取格式化的消息
   */
  private formatMessage(message: string): string {
    return this.prefix ? `${this.prefix} ${message}` : message;
  }

  /**
   * 普通日志输出
   */
  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  /**
   * 信息日志输出
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  /**
   * 警告日志输出
   */
  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  /**
   * 错误日志输出
   */
  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(this.formatMessage(message), ...args);
    }
  }

  /**
   * 调试日志输出
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(this.formatMessage(message), ...args);
    }
  }

  /**
   * 时间开始标记
   */
  time(label: string): void {
    if (this.enabled) {
      console.time(this.formatMessage(label));
    }
  }

  /**
   * 时间结束标记
   */
  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(this.formatMessage(label));
    }
  }
}

/**
 * 获取全局Logger实例的便捷函数
 */
export const logger = Logger.getInstance();