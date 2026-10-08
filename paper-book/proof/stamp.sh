#!/usr/bin/env bash
# Commit, push and OpenTimestamp a decision file BEFORE any order is sent.
# Usage: proof/stamp.sh log/decisions/<run-id>.json
# Exit non-zero on any failure; the desk then withholds orders and logs why.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"
FILE="${1:?decision file}"
[ -f "$FILE" ] || { echo "no such file: $FILE" >&2; exit 2; }

GIT_PUSH="$(python3 -c 'import yaml;print(str(yaml.safe_load(open("config.yaml"))["proof"]["git_push"]).lower())')"
OTS="$(python3 -c 'import yaml;print(str(yaml.safe_load(open("config.yaml"))["proof"]["ots"]).lower())')"

git add log/
if ! git diff --cached --quiet; then
  git commit -q -m "decisions $(basename "$FILE" .json)"
fi
if [ "$GIT_PUSH" = "true" ]; then
  for i in 1 2 3 4; do
    git push -q && break
    [ "$i" = 4 ] && { echo "git push failed after 4 attempts" >&2; exit 3; }
    sleep $((2 ** i))
  done
fi
if [ "$OTS" = "true" ]; then
  command -v ots >/dev/null || { echo "ots client not installed (pip install opentimestamps-client)" >&2; exit 4; }
  ots stamp "$FILE"                               # writes <file>.ots next to the decision
  mkdir -p log/proofs
  mv "$FILE.ots" "log/proofs/$(basename "$FILE").ots"
  git add log/proofs && git commit -q -m "ots proof $(basename "$FILE" .json)" || true
  [ "$GIT_PUSH" = "true" ] && git push -q || true
fi
echo "stamped $(git rev-parse --short HEAD) $FILE"
