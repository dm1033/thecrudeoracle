# Crude Oracle Paper Book — Pre-registered Rules

**Status:** pre-registration draft. The commit that first lands this file on `main` is the
inception record. Any change after inception must be a dated revision in the table at the
bottom, committed before it takes effect. Nothing here is edited silently.

**Simulated paper trading. No client money. Not investment advice. Past performance, actual or
simulated, is not a reliable indicator of future results.**

## 1. What this is

A forward-only, simulated single-strategy energy book run by an AI research desk, with every
decision timestamped before the market grades it, measured against a no-AI baseline. It is a
capability demonstration and a research process. It is not a fund, it is not open to investors,
and it is not an offer of anything.

## 2. Instruments

All NYMEX futures, traded in an Interactive Brokers **paper** account.

| Product | Symbol | Multiplier | Role |
|---|---|---|---|
| WTI crude | CL (MCL for fine sizing) | 1,000 bbl (100 bbl) | Core outright |
| Brent last-day financial | BZ | 1,000 bbl | WTI–Brent spread, global balance |
| RBOB gasoline | RB | 42,000 gal | Crack spread leg |
| NY Harbor ULSD | HO | 42,000 gal | Crack spread leg |

Optional, not part of the core record: energy equities and ETFs in an Alpaca paper account.

## 3. Sleeves

1. **Event sleeve (AI):** EIA Weekly Petroleum Status Report and OPEC+ decisions. Agents forecast
   the inventory change before the print and grade the surprise after it.
2. **Spread sleeve (AI):** WTI–Brent, the 3-2-1 crack (3 CL vs 2 RB + 1 HO) and front calendar
   spreads.
3. **Baseline sleeve (no AI):** trend plus curve-carry, deterministic, same schedule, same risk
   code. This is the control group. The claim made is always *AI sleeves versus baseline*.

Risk budget: 10% annualised volatility target for the whole book, one third per sleeve.

## 4. Decision cadence (America/New_York)

| Run | When | Purpose |
|---|---|---|
| `daily` | 08:00 Mon–Fri | Full desk: four analysts, bull/bear, PM, risk check, orders |
| `eia` | 11:00 Wed | Grade the EIA forecast, re-run the desk on the print |
| `cot` | 16:00 Fri | Positioning update after the CFTC release |
| `postmortem` | 18:00 Sun | Grade the week, tear sheet, dashboard |

Fixed times stop cherry-picking when to trade. Runs are never re-done by hand.

## 5. Decision protocol

collect data → freeze inputs → four analysts → bull and bear → PM JSON → risk check (code) →
commit and timestamp → place approved orders → log fills.

If any step fails, the run records **no trade** and the reason. Nothing is retried, patched or
improvised inside the run.

The language model never touches the order API. It emits a proposal as JSON; deterministic code
in `risk/check.py` accepts, resizes or rejects it; `exec/place_orders.py` only ever sees the
accepted list.

## 6. Risk rules enforced in code

| Rule | Limit | What the code does |
|---|---|---|
| Risk per trade | 0.5% of NAV entry-to-stop (1.0% max at confidence 5) | Resizes down; rejects if no stop |
| Book volatility | 10% annualised target, 12% ceiling (60-day realised) | Scales all new trades down pro rata |
| Gross exposure | 4 × NAV notional | Rejects new risk above the cap |
| Per product | 40% of book risk capacity in any one of CL, BZ, RB, HO | Rejects the excess |
| Open trades | 6 across the AI sleeves | Rejects the seventh |
| Drawdown step-down | −6% from peak | Halves all new sizes until a new high |
| Drawdown stop | −10% from peak | Flattens the AI sleeves; 5-day logged review |
| Event timing | No AI-sleeve orders 10:00–11:00 ET on EIA days | Delayed to the 11:00 run |
| Expiry | Roll or close 5 business days before last trade date | Forced |
| Fill realism | P&L net of 1 tick slippage per side plus commission | Applied in the tear sheet |
| Model output | Invalid JSON, missing stop, unknown symbol | No trade, logged |

"Book risk capacity" is the maximum open AI trades multiplied by the base risk per trade
(6 × 0.5% = 3% of NAV); a product may hold at most 40% of it. Limits live in
`risk/limits.yaml`; the check is `risk/check.py`; both are covered by `tests/`.

## 7. Proof

1. This file is committed before the first live run.
2. Every run saves the exact inputs each agent saw under `log/inputs/<run-id>/`, with a SHA-256
   manifest.
3. Every decision file is committed, pushed and stamped with OpenTimestamps before orders go in.
4. Nothing is deleted: losses, rejected proposals and no-trade days stay in the log and the tear
   sheet.
5. Performance statistics are published only after 60 NYMEX trading days, with the sample size
   labelled every time. The process is shown from two weeks after go-live.
6. No language-model backtest is ever shown as evidence. Backtests are for the baseline sleeve
   only, labelled simulated.

## 8. Model

Pinned in `config.yaml` (`model.id`) and logged in every decision file along with the model the
API reports it served. A change of model is a dated revision below.

## 9. Revision log

| Rev | Date | Change | Commit |
|---|---|---|---|
| 0 | 2026-10-08 | Initial pre-registration draft | (this commit) |
