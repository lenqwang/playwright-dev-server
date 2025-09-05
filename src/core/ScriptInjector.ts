import { readFile } from "fs/promises";
import { resolve } from "path";
import type { Page } from "playwright";
import type { ScriptConfig, PluginContext } from "../types.js";

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
  async injectScript(
    page: Page,
    scriptPath: string,
    platformId: string
  ): Promise<void> {
    try {
      const fullPath = resolve(this.projectRoot, scriptPath);
      let scriptContent = await readFile(fullPath, "utf-8");

      // 执行插件的 beforeScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.beforeScriptInject) {
          scriptContent = await plugin.beforeScriptInject(
            scriptContent,
            page,
            this.context
          );
        }
      }

      // 创建带标识的脚本包装器，便于后续热替换
      const wrappedScript = `
        (function() {
          const scriptId = 'dev-script-${scriptPath.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}';
          
          // 创建脚本标记
          const scriptElement = document.createElement('script');
          scriptElement.id = scriptId;
          scriptElement.setAttribute('data-dev-script', '${scriptPath}');
          scriptElement.textContent = \`${scriptContent
            .replace(/`/g, "\\`")
            .replace(/\$/g, "\\$")}\`;
          document.head.appendChild(scriptElement);
          
          // 执行脚本内容
          try {
            ${scriptContent}
          } catch (error) {
            console.error('Script execution error:', error);
          }
          
          console.log('📜 Script injection completed: ${scriptPath}');
        })();
      `;

      await page.evaluate(wrappedScript);
      console.log(`✅ Script injection successful: ${scriptPath} -> ${platformId}`);

      // 执行插件的 afterScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.afterScriptInject) {
          await plugin.afterScriptInject(page, this.context);
        }
      }
    } catch (error) {
      console.error(`❌ Script injection failed: ${scriptPath}`, error);
      throw error;
    }
  }

  /**
   * 按顺序注入多个脚本
   */
  async injectScripts(
    page: Page,
    scripts: ScriptConfig[],
    platformId: string
  ): Promise<void> {
    // 按 order 排序
    const sortedScripts = [...scripts].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    for (const script of sortedScripts) {
      if (script.autoInject !== false) {
        await this.injectScript(page, script.path, platformId);
      }
    }
  }

  /**
   * 移除并重新注入脚本（热替换，不刷新页面）
   */
  async replaceScript(
    page: Page,
    scriptPath: string,
    platformId: string
  ): Promise<void> {
    try {
      console.log(`🔄 Hot reloading script: ${scriptPath} -> ${platformId}`);

      const fullPath = resolve(this.projectRoot, scriptPath);
      let scriptContent = await readFile(fullPath, "utf-8");

      // 执行插件的 beforeScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.beforeScriptInject) {
          scriptContent = await plugin.beforeScriptInject(
            scriptContent,
            page,
            this.context
          );
        }
      }

      // 创建一个包装的脚本，支持热替换
      const wrappedScript = `
        (function() {
          // 移除之前的脚本标记（如果存在）
          const scriptId = 'dev-script-${scriptPath.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}';
          const existingScript = document.getElementById(scriptId);
          if (existingScript) {
            existingScript.remove();
          }
          
          // 创建新的脚本标记
          const scriptElement = document.createElement('script');
          scriptElement.id = scriptId;
          scriptElement.setAttribute('data-dev-script', '${scriptPath}');
          scriptElement.textContent = \`${scriptContent
            .replace(/`/g, "\\`")
            .replace(/\$/g, "\\$")}\`;
          document.head.appendChild(scriptElement);
          
          // 立即执行脚本内容
          try {
            ${scriptContent}
          } catch (error) {
            console.error('Script execution error:', error);
          }
          
          console.log('🔥 Script hot reload completed: ${scriptPath}');
        })();
      `;

      await page.evaluate(wrappedScript);
      console.log(`✅ Script hot reload successful: ${scriptPath} -> ${platformId}`);

      // 执行插件的 afterScriptInject 钩子
      for (const plugin of this.context.config.plugins || []) {
        if (plugin.afterScriptInject) {
          await plugin.afterScriptInject(page, this.context);
        }
      }
    } catch (error) {
      console.error(`❌ Script hot reload failed: ${scriptPath} -> ${platformId}`, error);
      throw error;
    }
  }
}
