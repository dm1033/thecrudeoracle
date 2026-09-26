#!/usr/bin/env bash
# CODA — stop the console daemon (if running).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PID_FILE="run/console.pid"
log() { printf '%s [stop] %s\n' "$(date -u +%FT%TZ)" "$*"; }

if [ ! -f "$PID_FILE" ]; then
  log "No pid file; console not running."
  exit 0
fi

pid="$(cat "$PID_FILE")"
if kill -0 "$pid" 2>/dev/null; then
  log "Stopping console (pid $pid)…"
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.25
  done
  if kill -0 "$pid" 2>/dev/null; then
    log "Console still alive; sending SIGKILL."
    kill -9 "$pid" 2>/dev/null || true
  fi
  log "Stopped."
else
  log "Process $pid not alive; clearing stale pid file."
fi
rm -f "$PID_FILE"
