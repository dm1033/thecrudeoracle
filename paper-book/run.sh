#!/usr/bin/env bash
# Wrapper the cron entries call. Loads .env, activates the venv, runs one step.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p logs
[ -f .env ] && set -a && . ./.env && set +a
[ -d .venv ] && . .venv/bin/activate
case "${1:?daily|eia|cot|mark|postmortem|tearsheet}" in
  daily|eia|cot)  python agents/run_desk.py --run "$1" ;;
  mark)           python exec/mark_book.py ;;
  postmortem)     python agents/run_desk.py --run postmortem && python report/tearsheet.py && ./proof/stamp.sh "$(ls -t log/decisions/*postmortem.json | head -1)" ;;
  tearsheet)      python report/tearsheet.py ;;
  *) echo "unknown step $1" >&2; exit 2 ;;
esac
