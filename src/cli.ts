import { Command } from "commander";
import { resolve } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import { PlaywrightDevServer } from "./PlaywrightDevServer.js";
import type { DevServerConfig } from "./types.js";

const program = new Command();

program
  .name("playwright-dev")
  .description("Playwright Development Server for script injection")
  .version("1.0.0");

program
  .command("start")
  .description("Start development server")
  .option("-c, --config <path>", "Config file path", "playwright-dev.config.js")
  .option("-r, --root <path>", "Project root directory", process.cwd())
  .action(async (options) => {
    try {
      const configPath = resolve(options.root, options.config);

      if (!existsSync(configPath)) {
        console.error(
          chalk.red(`❌ Config file does not exist: ${configPath}`)
        );
        console.log(
          chalk.yellow(
            "💡 Please create a config file, refer to documentation or use init command"
          )
        );
        process.exit(1);
      }

      console.log(chalk.blue(`📖 Loading config file: ${configPath}`));

      // 动态导入配置文件
      const configModule = await import(`file://${configPath}`);
      const config: DevServerConfig = configModule.default || configModule;

      // 创建并启动服务器
      const server = new PlaywrightDevServer(config, options.root);

      // 设置信号处理
      const gracefulShutdown = async (signal: string) => {
        console.log(
          chalk.yellow(
            `\n🛑 Received ${signal} signal, shutting down server...`
          )
        );
        await server.stop();
        process.exit(0);
      };

      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

      await server.start();

      console.log(
        chalk.green(
          "🎉 Server started successfully! Press Ctrl+C to stop the server"
        )
      );
    } catch (error) {
      console.error(chalk.red("❌ Startup failed:"), error);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize configuration file")
  .option("-r, --root <path>", "Project root directory", process.cwd())
  .option("-t, --template <name>", "Template name to use", "default")
  .option("--platform-name <name>", "Platform name", "Example Platform")
  .option("--platform-url <url>", "Platform URL", "https://example.com")
  .action(async (options) => {
    const { writeFile } = await import("fs/promises");
    const {
      TemplateCompiler,
      getDefaultTemplateData,
      getTemplatePath,
      getAvailableTemplates,
    } = await import("./utils/templateCompiler.js");

    const configPath = resolve(options.root, "playwright-dev.config.js");

    if (existsSync(configPath)) {
      console.log(
        chalk.yellow("⚠️  Config file already exists, skipping creation")
      );
      return;
    }

    try {
      // 验证模板名称
      const availableTemplates = getAvailableTemplates();
      if (!availableTemplates.includes(options.template)) {
        console.error(chalk.red(`❌ Invalid template: ${options.template}`));
        console.log(
          chalk.yellow(
            `💡 Available templates: ${availableTemplates.join(", ")}`
          )
        );
        process.exit(1);
      }

      console.log(
        chalk.blue(
          `📝 Generating configuration file from template: ${options.template}...`
        )
      );

      // 获取模板数据
      const templateData = getDefaultTemplateData();

      // 自定义平台配置
      if (
        options.platformName !== "Example Platform" ||
        options.platformUrl !== "https://example.com"
      ) {
        templateData.platforms.example.name = options.platformName;
        templateData.platforms.example.url = options.platformUrl;

        // 同时更新数组格式的数据
        templateData.platformsArray[0].name = options.platformName;
        templateData.platformsArray[0].url = options.platformUrl;
      }

      // 获取模板路径
      const templatePath = getTemplatePath(options.template);

      // 编译模板
      const configContent = await TemplateCompiler.compileFromFile(
        templatePath,
        templateData
      );

      // 写入配置文件
      await writeFile(configPath, configContent, "utf-8");

      console.log(chalk.green(`✅ Config file created: ${configPath}`));
      console.log(chalk.blue("💡 Configuration details:"));
      console.log(chalk.gray(`   Template: ${options.template}`));
      console.log(
        chalk.gray(`   Platform: ${templateData.platforms.example.name}`)
      );
      console.log(chalk.gray(`   URL: ${templateData.platforms.example.url}`));
      console.log(chalk.blue("💡 Please modify the config file as needed"));
    } catch (error) {
      console.error(chalk.red("❌ Failed to create config file:"), error);

      // 如果模板编译失败，回退到硬编码模板
      console.log(chalk.yellow("⚠️  Falling back to built-in template..."));

      const fallbackTemplate = `import { defineConfig, consoleLoggerPlugin, autoReloadPlugin } from 'playwright-dev-server';

export default defineConfig({
  platforms: {
    example: {
      name: '${options.platformName}',
      url: '${options.platformUrl}',
      scripts: [
        {
          path: './scripts/example.js',
          order: 1,
          autoInject: true,
        }
      ],
      styles: [
        {
          path: './assets/style.css',
          order: 1,
          autoInject: true,
        }
      ],
      browserOptions: {
        viewport: { width: 1280, height: 720 }
      }
    }
  },
  
  plugins: [
    consoleLoggerPlugin(),
    autoReloadPlugin(),
  ],
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});
`;

      try {
        await writeFile(configPath, fallbackTemplate, "utf-8");
        console.log(
          chalk.green(
            `✅ Config file created with fallback template: ${configPath}`
          )
        );
      } catch (fallbackError) {
        console.error(
          chalk.red("❌ Failed to create config file with fallback template:"),
          fallbackError
        );
        process.exit(1);
      }
    }
  });

program
  .command("list-templates")
  .description("List available configuration templates")
  .action(async () => {
    const { getAvailableTemplates } = await import(
      "./utils/templateCompiler.js"
    );

    console.log(chalk.blue("📋 Available configuration templates:"));
    console.log("");

    const templates = getAvailableTemplates();
    const descriptions: Record<string, string> = {
      default: "Standard configuration with built-in plugins and examples",
      minimal: "Minimal configuration with basic platform setup",
      advanced:
        "Advanced configuration with performance monitoring and error handling",
    };

    templates.forEach((template) => {
      console.log(
        chalk.green(
          `  ${template.padEnd(12)} - ${
            descriptions[template] || "Custom template"
          }`
        )
      );
    });

    console.log("");
    console.log(chalk.gray("Usage: playwright-dev init --template <name>"));
  });

program.parse();
