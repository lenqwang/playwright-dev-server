#!/usr/bin/env node

import { rmSync, existsSync } from 'fs';

const distDir = 'dist';

if (existsSync(distDir)) {
  console.log('🧹 Cleaning dist directory...');
  rmSync(distDir, { recursive: true, force: true });
  console.log('✅ Dist directory cleaned');
} else {
  console.log('✅ Dist directory already clean');
}