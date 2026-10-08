# UK compliance guardrails

General information, not legal advice. Take advice from a UK financial-services solicitor or
compliance consultant before anything that looks like marketing an investment.

**Keep it a capability demonstration with no client money and no invitation to invest.**

- **Language.** "Paper book" or "model portfolio" in public. Never "hedge fund", "returns
  available", "investors", "AUM" or anything that reads as an offer. The site route, the tear
  sheet and the outreach templates follow this.
- **Financial promotions.** Inviting someone to invest is a financial promotion and in the UK must
  be made or approved by an authorised firm. Showing a PM a research and tooling capability is a
  different thing. Keep every conversation framed as capability, research and tooling.
- **Simulated performance wording.** FCA COBS 4.6 requires simulated past performance to carry a
  prominent warning that the figures are simulated and that past performance is not a reliable
  indicator of future performance. `report/tearsheet.py` writes it into every output and the
  dashboard renders it at body-text size. Use it on every chart, slide and post.
- **Research, not advice.** Crude Oracle content stays general market commentary. No personal
  recommendations to individuals.
- **Market-data licensing.** Non-professional exchange data is for personal use. The dashboard
  shows the book's own settlement-based marks and P&L, never live NYMEX prices. If the data is
  used for a business, IBKR may class you as professional at much higher fees. Answer the
  questionnaire truthfully: https://ibkb.interactivebrokers.com/node/2583
- **Standard disclaimer on every asset:**

  > Simulated paper trading. No client money. Not investment advice. Past performance, actual or
  > simulated, is not a reliable indicator of future results.

- **Model pinning and look-ahead.** No LLM backtest is shown as evidence (parametric look-ahead:
  a model trained on 2024 text already knows how earlier markets moved). Forward only, inputs
  frozen, decisions timestamped. Baseline-sleeve backtests only, labelled simulated.
