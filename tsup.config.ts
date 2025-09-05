import { defineConfig } from 'tsup';

export default defineConfig([
  // 主入口文件
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    shims: true,
  },
  // CLI 文件
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);