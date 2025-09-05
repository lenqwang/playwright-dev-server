import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { PlaywrightDevServer } from './PlaywrightDevServer.js';
import type { DevServerConfig } from './types.js';

const program = new Command();

program
  .name('playwright-dev')
  .description('Playwright Development Server for script injection')
  .version('1.0.0');

program
  .command('start')
  .description('启动开发服务器')
  .option('-c, --config <path>', '配置文件路径', 'playwright-dev.config.js')
  .option('-r, --root <path>', '项目根目录', process.cwd())
  .action(async (options) => {
    try {
      const configPath = resolve(options.root, options.config);
      
      if (!existsSync(configPath)) {
        console.error(chalk.red(`❌ 配置文件不存在: ${configPath}`));
        console.log(chalk.yellow('💡 请创建配置文件，参考文档或使用 init 命令'));
        process.exit(1);
      }

      console.log(chalk.blue(`📖 加载配置文件: ${configPath}`));
      
      // 动态导入配置文件
      const configModule = await import(`file://${configPath}`);
      const config: DevServerConfig = configModule.default || configModule;

      // 创建并启动服务器
      const server = new PlaywrightDevServer(config, options.root);
      
      // 设置信号处理
      const gracefulShutdown = async (signal: string) => {
        console.log(chalk.yellow(`\n🛑 收到 ${signal} 信号，正在关闭服务器...`));
        await server.stop();
        process.exit(0);
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

      await server.start();
      
      console.log(chalk.green('🎉 服务器启动成功！按 Ctrl+C 停止服务器'));
      
    } catch (error) {
      console.error(chalk.red('❌ 启动失败:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('初始化配置文件')
  .option('-r, --root <path>', '项目根目录', process.cwd())
  .action(async (options) => {
    const { writeFile } = await import('fs/promises');
    const configPath = resolve(options.root, 'playwright-dev.config.js');
    
    if (existsSync(configPath)) {
      console.log(chalk.yellow('⚠️  配置文件已存在，跳过创建'));
      return;
    }

    const configTemplate = `import { defineConfig } from 'playwright-dev-server';

export default defineConfig({
  platforms: {
    example: {
      name: 'Example Platform',
      url: 'https://example.com',
      scripts: [
        {
          path: './scripts/example.js',
          order: 1,
          autoInject: true,
        }
      ],
      browserOptions: {
        viewport: { width: 1280, height: 720 }
      }
    }
  },
  
  watchRules: [
    {
      pattern: 'scripts/**/*.js',
      action: 'replace'
    },
    {
      pattern: 'config/**/*',
      action: 'reload'
    }
  ],
  
  plugins: [
    // 在这里添加插件
  ],
  
  browserOptions: {
    headless: false,
    devtools: true,
  }
});
`;

    try {
      await writeFile(configPath, configTemplate, 'utf-8');
      console.log(chalk.green(`✅ 配置文件已创建: ${configPath}`));
      console.log(chalk.blue('💡 请根据需要修改配置文件'));
    } catch (error) {
      console.error(chalk.red('❌ 创建配置文件失败:'), error);
      process.exit(1);
    }
  });

program.parse();