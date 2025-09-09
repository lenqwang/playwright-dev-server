import chokidar, { type FSWatcher } from 'chokidar';
import { minimatch } from 'minimatch';
import type { DevServerConfig } from '../types.js';
import { EventEmitter } from './EventEmitter.js';
import { logger } from './Logger.js'

/**
 * 文件监听器 - 监听文件变化并发射事件
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;

  constructor(
    private projectRoot: string,
    private config: DevServerConfig,
    private eventEmitter: EventEmitter
  ) {}

  /**
   * 开始监听文件变化
   */
  startWatching(watchPatterns: string[] = []): void {
    logger.log('👀 Starting to watch file changes...');

    // 收集所有需要监听的文件模式
    const patterns = this.collectWatchPatterns(watchPatterns);
    
    if (patterns.length === 0) {
      logger.log('⚠️  No file patterns found to watch');
      return;
    }

    this.watcher = chokidar.watch(patterns, {
      cwd: this.projectRoot,
      ignoreInitial: true,
      persistent: true,
    });

    // 监听文件变化事件
    this.watcher.on('add', async (filePath) => {
      logger.log(`➕ File added: ${filePath}`);
      await this.eventEmitter.emit('file:changed', { filePath, event: 'add' });
    });

    this.watcher.on('change', async (filePath) => {
      logger.log(`📝 File changed: ${filePath}`);
      await this.eventEmitter.emit('file:changed', { filePath, event: 'change' });
    });

    this.watcher.on('unlink', async (filePath) => {
      logger.log(`➖ File removed: ${filePath}`);
      await this.eventEmitter.emit('file:changed', { filePath, event: 'unlink' });
    });

    logger.log(`✅ File watching started, patterns: ${patterns.join(', ')}`);
  }

  /**
   * 收集所有监听模式
   */
  private collectWatchPatterns(pluginPatterns: string[] = []): string[] {
    const patterns = new Set<string>();

    // 添加插件的监听模式
    for (const pattern of pluginPatterns) {
      patterns.add(pattern);
      logger.log(`🔌 Adding plugin watch pattern: ${pattern}`);
    }

    // 添加脚本文件监听
    for (const [platformId, platformConfig] of Object.entries(this.config.platforms)) {
      if (platformConfig.scripts) {
        for (const script of platformConfig.scripts) {
          // 标准化路径，移除 ./ 前缀
          const normalizedPath = script.path.replace(/^\.\//, '');
          patterns.add(normalizedPath);
          logger.log(`📜 Adding script file watch: ${normalizedPath} (platform: ${platformId})`);
        }
      }
      
      // 添加样式文件监听
      if (platformConfig.styles) {
        for (const style of platformConfig.styles) {
          // 标准化路径，移除 ./ 前缀
          const normalizedPath = style.path.replace(/^\.\//, '');
          patterns.add(normalizedPath);
          logger.log(`🎨 Adding style file watch: ${normalizedPath} (platform: ${platformId})`);
        }
      }
    }

    logger.log(`🎯 Total collected ${patterns.size} watch patterns`);
    return Array.from(patterns);
  }

  /**
   * 使用 minimatch 进行 glob 模式匹配
   */
  matchPattern(filePath: string, pattern: string): boolean {
    const result = minimatch(filePath, pattern);
    return result;
  }

  /**
   * 停止监听
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      logger.log('🛑 File watching stopped');
    }
  }
}