#!/usr/bin/env bash
# ============================================================================
# 清理 public/ 下的 puppeteer 截图与测试报告，避免污染生产 dist
#
# 保留：
#   - public/logo.png          品牌 logo
#   - public/favicon.ico       浏览器 favicon
#   - public/favicon.svg       浏览器 favicon (SVG 版)
#   - public/sdk-*.png         业务内联引用的资源（如有）
#
# 删除：
#   - public/architecture/     设计稿（22M）— 不在 src/ 引用
#   - public/sdk-screenshots/  设计参考（11M）— 不在 src/ 引用
#   - public/report_*.html     puppeteer 报告
#   - public/__*.png           puppeteer 中间帧
#   - public/{behavior,funnel,value,now,bind,test,recon,snap,msg,dashboard,inbox,logout,nam,table,api-ytad,admin-privacy,admin-sdk,docs,login-title,metric-picker,page-*}-*.png
#                           各种 puppeteer 截图（保留前缀模式识别）
#
# 思路：白名单 logo/favicon/sdk- 开头 + 黑名单 architecture/sdk-screenshots/。
# 其它未识别前缀的 png/html 一律当作测试产物删除。
# ============================================================================

set -euo pipefail

PUBLIC_DIR="${1:-/workspace/projects/public}"

if [ ! -d "$PUBLIC_DIR" ]; then
  echo "[cleanup-public] $PUBLIC_DIR 不存在，跳过"
  exit 0
fi

cd "$PUBLIC_DIR"

# 1. 整目录删除（设计参考 + 截图报告）
for dir in architecture sdk-screenshots; do
  if [ -d "$dir" ]; then
    size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "[cleanup-public] 删除目录 $dir/ ($size)"
    rm -rf "$dir"
  fi
done

# 2. 删除顶层 report_*.html
if ls report_*.html 1>/dev/null 2>&1; then
  echo "[cleanup-public] 删除 $(ls report_*.html | wc -l) 个 report_*.html"
  rm -f report_*.html
fi

# 3. 删除顶层 puppeteer 截图（保留白名单）
#    白名单：logo.png, favicon.*, sdk-* 开头（业务内联资源）
removed_count=0
for f in *.png; do
  [ -f "$f" ] || continue
  case "$f" in
    logo.png|favicon.*|sdk-*)
      # 保留
      ;;
    *)
      rm -f "$f"
      removed_count=$((removed_count + 1))
      ;;
  esac
done
echo "[cleanup-public] 删除 $removed_count 个非白名单 .png"

# 4. 顶层其它 .html（非 design 稿）
for f in *.html; do
  [ -f "$f" ] || continue
  rm -f "$f"
  echo "[cleanup-public] 删除 $f"
done

echo "[cleanup-public] 完成，public/ 剩余："
ls -la "$PUBLIC_DIR" | tail -n +2
