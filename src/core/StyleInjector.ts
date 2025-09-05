import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Page } from 'playwright';
import type { StyleConfig, PluginContext } from '../types.js';

export class StyleInjector {
  private projectRoot: string;
  private context: PluginContext;

  constructor(projectRoot: string, context: PluginContext) {
    this.projectRoot = projectRoot;
    this.context = context;
  }

  /**
   * 注入单个样式文件
   */
  async injectStyle(page: Page, stylePath: string, platformId: string): Promise<void> {
    try {
      const fullPath = resolve(this.projectRoot, stylePath);
      const styleContent = await readFile(fullPath, 'utf-8');

      // 创建带标识的样式包装器，便于后续热替换
      const wrappedStyle = `
        (function() {
          const styleId = 'dev-style-${stylePath.replace(/[^a-zA-Z0-9]/g, '_')}';
          
          // 创建样式标记
          const styleElement = document.createElement('style');
          styleElement.id = styleId;
          styleElement.setAttribute('data-dev-style', '${stylePath}');
          styleElement.textContent = \`${styleContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
          document.head.appendChild(styleElement);
          
          console.log('🎨 Style injection completed: ${stylePath}');
        })();
      `;

      await page.evaluate(wrappedStyle);
      console.log(`✅ Style injection successful: ${stylePath} -> ${platformId}`);
    } catch (error) {
      console.error(`❌ Style injection failed: ${stylePath}`, error);
      throw error;
    }
  }

  /**
   * 按顺序注入多个样式文件
   */
  async injectStyles(page: Page, styles: StyleConfig[], platformId: string): Promise<void> {
    // 按 order 排序
    const sortedStyles = [...styles].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const style of sortedStyles) {
      if (style.autoInject !== false) {
        await this.injectStyle(page, style.path, platformId);
      }
    }
  }

  /**
   * 移除并重新注入样式（热替换）
   */
  async replaceStyle(page: Page, stylePath: string, platformId: string): Promise<void> {
    try {
      console.log(`🔄 Hot reloading style: ${stylePath} -> ${platformId}`);

      const fullPath = resolve(this.projectRoot, stylePath);
      const styleContent = await readFile(fullPath, 'utf-8');

      // 创建一个包装的样式，支持热替换
      const wrappedStyle = `
        (function() {
          // 移除之前的样式标记（如果存在）
          const styleId = 'dev-style-${stylePath.replace(/[^a-zA-Z0-9]/g, '_')}';
          const existingStyle = document.getElementById(styleId);
          if (existingStyle) {
            existingStyle.remove();
          }
          
          // 创建新的样式标记
          const styleElement = document.createElement('style');
          styleElement.id = styleId;
          styleElement.setAttribute('data-dev-style', '${stylePath}');
          styleElement.textContent = \`${styleContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
          document.head.appendChild(styleElement);
          
          console.log('🔥 Style hot reload completed: ${stylePath}');
        })();
      `;

      await page.evaluate(wrappedStyle);
      console.log(`✅ Style hot reload successful: ${stylePath} -> ${platformId}`);
    } catch (error) {
      console.error(`❌ Style hot reload failed: ${stylePath} -> ${platformId}`, error);
      throw error;
    }
  }
}