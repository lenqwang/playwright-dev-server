import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Page } from 'playwright';
import type { ScriptConfig, PluginContext } from '../types.js';

export class ScriptInjector {
  private projectRoot: string;
  private context: PluginContext;

  constructor(projectRoot: string, context: PluginContext) {
    this.projectRoot = projectRoot;
    this.context = context;
  }

  /**
   * 注入单个脚本
   */
  async injectScript(page: Page, scriptPath: string, platformId: string): Promise<void> {
    try {
      const fullPath = resolve(this.projectRoot, scriptPath);
      let scriptContent = await readFile(fullPath, 'utf-8');

      // 执行插件的 beforeScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.beforeScriptInject) {
          scriptContent = await plugin.beforeScriptInject(scriptContent, page, this.context);
        }
      }

      await page.evaluate(scriptContent);
      console.log(`✅ 脚本注入成功: ${scriptPath} -> ${platformId}`);

      // 执行插件的 afterScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.afterScriptInject) {
          await plugin.afterScriptInject(page, this.context);
        }
      }
    } catch (error) {
      console.error(`❌ 脚本注入失败: ${scriptPath}`, error);
      throw error;
    }
  }

  /**
   * 按顺序注入多个脚本
   */
  async injectScripts(page: Page, scripts: ScriptConfig[], platformId: string): Promise<void> {
    // 按 order 排序
    const sortedScripts = [...scripts].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const script of sortedScripts) {
      if (script.autoInject !== false) {
        await this.injectScript(page, script.path, platformId);
      }
    }
  }

  /**
   * 移除并重新注入脚本
   */
  async replaceScript(page: Page, scriptPath: string, platformId: string): Promise<void> {
    // 这里可以实现更复杂的脚本替换逻辑
    // 目前简单地重新注入
    await this.injectScript(page, scriptPath, platformId);
  }
}