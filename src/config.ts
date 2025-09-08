import type { DevServerConfig } from './types.js';

/**
 * 定义配置的辅助函数，类似 Vite 的 defineConfig
 */
export function defineConfig(config: DevServerConfig): DevServerConfig {
  return config;
}

/**
 * 默认配置
 */
export const defaultConfig: Partial<DevServerConfig> = {
  browserOptions: {
    headless: false,
    devtools: true,
  },
  plugins: [],
};