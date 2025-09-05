// 配置文件 - 修改此文件应该触发页面重载
console.log('Config loaded - this should trigger page reload when changed');

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

console.log('App config initialized:', window.APP_CONFIG);