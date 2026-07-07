console.log('[main.ts] Starting imports...');

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
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
