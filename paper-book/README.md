# Crude Oracle Paper Book

A forward-only, AI-run simulated crude book where every trade's reasoning is timestamped before
the market grades it, and it has to beat a plain systematic baseline to earn its keep.

**Simulated paper trading. No client money. Not investment advice. Past performance, actual or
simulated, is not a reliable indicator of future results.**

What this demonstrates is not "AI picks winners". It is an auditable AI research-and-risk
process: specialist analyst agents argue bull versus bear, a PM agent proposes trades as strict
JSON, deterministic code checks risk and places paper orders, every decision is committed and
timestamped before the outcome is known, and a no-AI baseline runs alongside so the AI's value is
measured, not claimed.

Start with [`RULES.md`](RULES.md) (the pre-registered mandate) and
[`docs/SETUP_CHECKLIST.md`](docs/SETUP_CHECKLIST.md) (the manual steps).

## Layout

```
RULES.md                 pre-registered mandate and risk limits (commit BEFORE day 1)
config.yaml              model pin, instruments, data series, schedule inputs — logged with every run
.mcp.json                research-desk MCP servers (interactive use only; never in the pipeline)
data/collect_*.py        EIA, CFTC COT, RSS headlines, IB daily bars  -> frozen inputs
agents/prompts/*.md      seven roles + the Sunday post-mortem
agents/run_desk.py       the scheduled run: collect -> freeze -> analysts -> bull/bear -> PM -> risk -> proof -> orders
baseline/trend_carry.py  the no-AI control sleeve
risk/limits.yaml         the numbers; risk/check.py the code that enforces them; risk/contracts.py expiry rules
exec/place_orders.py     ib_async paper orders for risk-approved trades only; exec/mark_book.py settlement marks
proof/stamp.sh           git commit + push + OpenTimestamps before any order
report/tearsheet.py      tear sheet + report/dashboard.json (rendered at /paper-book on the site)
schedule/crontab         America/New_York schedule; run.sh is the wrapper cron calls
log/                     decisions, inputs (with SHA-256 manifests), fills, nav marks, .ots proofs, book.json
tests/                   pytest: risk rules, expiry rules, baseline, end-to-end offline dry run
docs/                    setup checklist, compliance, demo pack, outreach scripts, 16-week plan
```

## Quick start (offline, no keys)

```bash
uv venv && . .venv/bin/activate && uv pip install -r requirements.txt
make test                      # 26 tests on synthetic fixtures
make dryrun                    # a full desk run on fixtures, no model calls, into log/ (then discard)
```

With keys and a running IB Gateway: `cp .env.example .env`, fill it in, then

```bash
python data/collect_eia.py --verify      # every EIA series ID must print OK
python data/collect_cot.py --discover    # confirm the four CFTC codes
./run.sh daily                           # one real run, by hand, before trusting cron
```

## Governance in one paragraph (for a head of data)

The scheduled system is deterministic, logged code. The model only ever emits a proposal, as JSON
validated against a schema and then re-validated by `risk/check.py`, which sizes, resizes or
rejects every trade and logs the reason. The pinned model ID and the model the API reports it
served are both logged; a mismatch is a no-trade. Inputs are frozen with a manifest before any
agent reads them, there is no web access during a run, and the decision file is committed,
pushed and anchored in Bitcoin via OpenTimestamps before `exec/place_orders.py` is called. If
anything fails, the run records no trade. Nothing is deleted. Performance numbers are withheld
until 60 trading days and labelled with the sample size.

## Not in the pipeline

The MCP servers in `.mcp.json` (IBKR, OpenBB, Alpaca, QuantConnect) are for the interactive
research desk only. Community servers are unofficial: read the source before giving them
credentials and keep them pointed at paper accounts.
