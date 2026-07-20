#!/bin/bash
# Build script for production deployment.
# 注意：不要用 --loglevel debug，cold start 时 pnpm install 会输出几十 MB 日志，
#       撑爆 sandbox exec stdout buffer，导致 [build] [runtime_pkg] 阶段
#       "connection closed without exit message" 错误。
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "==> Step 1/4: 清理 public/ 下的 puppeteer 测试截图（保留 logo + favicon + 真实设计稿）"
bash "${COZE_WORKSPACE_PATH}/scripts/cleanup-public-screenshots.sh" || true

echo "==> Step 2/4: 安装依赖（prefer-offline + append-only reporter，规避 sandbox exec stdout 溢出）"
pnpm install --prefer-frozen-lockfile --prefer-offline --reporter=append-only

echo "==> Step 3/4: 构建前端（Vite）"
pnpm vite build

echo "==> Step 4/4: 打包后端（tsup）"
pnpm tsup server/server.ts --format cjs --platform node --target node20 --outDir dist-server --no-splitting --no-minify --external vite

echo "==> Build completed successfully!"
