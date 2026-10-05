# The Crude Oracle $10,000,000 Paper Fund — Playbook

PAPER TRADING ONLY. Virtual capital. No real orders.

The live ledger is `data/virtual-portfolio.json`.
The retired July 2026 $1,000,000 sample book is `data/archive/virtual-portfolio-1m-2026-07.json`. Do not edit that file, and do not add its P&L to the $10M NAV.

**Objective:** Determine whether The Crude Oracle's combined energy, shipping, macroeconomic, geopolitical, quantitative and AI intelligence can generate persistent positive risk-adjusted returns from a simulated $10,000,000 portfolio.

The fund does not promise profits.

---

## 1. What a week must contain

1. Freeze marks with a timestamp and a source. Do not use a later price as the entry.
2. Score every serious idea on the six families (structure 25, fundamentals 20, macro 15, geopolitical alignment 15, cross-market 15, data quality 10). The confidence score is the sum.
3. Rank them. Below 60 is watchlist only. 60–69 is reduced size. 70–79 is a normal allocation. 80–89 is large within the caps. 90–100 is rare.
4. For anything that might trade, write the stop, the target and the dollars at risk before the id is issued.
5. Normal risk is 0.25%–1.0% of NAV. The ceiling for an exceptional case is 1.5% of NAV. A stop can gap. Say so.
6. Issue `CO-YYYY-Www-NNN` at the moment of the decision, including a no-trade record when nothing clears the gate.
7. Append one equity-curve point. Never delete a down week.
8. Publish the weekly report: opened, closed, winners, losers, and a loss note even when the loss is "we did not trade".

Internal modules that are still the July 2026 sample set do not get a vote. Missing data lowers the data-quality score. It is not filled in.

## 2. Accounting identities

The test suite enforces these:

- NAV = starting value + realised P&L + unrealised P&L
- Cash + capital allocated = starting value
- Weight = capital allocated / starting value
- Realised P&L = sum of closed trades
- Unrealised P&L = sum of open positions
- Allocation actuals sum to 100, and each sleeve matches its positions

`capital_allocated` is the exposure counted against NAV (notional for a future). Capital at risk is the stop, stored separately, and is the number that must stay inside the risk budget.

## 3. What is never edited

Entry price, timestamp, original thesis, original stop, original size. A review can be appended after a close. A losing trade is not removed. The archive page reads the same file.

## 4. Pages

- `/portfolio` — public NAV, curve, ranking
- `/portfolio/dashboard` — Oracle Trading Desk
- `/portfolio/report` — latest weekly report
- `/portfolio/archive` — searchable ledger

## 5. Benchmarks

Compare from the same timestamp as the decision: Brent, WTI, and a broad energy equity only when a cash-session print exists. Do not show Sharpe or Sortino until there are at least eight weekly returns and eight closed trades. The page states that limit in words.
