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
  .description('Start development server')
  .option('-c, --config <path>', 'Config file path', 'playwright-dev.config.js')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .action(async (options) => {
    try {
      const configPath = resolve(options.root, options.config);
      
      if (!existsSync(configPath)) {
        console.error(chalk.red(`❌ Config file does not exist: ${configPath}`));
        console.log(chalk.yellow('💡 Please create a config file, refer to documentation or use init command'));
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
        console.log(chalk.yellow(`\n🛑 Received ${signal} signal, shutting down server...`));
        await server.stop();
        process.exit(0);
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

      await server.start();
      
      console.log(chalk.green('🎉 Server started successfully! Press Ctrl+C to stop the server'));
      
    } catch (error) {
      console.error(chalk.red('❌ Startup failed:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration file')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .action(async (options) => {
    const { writeFile } = await import('fs/promises');
    const configPath = resolve(options.root, 'playwright-dev.config.js');
    
    if (existsSync(configPath)) {
      console.log(chalk.yellow('⚠️  Config file already exists, skipping creation'));
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
      console.log(chalk.green(`✅ Config file created: ${configPath}`));
      console.log(chalk.blue('💡 Please modify the config file as needed'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to create config file:'), error);
      process.exit(1);
    }
  });

program.parse();