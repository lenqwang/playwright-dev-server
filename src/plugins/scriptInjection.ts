import { readFile } from "fs/promises";
import { resolve } from "path";
import type { Plugin, ScriptConfig, PluginContext } from "../types.js";
import type { Page } from "playwright";
import { logger } from '../core/Logger.js';

/**
 * 脚本注入插件 - 负责将脚本注入到页面中
 */
export function scriptInjectionPlugin(): Plugin {
  return {
    name: "script-injection",
    order: 10, // 较早执行

    async platformReady(platformId, page) {
      const platform = this.config.platforms[platformId];
      if (!platform?.scripts?.length) {
        return;
      }

      // 按 order 排序脚本
      const sortedScripts = [...platform.scripts].sort(
        (a, b) => (a.order || 100) - (b.order || 100)
      );

      for (const script of sortedScripts) {
        if (script.autoInject !== false) {
          if (this.injectScript) {
            await this.injectScript(platformId, page, script);
          } else {
            logger.error(
              "injectScript method not available in plugin context"
            );
          }
        }
      }
    },

    async fileChanged(filePath, event) {
      if (event === "unlink") {
        return;
      }

      // 检查是否是脚本文件
      for (const [platformId, platform] of Object.entries(
        this.config.platforms
      )) {
        const script = platform.scripts?.find(
          (s) =>
            resolve(this.projectRoot, s.path) ===
            resolve(this.projectRoot, filePath)
        );

        if (script) {
          const page = this.getPage(platformId);
          if (page) {
            if (script.reloadOnChange) {
              // 刷新页面并重新注入所有脚本和样式
              logger.log(
                `🔄 Reloading page for script: ${script.path} (platform: ${platformId})`
              );
              await page.reload();

              // 等待页面加载完成
              await page.waitForLoadState("domcontentloaded");

              // 重新注入所有脚本和样式
              if (this.reInjectAllAssets) {
                await this.reInjectAllAssets(platformId, page);
              } else {
                logger.error(
                  "reInjectAllAssets method not available in plugin context"
                );
              }
            } else if (this.injectScript) {
              // 替换脚本
              logger.log(
                `🔄 Replacing script: ${script.path} for platform: ${platformId}`
              );
              await this.injectScript(platformId, page, script);
            }
          }
        }
      }
    },
  };
}

// 扩展插件上下文，添加脚本注入方法

// 在插件管理器中注入这个方法
export function extendContextWithScriptInjection(context: PluginContext) {
  context.injectScript = async function (
    platformId: string,
    page: Page,
    script: ScriptConfig
  ) {
    try {
      const scriptPath = resolve(this.projectRoot, script.path);
      let content = await readFile(scriptPath, "utf-8");

      // 执行转换钩子
      content =
        (await this.executeTransformHook?.(
          "transformScript",
          content,
          script.path,
          platformId
        )) || content;

      // 使用更安全的脚本注入方法
      const scriptId = `playwright-dev-script-${script.path.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}`;

      await page.evaluate(
        ({ scriptPath, scriptContent, scriptId }) => {
          // Remove existing script with same path
          const existingScript = document.querySelector(
            `script[data-playwright-dev-script="${scriptPath}"]`
          );
          if (existingScript) {
            existingScript.remove();
          }

          // Add new script
          const newScript = document.createElement("script");
          newScript.setAttribute("data-playwright-dev-script", scriptPath);
          newScript.id = scriptId;
          newScript.textContent = scriptContent;
          document.head.appendChild(newScript);
        },
        {
          scriptPath: script.path,
          scriptContent: content,
          scriptId: scriptId,
        }
      );

      // 发射事件
      await this.emit("script:inject", {
        platformId,
        page,
        scriptPath: script.path,
        content,
      });

      logger.log(
        `✅ Injected script: ${script.path} to platform: ${platformId}`
      );
    } catch (error) {
      logger.error(`❌ Failed to inject script ${script.path}:`, error);
    }
  };

  // 重新注入所有资源的方法
  context.reInjectAllAssets = async function (platformId: string, page: Page) {
    try {
      const platform = this.config.platforms[platformId];
      if (!platform) return;

      logger.log(`🔄 Re-injecting all assets for platform: ${platformId}`);

      // 重新注入所有样式（按顺序）
      if (platform.styles?.length) {
        const sortedStyles = [...platform.styles].sort(
          (a, b) => (a.order || 100) - (b.order || 100)
        );

        for (const style of sortedStyles) {
          if (style.autoInject !== false && this.injectStyle) {
            await this.injectStyle(platformId, page, style);
          }
        }
      }

      // 重新注入所有脚本（按顺序）
      if (platform.scripts?.length) {
        const sortedScripts = [...platform.scripts].sort(
          (a, b) => (a.order || 100) - (b.order || 100)
        );

        for (const script of sortedScripts) {
          if (script.autoInject !== false && this.injectScript) {
            await this.injectScript(platformId, page, script);
          }
        }
      }

      logger.log(`✅ All assets re-injected for platform: ${platformId}`);
    } catch (error) {
      logger.error(
        `❌ Failed to re-inject assets for platform ${platformId}:`,
        error
      );
    }
  };
}
