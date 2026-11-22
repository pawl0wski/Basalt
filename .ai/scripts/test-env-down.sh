#!/bin/sh
# om-prepare-test-env: generated entrypoint (contract v2) -- teardown
# regenerate with: om-prepare-test-env --regenerate
# history:
#   2026-11-22 generated (stops the recorded Vite dev server; no containers to remove)
#   2026-11-22 repair: silence UNDICI-EHPA warning under NODE_USE_ENV_PROXY
set -eu

ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../.." && pwd))
cd "$ROOT"

QA_DIR=".ai/qa"
if command -v jq >/dev/null 2>&1 && [ -f .ai/agentic.config.json ]; then
  QA_DIR=$(jq -r '.paths.qa // ".ai/qa"' .ai/agentic.config.json)
fi
ENV_DESCRIPTOR="$QA_DIR/test-env.json"
STAMP="$QA_DIR/test-env.started"

[ -n "${NODE_USE_ENV_PROXY:-}" ] && export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--disable-warning=UNDICI-EHPA"

log() { printf '[test-env-down] %s\n' "$*" >&2; }

if [ ! -f "$ENV_DESCRIPTOR" ]; then
  log "no descriptor at $ENV_DESCRIPTOR; nothing to stop"
  printf 'TEST_ENV_STATUS=stopped\n'
  exit 0
fi

field() { node -e '
  const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), d);
  if (v !== undefined && v !== null) process.stdout.write(String(v));
' "$ENV_DESCRIPTOR" "$1" 2>/dev/null || true; }

if [ "$(field startedByThisRepo)" != true ] || [ "$(field projectRoot)" != "$ROOT" ]; then
  log "descriptor was not started by this checkout; leaving it untouched"
  exit 0
fi

APP_PID=$(field app.pid)
APP_PORT=$(field app.port)
case "$APP_PID" in ''|*[!0-9]*) APP_PID= ;; esac
if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
  cmdline=$(ps -o args= -p "$APP_PID" 2>/dev/null || true)
  case "$cmdline" in
    *vite*"--port $APP_PORT"*)
      log "stopping app pid $APP_PID"
      kill "$APP_PID" 2>/dev/null || true
      i=0; while kill -0 "$APP_PID" 2>/dev/null && [ $i -lt 20 ]; do sleep 0.5; i=$((i + 1)); done
      kill -0 "$APP_PID" 2>/dev/null && kill -9 "$APP_PID" 2>/dev/null || true
      ;;
    *) log "pid $APP_PID is no longer our vite server; not killing it" ;;
  esac
else
  log "app already stopped"
fi

node -e '
  const fs = require("fs"); const p = process.argv[1];
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  d.status = "stopped"; d.stoppedAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
' "$ENV_DESCRIPTOR"
rm -f "$STAMP"
printf 'TEST_ENV_STATUS=stopped\n'
