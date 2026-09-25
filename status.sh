#!/usr/bin/env bash
# CODA — status. Reports console health, configuration flags and outbox drafts.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PID_FILE="run/console.pid"
envval() { grep -E "^$1=" secrets/.env 2>/dev/null | head -n1 | cut -d= -f2- || true; }
HOST="$(envval CODA_HOST)"; HOST="${HOST:-127.0.0.1}"
PORT="$(envval CODA_PORT)"; PORT="${PORT:-8787}"
TOKEN="$(envval AGENT_CONSOLE_TOKEN)"

echo "CODA status @ $(date -u +%FT%TZ)"
echo "  bind:        http://${HOST}:${PORT}"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "  console pid: $(cat "$PID_FILE") (running)"
else
  echo "  console pid: not running"
fi

if curl -fsS -o /dev/null "http://${HOST}:${PORT}/healthz" 2>/dev/null; then
  echo "  healthz:     ok"
else
  echo "  healthz:     unreachable"
fi

if [ -n "$TOKEN" ] && [ "$TOKEN" != "replace_me" ]; then
  status_json="$(curl -fsS -H "Authorization: Bearer ${TOKEN}" "http://${HOST}:${PORT}/api/status" 2>/dev/null || true)"
  if [ -n "$status_json" ]; then
    echo "  /api/status:"
    echo "$status_json" | sed 's/^/    /'
  fi
fi

draft_count=0
[ -d outbox ] && draft_count="$(find outbox -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
echo "  outbox md:   ${draft_count} draft(s)"
