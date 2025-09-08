import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Handlebars 模板编译器
 */
export class TemplateCompiler {
  /**
   * 编译模板
   */
  static compile(template: string, data: any): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  }

  /**
   * 从文件加载并编译模板
   */
  static async compileFromFile(templatePath: string, data: any): Promise<string> {
    try {
      const template = await readFile(templatePath, 'utf-8');
      return this.compile(template, data);
    } catch (error) {
      throw new Error(`Failed to load template from ${templatePath}: ${error}`);
    }
  }
}

/**
 * 获取默认配置模板数据
 */
export function getDefaultTemplateData(): any {
  const platforms = {
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
  };

  // 转换为数组格式以便在模板中使用
  const platformsArray = Object.entries(platforms).map(([key, value]) => ({
    key,
    ...value
  }));

  return {
    platforms,
    platformsArray,
    builtinPlugins: [
      'consoleLoggerPlugin',
      'autoReloadPlugin'
    ],
    browserOptions: {
      headless: false,
      devtools: true,
    }
  };
}

/**
 * 获取模板文件路径
 */
export function getTemplatePath(templateName: string): string {
  const templateMap: Record<string, string> = {
    'default': 'config.js.hbs',
    'minimal': 'minimal.js.hbs',
    'advanced': 'advanced.js.hbs'
  };
  
  const fileName = templateMap[templateName] || templateMap['default'];
  
  // 检测是否在开发环境（src 目录）还是生产环境（dist 目录）
  const isDev = __dirname.includes('src');
  
  let templatesDir: string;
  if (isDev) {
    // 开发环境: src/utils -> ../../templates
    templatesDir = resolve(__dirname, '../../templates');
  } else {
    // 生产环境: dist/utils -> ../templates (模板文件在 dist/templates)
    templatesDir = resolve(__dirname, '../templates');
  }
    
  return resolve(templatesDir, fileName);
}

/**
 * 获取可用的模板列表
 */
export function getAvailableTemplates(): string[] {
  return ['default', 'minimal', 'advanced'];
}