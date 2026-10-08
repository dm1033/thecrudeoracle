#!/usr/bin/env bash
# Run a few hours after stamping: upgrades pending .ots proofs once the Bitcoin anchor exists.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
shopt -s nullglob
for f in log/proofs/*.ots; do ots upgrade "$f" || true; done
git add log/proofs && git commit -q -m "ots upgrade $(date -u +%F)" && git push -q || true
