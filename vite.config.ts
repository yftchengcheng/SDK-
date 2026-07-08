import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

/**
 * 修复 CDN/代理层对 .vue CSS 模块的错误处理。
 *
 * 根因：CDN 层（volc-dcdn）拦截 URL 含 `type=style` 的请求，
 * 将 Vite 编译后的 JS 模块响应体替换为原始 CSS，
 * 浏览器以 ES module 加载时解析 CSS 报 SyntaxError。
 *
 * 修复：移除所有 <style scoped>，改用全局 CSS（见 index.css）。
 * 此插件仅做防御性清理——移除 Accept 头中的 text/css，
 * 防止 Vite 对 index.css 等 CSS 模块注入 &direct 参数。
 */
function viteCssAcceptFix(): Plugin {
  return {
    name: 'vite-css-accept-fix',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        // 移除 Accept 头中的 text/css，防止 Vite 注入 &direct 参数返回原始 CSS
        const accept = req.headers.accept;
        if (accept && accept.includes('text/css')) {
          req.headers.accept = accept.replace(/text\/css,?\s*/g, '').replace(/,\s*$/, '');
          if (!req.headers.accept || req.headers.accept.trim() === '') {
            req.headers.accept = '*/*';
          }
        }
        next();
      });
    },
  };
}

/**
 * 禁用 Vite HMR 自动全页刷新。
 *
 * 根因：Vite 默认 HMR 会在以下场景调用 location.reload()：
 *   1. 收到来自服务端的 'full-reload' 消息（非 HMR 边界模块变更）
 *   2. HMR WebSocket 断线后重连（沙箱代理环境下 WebSocket 立即被关闭）
 *   3. 编译错误叠加首屏
 *   4. 连接超时（默认 120s）→ pageReload() 直接调用 location.reload()
 * 这些场景在 tsx watch 重启后端 / 长时间无操作时会出现「页面莫名刷新」。
 *
 * 解决：彻底关闭 HMR（server.hmr: false），同时保留 overlay 关闭配置。
 *       index.html 仍保留 unhandledrejection 过滤器作为防御。
 *       后续代码更新需要用户手动刷新（按 F5 或点击右下角 ⟳）。
 */
function disableHmrFullReload(): Plugin {
  return {
    name: 'disable-hmr-full-reload',
    config(_, { command }) {
      if (command === 'serve') {
        return {
          server: {
            hmr: false,  // 彻底关闭 HMR WebSocket，从根源消除断线/超时触发的 reload
          },
        };
      }
      return {};
    },
  };
}

export default defineConfig({
  plugins: [vue(), viteCssAcceptFix(), disableHmrFullReload()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    // 在沙箱/反向代理环境下，HMR WebSocket 经过外网代理会立即被关闭（报
    // `[Unhandled Rejection] WebSocket closed without opened.`）。开发时
    // 用 tsx watch + Vite 静态服务的热更已经够用，HMR 可由浏览器原生刷新
    // 兜底；显式禁用以消除控制台错误。
    hmr: false,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'no-store',
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
