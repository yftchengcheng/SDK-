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

// ============================================================
//  Vite HMR 防整页刷新（main.ts 层兜底）
//  index.html 的 dev-guard 已通过 WebSocket 拦截做了一层防护；
//  此处再通过 import.meta.hot 阻断 vite:beforeFullReload 事件，
//  防止 WebSocket 拦截漏掉的场景（如动态创建的 HMR 连接）。
// ============================================================
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', (payload: unknown) => {
    const w = window as unknown as { __devGuard?: { count: () => number; force: () => void } };
    if (typeof w.__devGuard?.force === 'function') {
      console.warn('[main.ts] 收到 vite:beforeFullReload。payload:', payload);
    }
  });
}

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

// ============================================================
//  401 全局跳转监听（解耦循环依赖）
//  - request.ts 不再 import router，改派发 'auth:redirect-login' 事件
//  - 此处统一处理跳转，避免 router ← request ← stores/user 循环
// ============================================================
let redirectingToLogin = false;
window.addEventListener('auth:redirect-login', () => {
  if (redirectingToLogin) return;
  if (router.currentRoute.value.path === '/login') {
    redirectingToLogin = false;
    return;
  }
  redirectingToLogin = true;
  router.replace('/login').finally(() => {
    setTimeout(() => { redirectingToLogin = false; }, 1500);
  });
});

// ============================================================
//  Unhandled Rejection 兜底：屏蔽 Vite HMR WebSocket 在反向代理
//  下"已关闭"导致的 reject 噪音（功能不受影响）。
// ============================================================
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason = event.reason as { message?: string } | null;
  const msg = reason?.message ?? String(reason);
  if (
    msg.includes('WebSocket closed without opened') ||
    msg.includes('WebSocket connection') ||
    msg.includes('@vite/client')
  ) {
    event.preventDefault();
  }
});

app.mount('#app');
