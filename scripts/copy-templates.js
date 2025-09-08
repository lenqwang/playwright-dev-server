#!/usr/bin/env node

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// 递归复制目录的函数
function copyDir(src, dest) {
  try {
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src);
    
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
        console.log(`📄 Copied: ${srcPath} → ${destPath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error copying ${src} to ${dest}:`, error);
    process.exit(1);
  }
}

console.log('📁 Copying template files...');
copyDir('templates', 'dist/templates');
console.log('✅ Template files copied successfully!');