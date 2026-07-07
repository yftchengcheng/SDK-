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
 *   2. HMR WebSocket 断线后重连
 *   3. 编译错误叠加首屏
 * 这些场景在 tsx watch 重启后端 / 长时间无操作时会出现「页面莫名刷新」。
 *
 * 解决：移除 HMR overlay（不再因首屏错误触发 reload）；
 *       通过 index.html 注入的 client-hmr-guard 拦截 HMR WebSocket 消息
 *       并阻断 location.reload() 调用路径。
 */
function disableHmrFullReload(): Plugin {
  return {
    name: 'disable-hmr-full-reload',
    config(_, { command }) {
      if (command === 'serve') {
        return {
          server: {
            hmr: {
              overlay: false,
              clientPort: 5000,
            },
          },
        };
      }
      return {};
    },
    configureServer(server) {
      // 拦截 HMR 全局错误事件，阻止 Vite 客户端触发 reload
      server.middlewares.use('/__hmr_disable_reload', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain');
        res.end('ok');
      });
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
