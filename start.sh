#!/usr/bin/env bash
# ============================================================================
# CODA — The Crude Oracle Desk Agent · start
# ----------------------------------------------------------------------------
#   bash start.sh                 # console http://127.0.0.1:8787
#   bash start.sh --cycle         # one dry-run draft → outbox/
#   bash start.sh --publish       # PR path later. Human still merges.
#   bash start.sh --ingest-eia    # require EIA key
#
# With no arguments this launches the console as a background daemon, waits
# until it is healthy, prints the URL and returns 0 (so it is safe to use as
# the environment `start` command). Re-running is idempotent.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PID_FILE="run/console.pid"
LOG_FILE="logs/console.log"
mkdir -p run logs

envval() { grep -E "^$1=" secrets/.env 2>/dev/null | head -n1 | cut -d= -f2- || true; }
HOST="$(envval CODA_HOST)"; HOST="${HOST:-127.0.0.1}"
PORT="$(envval CODA_PORT)"; PORT="${PORT:-8787}"

log() { printf '%s [start] %s\n' "$(date -u +%FT%TZ)" "$*"; }

console_alive() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

health_ok() {
  curl -fsS -o /dev/null "http://${HOST}:${PORT}/healthz" 2>/dev/null
}

start_console() {
  if console_alive && health_ok; then
    log "Console already running and healthy at http://${HOST}:${PORT} (pid $(cat "$PID_FILE"))."
    return 0
  fi
  # Clean up a stale pid file if the process is gone.
  if [ -f "$PID_FILE" ] && ! console_alive; then rm -f "$PID_FILE"; fi

  log "Starting CODA console…"
  nohup node agent/console.mjs >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  for _ in $(seq 1 30); do
    if health_ok; then
      log "Console healthy at http://${HOST}:${PORT} (pid $(cat "$PID_FILE"))."
      log "Console UI needs the token: http://${HOST}:${PORT}/?token=<AGENT_CONSOLE_TOKEN from secrets/.env>"
      return 0
    fi
    sleep 0.5
  done

  log "ERROR: console did not become healthy in time. Recent log:" >&2
  tail -n 20 "$LOG_FILE" >&2 || true
  return 1
}

sub="${1:-}"
case "$sub" in
  ""|console)      start_console ;;
  --cycle)         log "Running one dry-run draft cycle…"; node agent/cycle.mjs ;;
  --publish)       log "Running publish cycle (opens a DRAFT PR; human merges)…"; node agent/cycle.mjs --publish ;;
  --ingest-eia)    log "Ingesting EIA series…"; node agent/ingest-eia.mjs ;;
  -h|--help)       sed -n '2,12p' "${BASH_SOURCE[0]}" ;;
  *) echo "start.sh: unknown option '$sub' (try --cycle, --publish, --ingest-eia)" >&2; exit 64 ;;
esac
