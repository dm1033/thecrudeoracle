# The demo pack

Three assets, built once, refreshed weekly by the pipeline.

## 1. Live read-only dashboard — `/paper-book` on the site

- NAV curve: AI sleeves against the baseline, net of costs, inception date and trading-day count.
- Risk used against each limit; open positions.
- Decision log: every run, thesis, kill criteria, rejections, outcome, post-mortem grade, commit
  hash and OpenTimestamps proof.
- Calls versus prints: the fundamentals agent's EIA forecast against the actual number, weekly.
- No live exchange prices (docs/COMPLIANCE.md). Performance statistics appear only after 60
  trading days; the process is visible from day one.

## 2. One-page tear sheet — `report/tearsheet.md` (+ `tearsheet.html` via quantstats)

Inception date, days live, return, volatility, Sharpe, max drawdown, hit rate, costs note,
AI-versus-baseline spread, the simulated-performance warning in the same font size as the body.
Export to PDF from the markdown or the quantstats HTML.

## 3. Ten-minute screen-share

| Minute | Beat | What is on screen |
|---|---|---|
| 0–1 | The problem | "Most AI trading demos are backtests the model has already memorised. Mine isn't." — RULES.md section 7 |
| 1–3 | The machine | The six-step process on `/paper-book`; `risk/check.py` open in the editor: the model proposes, code disposes |
| 3–6 | One live replay | A real EIA Wednesday: `log/decisions/<date>-daily.json` with the forecast before the print → the four reports → bull/bear → the PM JSON → the risk check verdict → the fill → `<date>-eia.json` grading |
| 6–8 | Numbers and misses | The tear sheet (only after 60 days; before that, the calls-vs-prints table and the worst call from the post-mortem) |
| 8–10 | Their desk | "Give me one question your team argues about every week, and I'll run it through this stack for two weeks." |

The offer in the last beat is the conversion point: a small paid pilot or a research subscription.

### Replay commands

```bash
# show a decision with its proof
cat log/decisions/2026-11-04-daily.json | jq '{eia_forecast, pm_proposal, risk_check: .risk_check | {approved: (.approved|length), rejected: [.rejected[].reason]}, proof}'
ots verify log/proofs/2026-11-04-daily.json.ots
# re-run the risk check on the frozen inputs to show it is deterministic
python -c "import json;from risk.check import check;..."   # see tests/test_risk.py for the call shape
```
