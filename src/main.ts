console.log('[main.ts] Starting imports...');

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
// 通过 index.css 顶部 @import 引入 EP CSS（见 index.css 第 2 行）
// 原因：viteCssAcceptFix 插件会移除 Accept 中的 text/css，
// 在 main.ts 中直接 import 'element-plus/dist/index.css' 会被 Vite 视为
// JS 模块并注入 &direct 参数返回原始 CSS，浏览器以 ES module 加载会报 SyntaxError。
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './index.css';

console.log('[main.ts] All imports resolved');

const app = createApp(App);

// Register Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(ElementPlus);
app.use(router);

// Global error handler
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', info, err);
};

// Router error handler
router.onError((error: Error) => {
  console.error('[Router Error]', error.message);
});

app.mount('#app');
