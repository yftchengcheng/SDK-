#!/bin/bash
set -Eeuo pipefail

PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-${PORT}}"

cd "${COZE_WORKSPACE_PATH}"

kill_port_if_listening() {
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -z "${pids}" ]]; then
      echo "Port ${DEPLOY_RUN_PORT} is free."
      return
    fi
    echo "Port ${DEPLOY_RUN_PORT} in use by PIDs: ${pids} (SIGKILL)"
    echo "${pids}" | xargs -I {} kill -9 {}
    sleep 1
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -n "${pids}" ]]; then
      echo "Warning: port ${DEPLOY_RUN_PORT} still busy after SIGKILL, PIDs: ${pids}"
    else
      echo "Port ${DEPLOY_RUN_PORT} cleared."
    fi
}

start_oneshot() {
    echo "Clearing port ${DEPLOY_RUN_PORT} before start."
    kill_port_if_listening
    echo "Starting express + Vite dev server on port ${DEPLOY_RUN_PORT} (no-watchdog)..."
    PORT=${DEPLOY_RUN_PORT} pnpm tsx watch --clear-screen=false server/server.ts
}

start_with_watchdog() {
    echo "Clearing port ${DEPLOY_RUN_PORT} before start."
    kill_port_if_listening
    echo "Starting express + Vite dev server on port ${DEPLOY_RUN_PORT} (watchdog mode, max 5 restarts)..."
    local attempt=0
    local max_attempts=5
    while [[ ${attempt} -lt ${max_attempts} ]]; do
        attempt=$((attempt + 1))
        echo "------ attempt ${attempt}/${max_attempts} ------"
        set +e
        PORT=${DEPLOY_RUN_PORT} pnpm tsx watch --clear-screen=false server/server.ts
        local exit_code=$?
        set -e
        if [[ ${exit_code} -eq 0 ]]; then
            echo "tsx watch exited cleanly."
            break
        fi
        echo "tsx watch exited with code ${exit_code}, restarting in 2s..."
        sleep 2
    done
    if [[ ${attempt} -ge ${max_attempts} ]]; then
        echo "Reached max attempts (${max_attempts}), giving up."
        exit 1
    fi
}

# If DEV_WATCHDOG=1, enable auto-restart loop; else just run once.
if [[ "${DEV_WATCHDOG:-0}" == "1" ]]; then
    start_with_watchdog
else
    start_oneshot
fi
