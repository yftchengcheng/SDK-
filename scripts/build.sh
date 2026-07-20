#!/bin/bash
# Build script for production deployment.
# 注意：不要用 --loglevel debug，cold start 时 pnpm install 会输出几十 MB 日志，
#       撑爆 sandbox exec stdout buffer，导致 [build] [runtime_pkg] 阶段
#       "connection closed without exit message" 错误。
#
# 依赖修剪（pnpm prune --prod）必须在 tsup 之后跑，理由：
#   - tsup / tsx / @types/* / eslint / vue-tsc / typescript / puppeteer /
#     typescript-eslint / tailwindcss / postcss / autoprefixer 等都是 devDep；
#   - 但 vite build 跑前端构建、tsup 打包后端用到了其中一些；
#   - 必须在 tsup 完成后才安全删除 devDeps（pnpm 9+ 会自动保留 prod 链上可达子依赖）；
#   - 这样 runtime 镜像 node_modules 体积从 419M → ~200M，避免 sandbox exec OOM/超时。
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "==> Step 1/5: 清理 public/ 下的 puppeteer 测试截图（保留 logo + favicon + 真实设计稿）"
bash "${COZE_WORKSPACE_PATH}/scripts/cleanup-public-screenshots.sh" || true

echo "==> Step 2/5: 安装依赖（prefer-offline + append-only reporter，规避 sandbox exec stdout 溢出）"
# PUPPETEER_SKIP_DOWNLOAD=true：跳过 puppeteer postinstall 的 chromium 下载（沙箱网络常失败，
# 且 prod runtime 不用 puppeteer；chromium 240M+ 完全没意义）。puppeteer 仍装包但跳过二进制下载。
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
pnpm install --prefer-frozen-lockfile --prefer-offline --reporter=append-only

echo "==> Step 3/5: 构建前端（Vite）"
pnpm vite build

echo "==> Step 4/5: 打包后端（tsup）"
pnpm tsup server/server.ts --format cjs --platform node --target node20 --outDir dist-server --no-splitting --no-minify --external vite

echo "==> Step 5/5: 删除 devDeps + 前端 prod 包（runtime 镜像瘦身 200M+）"
# 第一步：pnpm prune --prod 删 devDeps（保留 prod 可达子依赖）
pnpm prune --prod --reporter=append-only

# 第二步：手动删除纯前端库（prod server 实际不 require，dist/ 已 build 进编译产物）
# prod server 实际 require 列表（共 ~130 个外部包）已验证，保留：
#   - 核心：axios / coze-coding-dev-sdk / express / jsonwebtoken / bcryptjs / cookie-parser / node-cache / vite
#   - vite 链：rollup / jiti / tslib / tsconfck / @rollup+rollup-linux-x64-gnu / esbuild
#   - langchain/openai/js-tiktoken/zod/langsmith/pg 等
# 删除（纯前端，prod server 不 require，dist/ 已编译进 9M）：
for pkg in vue pinia vue-router dayjs dotenv echarts element-plus @element-plus icons-vue markdown-it sortablejs vue-echarts xlsx cors uuid; do
    rm -rf "node_modules/${pkg}" 2>/dev/null || true
done

# 第三步：删除这些纯前端包对应的 .pnpm 物理目录（彻底清理）
# 注意：必须**只**删前端库的物理目录，**不能动** vite/supabase/langchain/openai 等链上的子依赖
# 验证清单：每个要删的 .pnpm 目录必须不在 prod require 链上
for pkg_name in \
    "vue" \
    "pinia" \
    "vue-router" \
    "dayjs" \
    "dotenv" \
    "echarts" \
    "element-plus" \
    "@element-plus+icons-vue" \
    "markdown-it" \
    "markdown-it@" \
    "sortablejs" \
    "vue-echarts" \
    "xlsx" \
    "cors" \
    "uuid" \
    "zrender" \
    "codepage"; do
    rm -rf "node_modules/.pnpm/${pkg_name}@"* 2>/dev/null || true
done

# ⚠️ 不能删的（prod require 链上）：
#   - vite 链：rollup / jiti / tslib / tsconfck / @rollup+rollup-linux-x64-gnu / esbuild
#   - langchain 链：@cfworker+json-schema / @langchain+core / @langchain+openai
#                  / js-tiktoken / openai / zod / langsmith / lodash
#   - supabase 链：tslib / @supabase+* / postgres-*
#   - pg 链：pg / pg-pool / pg-types / pg-connection-string / pg-int8 / pg-protocol
#   - axios 链：form-data / follow-redirects / https-proxy-agent / asynckit / combined-stream / delayed-stream
#   - fsevents / bcryptjs / jsonwebtoken / jws / jwa / ecdsa-sig-formatter 等

echo "==> Step 5b/5: 显示剩余 node_modules 大小（应 < 200M）"
du -sh node_modules

echo "==> Build completed successfully!"
