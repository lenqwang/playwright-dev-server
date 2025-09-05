import chokidar, { type FSWatcher } from 'chokidar';
import { resolve } from 'path';
import { minimatch } from 'minimatch';
import type { FileWatchRule, PluginContext } from '../types.js';
import { PageManager } from './PageManager.js';

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private projectRoot: string;
  private pageManager: PageManager;
  private context: PluginContext;
  private watchRules: FileWatchRule[];

  constructor(
    projectRoot: string,
    pageManager: PageManager,
    context: PluginContext,
    watchRules: FileWatchRule[] = []
  ) {
    this.projectRoot = projectRoot;
    this.pageManager = pageManager;
    this.context = context;
    this.watchRules = watchRules;
  }

  /**
   * 开始监听文件变化
   */
  startWatching(): void {
    console.log('👀 Starting to watch file changes...');

    // 收集所有需要监听的文件模式
    const patterns = this.collectWatchPatterns();
    
    if (patterns.length === 0) {
      console.log('⚠️  No file patterns found to watch');
      return;
    }

    this.watcher = chokidar.watch(patterns, {
      cwd: this.projectRoot,
      ignoreInitial: true,
      persistent: true,
    });

    this.watcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      await this.handleFileChange(filePath);
    });

    console.log(`✅ File watching started, patterns: ${patterns.join(', ')}`);
  }

  /**
   * 收集所有监听模式
   */
  private collectWatchPatterns(): string[] {
    const patterns = new Set<string>();

    // 添加全局监听规则
    for (const rule of this.watchRules) {
      patterns.add(rule.pattern);
      console.log(`📋 Adding global watch rule: ${rule.pattern}`);
    }

    // 添加插件的监听规则
    for (const plugin of this.context.config.plugins || []) {
      if (plugin.watchRules) {
        for (const rule of plugin.watchRules) {
          patterns.add(rule.pattern);
          console.log(`🔌 Adding plugin watch rule: ${rule.pattern} (from plugin: ${plugin.name})`);
        }
      }
    }

    // 添加脚本文件监听
    for (const [platformId, platformConfig] of Object.entries(this.context.config.platforms)) {
      for (const script of platformConfig.scripts) {
        // 标准化路径，移除 ./ 前缀
        const normalizedPath = script.path.replace(/^\.\//, '');
        patterns.add(normalizedPath);
        console.log(`📜 Adding script file watch: ${normalizedPath} (platform: ${platformId})`);
      }
    }

    console.log(`🎯 Total collected ${patterns.size} watch patterns`);
    return Array.from(patterns);
  }

  /**
   * 处理文件变化
   */
  private async handleFileChange(filePath: string): Promise<void> {
    const fullPath = resolve(this.projectRoot, filePath);
    console.log(`🔍 Processing file change: ${filePath} (full path: ${fullPath})`);

    // 查找匹配的规则
    const matchedRules = this.findMatchingRules(filePath);
    console.log(`📏 Found ${matchedRules.length} matching rules`);

    if (matchedRules.length > 0) {
      // 有匹配的规则，执行规则
      for (const rule of matchedRules) {
        console.log(`⚡ Executing rule: ${rule.action} (pattern: ${rule.pattern})`);
        await this.executeRule(rule, filePath);
      }
    } else {
      // 没有匹配的规则，检查是否为脚本文件（默认行为）
      console.log(`🎯 No matching rules, checking if it's a script file`);
      await this.handleScriptFileChange(filePath);
    }
  }

  /**
   * 查找匹配的监听规则
   */
  private findMatchingRules(filePath: string): FileWatchRule[] {
    const rules: FileWatchRule[] = [];

    // 检查全局规则
    for (const rule of this.watchRules) {
      if (this.matchPattern(filePath, rule.pattern)) {
        rules.push(rule);
      }
    }

    // 检查插件规则
    for (const plugin of this.context.config.plugins || []) {
      if (plugin.watchRules) {
        for (const rule of plugin.watchRules) {
          if (this.matchPattern(filePath, rule.pattern)) {
            rules.push(rule);
          }
        }
      }
    }

    return rules;
  }

  /**
   * 执行监听规则
   */
  private async executeRule(rule: FileWatchRule, filePath: string): Promise<void> {
    switch (rule.action) {
      case 'reload':
        await this.reloadAllPages();
        break;
      case 'replace':
        await this.replaceScript(filePath);
        break;
      case 'custom':
        if (rule.handler) {
          // 对所有页面执行自定义处理
          for (const [platformId, page] of this.pageManager['pages']) {
            await rule.handler(filePath, page, this.context);
          }
        }
        break;
    }
  }

  /**
   * 处理脚本文件变化（默认行为）
   */
  private async handleScriptFileChange(filePath: string): Promise<void> {
    // 查找哪些平台使用了这个脚本
    const affectedPlatforms: string[] = [];

    for (const [platformId, platformConfig] of Object.entries(this.context.config.platforms)) {
      for (const script of platformConfig.scripts) {
        // 标准化路径进行比较，移除 ./ 前缀
        const normalizedScriptPath = script.path.replace(/^\.\//, '');
        const normalizedFilePath = filePath.replace(/^\.\//, '');
        
        if (normalizedScriptPath === normalizedFilePath) {
          affectedPlatforms.push(platformId);
          break;
        }
      }
    }

    if (affectedPlatforms.length > 0) {
      console.log(`🔄 替换脚本: ${filePath} (影响平台: ${affectedPlatforms.join(', ')})`);
      await this.replaceScript(filePath);
    } else {
      console.log(`⚠️  脚本文件 ${filePath} 没有被任何平台使用`);
    }
  }

  /**
   * 重新加载所有页面
   */
  private async reloadAllPages(): Promise<void> {
    console.log('🔄 重新加载所有页面...');
    await this.pageManager.reloadAllScripts();
  }

  /**
   * 替换脚本
   */
  private async replaceScript(scriptPath: string): Promise<void> {
    for (const [platformId, page] of this.pageManager['pages']) {
      const platformConfig = this.context.config.platforms[platformId];
      
      // 标准化路径进行比较
      const normalizedScriptPath = scriptPath.replace(/^\.\//, '');
      const script = platformConfig?.scripts.find(s => {
        const normalizedConfigPath = s.path.replace(/^\.\//, '');
        return normalizedConfigPath === normalizedScriptPath;
      });
      
      if (script) {
        await this.context.scriptInjector.replaceScript(page, scriptPath, platformId);
      }
    }
  }

  /**
   * 使用 minimatch 进行 glob 模式匹配
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    const result = minimatch(filePath, pattern);
    console.log(`🔍 Pattern matching: "${filePath}" vs "${pattern}" = ${result}`);
    return result;
  }

  /**
   * 停止监听
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('🛑 文件监听已停止');
    }
  }
}