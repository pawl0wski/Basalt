#!/bin/sh
# om-prepare-test-env: generated entrypoint (contract v2)
# regenerate with: om-prepare-test-env --regenerate
# history:
#   2026-11-22 generated (memory-platform Vite dev server; prep = npm ci; browser = repo Playwright/Chromium)
#   2026-11-22 repair: silence UNDICI-EHPA warning under NODE_USE_ENV_PROXY (proxy sandbox noise on every node call)
#   2026-11-22 repair: refuse npm ci over a Windows-host node_modules on Linux (would clobber the host install via a direct mount)
#   2026-11-22 verified (cold 75s incl. npm ci + Chromium download, warm 0.3s reused, cached restart 2s)
set -eu

# ---------------------------------------------------------------- variables
APP_DIR="basalt-app"
APP_PKG_DIR="basalt-app/packages/app"
APP_ENV="VITE_BASALT_PLATFORM=memory"
START_COMMAND="VITE_BASALT_PLATFORM=memory npm run dev (vite --host 127.0.0.1 --port <port> --strictPort)"
PREFERRED_PORT=1420
HEALTH_PATH="/"
PLATFORM_PROBE_PATH="/src/platform/create-platform.ts"
PREP_INSTALL="npm ci --no-audit --no-fund"
BUILD_INPUTS="basalt-app/package.json basalt-app/package-lock.json basalt-app/packages/app/package.json basalt-app/packages/core/package.json basalt-app/packages/ui/package.json basalt-app/packages/editor/package.json basalt-app/packages/api/package.json"
BUILD_ENV_VARS="VITE_BASALT_PLATFORM NODE_ENV"
ARTIFACTS="basalt-app/node_modules/.bin/vite basalt-app/node_modules/@playwright/test/package.json"
NODE_MAJOR_MIN=22
HEALTH_TIMEOUT_SECONDS=90
LOCK_WAIT_SECONDS=300
TTL_SECONDS="${TEST_ENV_CACHE_TTL_SECONDS:-600}"
RUN_MODE="discovered"
# --------------------------------------------------------------------------

FORCE=0
FORCE_REBUILD=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --force-rebuild) FORCE_REBUILD=1 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../.." && pwd))
cd "$ROOT"

CONFIG=.ai/agentic.config.json
QA_DIR=".ai/qa"
SCRIPTS_DIR=".ai/scripts"
BROWSER_PROVIDER="playwright"
if command -v jq >/dev/null 2>&1 && [ -f "$CONFIG" ]; then
  QA_DIR=$(jq -r '.paths.qa // ".ai/qa"' "$CONFIG")
  SCRIPTS_DIR=$(jq -r '.paths.scripts // ".ai/scripts"' "$CONFIG")
  BROWSER_PROVIDER=$(jq -r '.browser.provider // "playwright"' "$CONFIG")
fi
case "$BROWSER_PROVIDER" in ''|*[!A-Za-z0-9._-]*) echo "invalid browser.provider" >&2; exit 1 ;; esac
mkdir -p "$QA_DIR"
ENV_DESCRIPTOR="$QA_DIR/test-env.json"
BUILD_CACHE="$QA_DIR/test-env-build-cache.json"
LOCK_DIR="$QA_DIR/test-env.lock"
STAMP="$QA_DIR/test-env.started"
APP_LOG="$QA_DIR/test-env-app.log"
T0=$(date +%s)

log() { printf '[test-env-up] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

case "$(uname -s 2>/dev/null || echo unknown)" in
  Linux*) if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then PLATFORM=wsl2; else PLATFORM=linux; fi ;;
  Darwin*) PLATFORM=darwin ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM=win32 ;;
  *) PLATFORM=unknown ;;
esac

# ------------------------------------------------------------ prerequisites
ensure_node() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    if [ "$PLATFORM" = linux ] && command -v apt-get >/dev/null 2>&1 && sudo -n true 2>/dev/null \
       && apt-cache show "nodejs-$NODE_MAJOR_MIN" >/dev/null 2>&1; then
      log "node/npm missing; installing nodejs-$NODE_MAJOR_MIN and npm via apt"
      sudo -n apt-get install -y -qq "nodejs-$NODE_MAJOR_MIN" npm >/dev/null
    fi
  fi
  command -v node >/dev/null 2>&1 || die "node not found; install Node.js >= $NODE_MAJOR_MIN (CI uses 22)"
  command -v npm >/dev/null 2>&1 || die "npm not found; install npm"
  major=$(node -v | sed 's/^v//; s/\..*//')
  [ "$major" -ge "$NODE_MAJOR_MIN" ] || die "node $major found; Node.js >= $NODE_MAJOR_MIN required"
  [ -n "${NODE_USE_ENV_PROXY:-}" ] && export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--disable-warning=UNDICI-EHPA"
  return 0
}

# ------------------------------------------------------------------- lock
pid_alive() { [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null; }
LOCK_HELD=0
release_lock() { if [ "$LOCK_HELD" = 1 ]; then rm -rf "$LOCK_DIR"; fi; LOCK_HELD=0; return 0; }
trap 'release_lock' EXIT
trap 'release_lock; exit 130' INT TERM

acquire_lock() {
  waited=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    owner=$(sed -n 's/.*"pid": *\([0-9][0-9]*\).*/\1/p' "$LOCK_DIR/owner.json" 2>/dev/null || true)
    if ! pid_alive "$owner"; then
      log "removing stale lock (owner ${owner:-unknown} not running)"
      rm -rf "$LOCK_DIR"; continue
    fi
    [ "$waited" -ge "$LOCK_WAIT_SECONDS" ] && die "lock held by pid $owner for over ${LOCK_WAIT_SECONDS}s"
    [ "$waited" = 0 ] && log "another bootstrap (pid $owner) is running; waiting"
    sleep 2; waited=$((waited + 2))
  done
  LOCK_HELD=1
  printf '{ "pid": %s, "source": "test-env-up.sh", "acquiredAt": "%s" }\n' "$$" "$(date -u +%FT%TZ)" > "$LOCK_DIR/owner.json"
}

# ------------------------------------------------------------ descriptor
desc_get() { [ -f "$ENV_DESCRIPTOR" ] && node -e '
  const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), d);
  if (v !== undefined && v !== null) process.stdout.write(String(v));
' "$ENV_DESCRIPTOR" "$1" 2>/dev/null || true; }

mtime() { stat -c '%Y' "$1" 2>/dev/null || stat -f '%m' "$1" 2>/dev/null || echo 0; }

http_ok() { curl -fsS --max-time 5 -o /dev/null "$1" 2>/dev/null; }

probe_app() {
  base="$1"
  curl -fsS --max-time 5 "$base$HEALTH_PATH" 2>/dev/null | grep -q '<div id="root">' || return 1
  curl -fsS --max-time 10 "$base$PLATFORM_PROBE_PATH" 2>/dev/null | grep -q '"memory"' || return 1
  curl -fsS --max-time 15 -o /dev/null "$base/src/main.tsx" 2>/dev/null || return 1
}

inputs_newer_than_stamp() {
  [ -f "$STAMP" ] || return 0
  for p in $BUILD_INPUTS; do
    [ -e "$p" ] && [ -n "$(find "$p" -newer "$STAMP" 2>/dev/null | head -n 1)" ] && return 0
  done
  return 1
}

stop_recorded_app() {
  app_pid=$(desc_get app.pid)
  [ "$(desc_get projectRoot)" = "$ROOT" ] || return 0
  case "$app_pid" in ''|*[!0-9]*) return 0 ;; esac
  case "$(ps -o args= -p "$app_pid" 2>/dev/null || true)" in *vite*) ;; *) return 0 ;; esac
  if pid_alive "$app_pid"; then
    log "stopping previous app (pid $app_pid)"
    kill "$app_pid" 2>/dev/null || true
    i=0; while pid_alive "$app_pid" && [ $i -lt 20 ]; do sleep 0.5; i=$((i + 1)); done
    pid_alive "$app_pid" && kill -9 "$app_pid" 2>/dev/null || true
  fi
}

try_reuse() {
  [ "$FORCE" = 1 ] && return 1
  [ "$(desc_get status)" = running ] || return 1
  [ "$(desc_get startedByThisRepo)" = true ] || return 1
  [ "$(desc_get projectRoot)" = "$ROOT" ] || { log "descriptor belongs to another checkout"; return 1; }
  app_pid=$(desc_get app.pid); base=$(desc_get baseUrl)
  pid_alive "$app_pid" || { log "recorded app pid $app_pid is not running"; return 1; }
  probe_app "$base" || { log "readiness probes failed for $base"; return 1; }
  age=$(( $(date +%s) - $(mtime "$STAMP") ))
  [ "$age" -le "$TTL_SECONDS" ] || { log "environment older than TTL (${age}s > ${TTL_SECONDS}s)"; return 1; }
  inputs_newer_than_stamp && { log "dependency inputs changed since start"; return 1; }
  REUSE_BASE="$base"
  return 0
}

# ----------------------------------------------------------- build cache
fp_file() { stat -c '%s:%Y' "$1" 2>/dev/null || stat -f '%z:%m' "$1" 2>/dev/null; }
fingerprint() {
  {
    for p in $BUILD_INPUTS; do
      if [ -d "$p" ]; then
        find "$p" -type f ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/dist/*' \
          ! -path '*/target/*' ! -path '*/.cache/*' ! -path '*/coverage/*'
      elif [ -f "$p" ]; then echo "$p"; fi
    done | LC_ALL=C sort | while IFS= read -r f; do printf '%s:%s\n' "$f" "$(fp_file "$f")"; done
    printf 'node:%s\n' "$(node -v)"
    for v in $BUILD_ENV_VARS; do eval "printf 'env:%s=%s\n' \"$v\" \"\${$v:-}\""; done
  } | cksum | awk '{print $1"-"$2}'
}

build_needed() {
  [ "$FORCE_REBUILD" = 1 ] && return 0
  [ -f "$BUILD_CACHE" ] || return 0
  cached_fp=$(sed -n 's/.*"sourceFingerprint": *"\([^"]*\)".*/\1/p' "$BUILD_CACHE")
  cached_root=$(sed -n 's/.*"projectRoot": *"\([^"]*\)".*/\1/p' "$BUILD_CACHE")
  [ -n "$cached_fp" ] && [ "$cached_fp" = "$(fingerprint)" ] || return 0
  [ "$cached_root" = "$ROOT" ] || return 0
  for a in $ARTIFACTS; do [ -s "$a" ] || [ -d "$a" ] || return 0; done
  return 1
}

chromium_installed() {
  (cd "$APP_DIR" && node -e '
    const fs = require("fs");
    const p = require("playwright-core").chromium.executablePath();
    process.exit(p && fs.existsSync(p) ? 0 : 1);
  ') 2>/dev/null
}

ensure_chromium() {
  chromium_installed && return 0
  log "Playwright Chromium missing; installing"
  if [ "$PLATFORM" = linux ] && sudo -n true 2>/dev/null; then
    (cd "$APP_DIR" && npx --no-install playwright install --with-deps chromium) >&2 || true
  else
    (cd "$APP_DIR" && npx --no-install playwright install chromium) >&2 || true
  fi
}

foreign_node_modules() {
  nm="$APP_DIR/node_modules"
  [ -d "$nm" ] || return 1
  case "$PLATFORM" in win32) return 1 ;; esac
  for d in "$nm"/@esbuild/win32-* "$nm"/@rollup/rollup-win32-*; do [ -e "$d" ] && return 0; done
  return 1
}

prepare() {
  REBUILT=0
  if build_needed; then
    log "preparing workspace: $PREP_INSTALL (in $APP_DIR)"
    (cd "$APP_DIR" && $PREP_INSTALL) >&2
    printf '{ "builtAt": "%s", "sourceFingerprint": "%s", "projectRoot": "%s", "artifactPaths": "%s" }\n' \
      "$(date -u +%FT%TZ)" "$(fingerprint)" "$ROOT" "$ARTIFACTS" > "$BUILD_CACHE"
    REBUILT=1
  else
    log "build cache valid; skipping npm ci"
  fi
  ensure_chromium
}

# ------------------------------------------------------------- app start
free_port() {
  node -e 's=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})'
}
port_free() {
  node -e 's=require("net").createServer();s.once("error",()=>process.exit(1));s.listen(+process.argv[1],"127.0.0.1",()=>s.close(()=>process.exit(0)))' "$1"
}

start_app() {
  if port_free "$PREFERRED_PORT" && ! http_ok "http://localhost:$PREFERRED_PORT/"; then
    PORT=$PREFERRED_PORT
  else
    PORT=$(free_port)
    log "port $PREFERRED_PORT is busy; using $PORT (npm run test:e2e expects 1420 and will start its own server)"
  fi
  case "$PORT" in ''|*[!0-9]*) die "could not resolve a port" ;; esac
  BASE_URL="http://127.0.0.1:$PORT"
  vite_bin="$ROOT/$APP_DIR/node_modules/.bin/vite"
  [ -x "$vite_bin" ] || die "vite not found at $APP_DIR/node_modules/.bin/vite after preparation"
  log "starting app on $BASE_URL (log: $APP_LOG)"
  : > "$APP_LOG"
  (
    cd "$APP_PKG_DIR"
    export VITE_BASALT_PLATFORM=memory
    exec nohup "$vite_bin" --host 127.0.0.1 --port "$PORT" --strictPort
  ) >> "$APP_LOG" 2>&1 < /dev/null &
  APP_PID=$!
  waited=0
  until probe_app "$BASE_URL"; do
    pid_alive "$APP_PID" || { tail -n 30 "$APP_LOG" >&2; die "app exited before becoming healthy"; }
    [ "$waited" -ge "$HEALTH_TIMEOUT_SECONDS" ] && { tail -n 30 "$APP_LOG" >&2; kill "$APP_PID" 2>/dev/null || true; die "app not healthy after ${HEALTH_TIMEOUT_SECONDS}s"; }
    sleep 1; waited=$((waited + 1))
  done
  touch "$STAMP"
}

write_descriptor() {
  duration=$(( $(date +%s) - T0 ))
  if chromium_installed; then B_INSTALLED=true; else B_INSTALLED=false; fi
  B_VERSION=$(node -p 'require("./'"$APP_DIR"'/node_modules/@playwright/test/package.json").version' 2>/dev/null || echo unknown)
  ROOT="$ROOT" RUN_MODE="$RUN_MODE" BASE_URL="$BASE_URL" PORT="$PORT" APP_PID="$APP_PID" \
  START_COMMAND="$START_COMMAND" HEALTH_PATH="$HEALTH_PATH" PLATFORM="$PLATFORM" \
  SCRIPTS_DIR="$SCRIPTS_DIR" QA_DIR="$QA_DIR" APP_LOG="$APP_LOG" BROWSER_PROVIDER="$BROWSER_PROVIDER" \
  B_INSTALLED="$B_INSTALLED" B_VERSION="$B_VERSION" REBUILT="$REBUILT" DURATION="$duration" \
  OUT="$ENV_DESCRIPTOR" APP_DIR="$APP_DIR" node -e '
    const e = process.env;
    const rand = Math.random().toString(36).slice(2, 8);
    const now = new Date();
    const runId = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "-" + rand;
    const installed = e.B_INSTALLED === "true";
    const d = {
      version: 1,
      runId,
      status: "running",
      mode: e.RUN_MODE,
      baseUrl: e.BASE_URL,
      startedByThisRepo: true,
      projectRoot: e.ROOT,
      startScript: e.SCRIPTS_DIR + "/test-env-up.sh",
      stopScript: e.SCRIPTS_DIR + "/test-env-down.sh",
      app: { startCommand: e.START_COMMAND, port: Number(e.PORT), healthPath: e.HEALTH_PATH, pid: Number(e.APP_PID), log: e.APP_LOG },
      services: [],
      credentials: [],
      credentialsFile: "",
      browser: {
        provider: e.BROWSER_PROVIDER,
        installed,
        command: "cd " + e.APP_DIR + " && npx playwright",
        version: e.B_VERSION,
        descriptor: ".ai/browsers/" + e.BROWSER_PROVIDER + ".md",
        notes: installed ? "" : "Chromium not installed; run: cd basalt-app && npx playwright install --with-deps chromium"
      },
      playwright: { runner: "playwright", installed, config: e.APP_DIR + "/playwright.config.ts", browsers: ["chromium"] },
      testRunner: { name: "playwright", config: e.APP_DIR + "/playwright.config.ts" },
      platform: e.PLATFORM,
      startedAt: now.toISOString().replace(/\.\d+Z$/, "Z"),
      notes: [
        "Browser memory platform (VITE_BASALT_PLATFORM=memory): no backend, no login; window.__basaltTestFs is the test handle (wait for it after goto).",
        "Open folder as workspace opens a seeded /demo workspace by default; data persists in the browser localStorage.",
        "Vite dev server with HMR: source edits are hot-reloaded, no restart needed; dependency changes trigger npm ci on next up.",
        "On port 1420 the repo e2e suite (npm run test:e2e) reuses this server via reuseExistingServer.",
        "Prep chain: (cd basalt-app && npm ci) then Playwright Chromium if missing. Requires Node >= 22.",
        "This boot: " + (e.REBUILT === "1" ? "npm ci ran" : "build cache hit") + ", " + e.DURATION + "s.",
        "Timings at generation: cold 75s (npm ci + Chromium download), warm 0.3s (reused), cached restart 2s."
      ].join(" ")
    };
    require("fs").writeFileSync(e.OUT, JSON.stringify(d, null, 2) + "\n");
  '
}

print_result() {
  printf 'TEST_ENV_STATUS=running\n'
  printf 'TEST_ENV_BASE_URL=%s\n' "$1"
  printf 'TEST_ENV_DESCRIPTOR=%s\n' "$ENV_DESCRIPTOR"
  printf 'TEST_ENV_REUSED=%s\n' "$2"
  printf 'BROWSER_PROVIDER=%s\n' "$BROWSER_PROVIDER"
  printf 'BROWSER_INSTALLED=%s\n' "$( [ "$(desc_get browser.installed)" = true ] && echo 1 || echo 0)"
}

# ------------------------------------------------------------------ main
ensure_node
acquire_lock
if try_reuse; then
  log "reusing running environment ($(( $(date +%s) - T0 ))s)"
  print_result "$REUSE_BASE" 1
  exit 0
fi
if build_needed && foreign_node_modules; then
  die "$APP_DIR/node_modules holds Windows native binaries (host mount?); npm ci here would overwrite the host's install. Run from a clone or a scratchpad copy (see .ai/lessons/2026-11-22-sandbox-node-modules-are-windows-only.md)"
fi
stop_recorded_app
prepare
start_app
write_descriptor
log "environment ready in $(( $(date +%s) - T0 ))s"
print_result "$BASE_URL" 0
