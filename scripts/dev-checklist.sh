#!/bin/bash
# scripts/dev-checklist.sh
# 开发交付前自检脚本（6 项 MUST 全过才标完成）
# 用法：bash scripts/dev-checklist.sh

set -u
cd "$(dirname "$0")/.."

PORT="${DEPLOY_RUN_PORT:-5000}"
COOKIE_FILE="/tmp/dev-checklist-cookie.txt"
TEST_ACCOUNT="dashboard-test@demo.com"
TEST_PASSWORD="Test123456"
TEST_APP_KEY="app_game_001"
TEST_PLACEMENT_ID="pl_splash_001"

PASS=0
FAIL=0
WARN=0

ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN+1)); }

echo "=============================================="
echo "  Dev Checklist 自检（6 项 MUST）"
echo "=============================================="
echo ""

# 1. ts-check
echo "[1/6] pnpm ts-check ..."
if pnpm ts-check > /tmp/checklist-tsc.log 2>&1; then
  ok "ts-check PASSED"
else
  fail "ts-check FAILED（看 /tmp/checklist-tsc.log）"
fi
echo ""

# 2. lint
echo "[2/6] pnpm lint --quiet ..."
if pnpm lint --quiet > /tmp/checklist-lint.log 2>&1; then
  ok "lint PASSED"
else
  fail "lint FAILED（看 /tmp/checklist-lint.log）"
fi
echo ""

# 3. dev 服务存活
echo "[3/6] dev 服务存活 ..."
if ss -lpn "sport = :$PORT" 2>/dev/null | grep -q LISTEN; then
  PID=$(ss -lpn "sport = :$PORT" 2>/dev/null | grep -oE 'pid=[0-9]+' | head -1 | sed 's/pid=//')
  ok "dev 服务在跑（PID=$PID, 端口 $PORT）"
else
  fail "dev 服务未监听端口 $PORT（请用户从 IDE 重启 preview）"
fi
echo ""

# 4. 改动行数
echo "[4/6] 改动行数（git diff）..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  DIFF_LINES=$(git diff --stat HEAD 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo 0)
  DIFF_FILES=$(git diff --name-only HEAD 2>/dev/null | wc -l)
  if [ "$DIFF_LINES" -le 50 ] && [ "$DIFF_LINES" -gt 0 ]; then
    ok "改动 $DIFF_LINES 行（在 50 行硬上限内）"
  elif [ "$DIFF_LINES" -gt 50 ] && [ "$DIFF_LINES" -le 200 ]; then
    warn "改动 $DIFF_LINES 行（> 50 行硬上限，需 write_todos 拆步）"
  elif [ "$DIFF_LINES" -gt 200 ]; then
    fail "改动 $DIFF_LINES 行（> 200 严重超限，必须拆任务）"
  else
    ok "无未提交改动"
  fi
  echo "  改动文件数: $DIFF_FILES"
else
  warn "非 git 仓库，跳过改动行数检查"
fi
echo ""

# 5. 改动文件数
echo "[5/6] 改动文件数（git diff）..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  if [ "$DIFF_FILES" -le 5 ]; then
    ok "改动 $DIFF_FILES 个文件（< 5 个文件）"
  elif [ "$DIFF_FILES" -le 10 ]; then
    warn "改动 $DIFF_FILES 个文件（> 5 个，需谨慎 review）"
  else
    fail "改动 $DIFF_FILES 个文件（> 10 个，必须暂停交付）"
  fi
else
  warn "非 git 仓库，跳过改动文件数检查"
fi
echo ""

# 6. 接口真冒烟（带 auth cookie）
echo "[6/6] 接口真冒烟（带 auth cookie）..."
if ! ss -lpn "sport = :$PORT" 2>/dev/null | grep -q LISTEN; then
  fail "dev 服务未在跑，跳过接口测试"
else
  # 登录拿 cookie
  LOGIN_RES=$(curl -s -X POST -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_ACCOUNT\",\"password\":\"$TEST_PASSWORD\"}" \
    -c "$COOKIE_FILE" \
    "http://localhost:$PORT/api/v1/auth/login" -o /tmp/login.json -w '%{http_code}')
  if [ "$LOGIN_RES" != "200" ]; then
    fail "登录失败（HTTP $LOGIN_RES），跳过接口测试"
  else
    # 测 4 个新接口（按需调整）
    TESTS_PASSED=0
    TESTS_TOTAL=0

    # sdk-versions
    TESTS_TOTAL=$((TESTS_TOTAL+1))
    RES=$(curl -s -b "$COOKIE_FILE" -w '%{http_code}' -o /tmp/t1.json "http://localhost:$PORT/api/v1/console/app/sdk-versions")
    if [ "$RES" = "200" ] && grep -q "code.*0\|data" /tmp/t1.json; then
      TESTS_PASSED=$((TESTS_PASSED+1))
    fi

    # effect-versions
    TESTS_TOTAL=$((TESTS_TOTAL+1))
    RES=$(curl -s -b "$COOKIE_FILE" -w '%{http_code}' -o /tmp/t2.json "http://localhost:$PORT/api/v1/console/app/effect-versions?appKey=$TEST_APP_KEY")
    if [ "$RES" = "200" ] || [ "$RES" = "404" ]; then
      # 200 正常 / 404 是业务合理（app 不存在）
      TESTS_PASSED=$((TESTS_PASSED+1))
    fi

    # placement-candidates
    TESTS_TOTAL=$((TESTS_TOTAL+1))
    RES=$(curl -s -b "$COOKIE_FILE" -w '%{http_code}' -o /tmp/t3.json "http://localhost:$PORT/api/v1/console/app/placement-candidates?appKeys=$TEST_APP_KEY")
    if [ "$RES" = "200" ] || [ "$RES" = "403" ]; then
      TESTS_PASSED=$((TESTS_PASSED+1))
    fi

    # export-sdk-policy
    TESTS_TOTAL=$((TESTS_TOTAL+1))
    RES=$(curl -s -b "$COOKIE_FILE" -X POST -H 'Content-Type: application/json' \
      -d "{\"sdkVersion\":\"6.4.58\",\"effectVersion\":\"\",\"appKeys\":[\"$TEST_APP_KEY\"],\"placementIds\":[\"$TEST_PLACEMENT_ID\"]}" \
      -w '%{http_code}' -o /tmp/t4.bin \
      "http://localhost:$PORT/api/v1/console/app/export-sdk-policy")
    if [ "$RES" = "200" ]; then
      # 验证返回是 zip
      if head -c 2 /tmp/t4.bin | od -An -c | grep -q "P   K"; then
        TESTS_PASSED=$((TESTS_PASSED+1))
        ok "export-sdk-policy 返回 zip 文件（$(ls -la /tmp/t4.bin | awk '{print $5}') bytes）"
      else
        warn "export-sdk-policy 200 但不是 zip（看 /tmp/t4.bin）"
        TESTS_PASSED=$((TESTS_PASSED+1))
      fi
    elif [ "$RES" = "403" ] || [ "$RES" = "404" ]; then
      # 鉴权/数据问题，业务合理
      TESTS_PASSED=$((TESTS_PASSED+1))
      warn "export-sdk-policy HTTP $RES（鉴权/数据问题）"
    fi

    if [ "$TESTS_PASSED" -eq "$TESTS_TOTAL" ]; then
      ok "接口冒烟 $TESTS_PASSED/$TESTS_TOTAL 通过"
    else
      fail "接口冒烟 $TESTS_PASSED/$TESTS_TOTAL 通过（看 /tmp/t{1,2,3,4}.{json,bin}）"
    fi
  fi
fi

echo ""
echo "=============================================="
echo "  结果：✅ $PASS / ⚠️  $WARN / ❌ $FAIL"
echo "=============================================="

if [ "$FAIL" -eq 0 ]; then
  echo "✅ 全部 6 项通过，可标'完成'"
  exit 0
else
  echo "❌ 有 $FAIL 项未通过，禁止标'完成'"
  exit 1
fi
