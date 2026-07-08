// ABOUTME: Vite integration for Express server
// ABOUTME: Handles dev middleware and production static file serving

import type { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer, type ViteDevServer } from 'vite';

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';

let viteDevServer: ViteDevServer | null = null;

/**
 * 集成 Vite 开发服务器（中间件模式）
 * HMR 已禁用（沙箱代理环境兼容），代码更新通过 tsx watch 自动重启后端
 */
export async function setupViteMiddleware(app: Application) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      // 沙箱代理环境下 WebSocket 立即被关闭，HMR 会触发页面整页刷新；
      // 彻底禁用以保证页面稳定。代码更新通过 tsx watch 自动重启后端。
      hmr: false,
    },
    appType: 'spa',
    root: process.cwd(),
  });

  viteDevServer = vite;

  // Only use Vite middleware for non-API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip API routes - let Express handle them
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    // 对 .vue/.ts/.css 等模块禁用缓存（开发态下内容经常变），
    // 但对 index.html 等静态资源允许 30s 内存缓存，显著提升页面刷新速度
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=30');
    }

    // Let Vite handle everything else (static files, HMR, etc.)
    vite.middlewares(req, res, next);
  });

  console.log('Vite dev server initialized (HMR disabled for proxy compatibility)');
}

/**
 * 设置生产环境静态文件服务
 */
export function setupStaticServer(app: Application) {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }

  // 1. 服务静态文件（如果存在对应文件则直接返回）
  app.use(express.static(distPath));

  // 2. SPA fallback - 所有未处理的请求返回 index.html
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('Serving static files from dist/');
}

/**
 * 根据环境设置 Vite
 */
export async function setupVite(app: Application) {
  if (isDev) {
    await setupViteMiddleware(app);
  } else {
    setupStaticServer(app);
  }
}

/**
 * 获取 Vite 开发服务器实例
 */
export function getViteDevServer(): ViteDevServer | null {
  return viteDevServer;
}
