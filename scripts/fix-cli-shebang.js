#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const cliPath = join('dist', 'cli.js');

try {
  let content = readFileSync(cliPath, 'utf-8');
  
  // 如果还没有 shebang，则添加
  if (!content.startsWith('#!')) {
    content = '#!/usr/bin/env node\n' + content;
    writeFileSync(cliPath, content, 'utf-8');
    console.log('✅ Added shebang to CLI file');
  } else {
    console.log('✅ CLI file already has shebang');
  }
} catch (error) {
  console.error('❌ Failed to fix CLI shebang:', error);
  process.exit(1);
}