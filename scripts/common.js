console.log('Common script loaded - version 1.0');
document.body.style.border = '3px solid #007acc';
console.log('🎯 Script loaded successfully - should trigger REPLACE rule');

// 模拟一些配置设置
window.APP_CONFIG = {
  version: '1.0.0',
  debug: true,
  apiUrl: 'https://api.example.com',
  features: {
    darkMode: false,
    notifications: true
  }
};