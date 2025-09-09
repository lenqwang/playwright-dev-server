import { readFile } from "fs/promises";
import { resolve } from "path";
import type { Plugin, StyleConfig, PluginContext } from "../types.js";
import type { Page } from "playwright";
import { logger } from '../core/Logger.js';

/**
 * 样式注入插件 - 负责将样式注入到页面中
 */
export function styleInjectionPlugin(): Plugin {
  return {
    name: "style-injection",
    order: 11, // 在脚本注入之后

    async platformReady(platformId, page) {
      const platform = this.config.platforms[platformId];
      if (!platform?.styles?.length) {
        return;
      }

      // 按 order 排序样式
      const sortedStyles = [...platform.styles].sort(
        (a, b) => (a.order || 100) - (b.order || 100)
      );

      for (const style of sortedStyles) {
        if (style.autoInject !== false) {
          if (this.injectStyle) {
            await this.injectStyle(platformId, page, style);
          } else {
            logger.error('injectStyle method not available in plugin context');
          }
        }
      }
    },

    async fileChanged(filePath, event) {
      if (event === "unlink") {
        return;
      }

      // 检查是否是样式文件
      for (const [platformId, platform] of Object.entries(
        this.config.platforms
      )) {
        const style = platform.styles?.find(
          (s) =>
            resolve(this.projectRoot, s.path) ===
            resolve(this.projectRoot, filePath)
        );

        if (style) {
          const page = this.getPage(platformId);
          if (page) {
            if (style.reloadOnChange) {
              // 刷新页面并重新注入所有脚本和样式
              logger.log(
                `🔄 Reloading page for style: ${style.path} (platform: ${platformId})`
              );
              await page.reload();
              
              // 等待页面加载完成
              await page.waitForLoadState('domcontentloaded');
              
              // 重新注入所有脚本和样式
              if (this.reInjectAllAssets) {
                await this.reInjectAllAssets(platformId, page);
              }
            } else if (this.injectStyle) {
              // 替换样式
              logger.log(
                `🎨 Replacing style: ${style.path} for platform: ${platformId}`
              );
              await this.injectStyle(platformId, page, style);
            }
          }
        }
      }
    },
  };
}

// 扩展插件上下文，添加样式注入方法

// 在插件管理器中注入这个方法
export function extendContextWithStyleInjection(context: PluginContext) {
  context.injectStyle = async function (
    platformId: string,
    page: Page,
    style: StyleConfig
  ) {
    try {
      const stylePath = resolve(this.projectRoot, style.path);
      let content = await readFile(stylePath, "utf-8");

      // 执行转换钩子
      content =
        (await this.executeTransformHook?.(
          "transformStyle",
          content,
          style.path,
          platformId
        )) || content;

      // 使用更安全的样式注入方法
      const styleId = `playwright-dev-style-${style.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      await page.evaluate(
        ({ stylePath, styleContent, styleId }) => {
          // Remove existing style with same path
          const existingStyle = document.querySelector(`style[data-playwright-dev-style="${stylePath}"]`);
          if (existingStyle) {
            existingStyle.remove();
          }
          
          // Add new style
          const newStyle = document.createElement('style');
          newStyle.setAttribute('data-playwright-dev-style', stylePath);
          newStyle.id = styleId;
          newStyle.textContent = styleContent;
          document.head.appendChild(newStyle);
        },
        {
          stylePath: style.path,
          styleContent: content,
          styleId: styleId
        }
      );

      // 发射事件
      await this.emit("style:inject", {
        platformId,
        page,
        stylePath: style.path,
        content,
      });

      logger.log(
        `🎨 Injected style: ${style.path} to platform: ${platformId}`
      );
    } catch (error) {
      logger.error(`❌ Failed to inject style ${style.path}:`, error);
    }
  };
}
