# The Crude Oracle $1,000,000 Oil Intelligence Portfolio — Playbook

PAPER TRADING ONLY. Virtual capital. Education and platform demonstration.
Every published report must carry the full disclaimer stored in
`data/virtual-portfolio.json` → `meta.disclaimer`.

**Objective wording (use verbatim):** "The objective is to test whether The
Crude Oracle's daily intelligence process can outperform standard passive or
generic oil-market tools over time through better data, risk control and
decision discipline." Never guarantee profits or claim certain outperformance.

**Sales line (use verbatim):** "The Crude Oracle does not promise profits. It
gives oil investors and traders a clearer intelligence process."

---

## 1. Data file

Everything renders from `data/virtual-portfolio.json`:
`account` (values, P/L, drawdown) · `rules` · `allocation` · `positions` ·
`closed_trades` · `trade_log` · `exposure` · `contributors/detractors` ·
`benchmarks` · `daily_brief` · `next_events`.

Pages: `/portfolio` (public marketing version) and `/portfolio/dashboard`
(premium, gated). Edit JSON → commit → push → live.

## 2. Portfolio rules (enforced in writing)

- Starting capital $1,000,000 (virtual)
- Core position ≤15% · high-conviction ≤20% with written justification ·
  speculative ≤5% · single equity ≤10%
- Futures margin-adjusted; notional counted against limits; stop always set
- Cash ≥10% unless justified in writing
- Risk per trade 1–2% of account; >2% requires a special risk warning
- Drawdown ladder: -5% review · -10% reduce risk · -15% pause new trades +
  full review · -20% strategy failure review
- No excessive leverage. No hidden losses. No cherry-picked results.

## 3. Strategy framework — the seven signal pillars

Price · Supply · Demand · Inventory · Geopolitical · Company · UK/North Sea.
Each maps to a live module or page: Curve Dashboard (3), Balance Engine (1),
Flow Map (2), News-to-Barrels (4), Positioning (5), Company Intelligence,
UK Energy Security. A trade should cite at least two aligned pillars.

## 4. Daily process

Each trading day produce **The Crude Oracle Daily Trading Brief** — 16
sections (stored in `daily_brief.sections`):
1 Market summary · 2 Brent/WTI price signal · 3 Gas/LNG signal · 4 Supply
risk · 5 Demand signal · 6 Inventory signal · 7 Geopolitical risk · 8 Top
opportunity today · 9 Top risk today · 10 Existing positions review ·
11 Proposed paper trades · 12 Stop-loss / risk levels · 13 Portfolio
exposure · 14 Cash balance · 15 Watchlist changes · 16 Bottom line.

Then: update `positions` current prices/P/L, recompute `account`, refresh
`exposure`, `contributors/detractors`, check the drawdown ladder, commit.

## 5. Trade decision template (every trade, before entry)

date · trade ID · asset · ticker · decision (Buy/Add · Hold · Reduce · Exit ·
Watch only · No trade) · long/short · entry price · position size · capital
allocated · thesis · catalyst · supporting data · risk · invalidation level ·
stop-loss · target · expected holding period · confidence rating · source
links · reason the trade fits the strategy · special risk warning if risk >2%.
Never write "guaranteed winner" or equivalent.

## 6. Benchmarking

Compare monthly against: cash proxy, Brent front month, WTI front month,
broad energy ETF, oil producer index / S&P 500 energy where available.
Track: monthly return, YTD return, max drawdown, win rate, average gain,
average loss, risk-adjusted return, number of trades, best trade, worst
trade, lessons learned. Store in `benchmarks.rows`.

## 7. Monthly report format

Title: **The Crude Oracle $1,000,000 Virtual Portfolio Report — [Month]**
Sections: 1 Starting balance · 2 Ending balance · 3 Monthly return ·
4 Benchmark comparison · 5 Best decisions · 6 Worst decisions · 7 Trades
opened · 8 Trades closed · 9 Current positions · 10 Watchlist changes ·
11 Market lessons · 12 Strategy changes · 13 Next month's focus ·
14 Risk warning (full disclaimer).
Publish both versions: public summary on `/portfolio`, full detail on the
premium dashboard.

## 8. Data source requirements

Only lawful sources: public/delayed quotes, licensed feeds, or manual desk
marks — each position labels source, URL, last-updated and data_type
(public / delayed / indicative / manual). No unlicensed real-time exchange
data. Non-USD positions note indicative FX conversion.

## 9. Compliance guardrails

- "Paper trading only — virtual capital" label on every page/report
- Full disclaimer top and bottom of both portfolio pages
- Decisions are journal entries about a virtual account — never instructions
  to the reader; no personalised recommendations, no signals service
- Losses published with the same prominence as gains
- Simulated performance ≠ future results, stated wherever performance shows
