# Wave one — the first 20 messages (drafts, not sent)

**Send window:** from Monday 16 November 2026 (week six, two weeks after go-live), once two
EIA Wednesdays (4 and 11 November) are in the public log. Not before: the proof points below do
not exist yet.

**Who:** segments 1 and 3 only, per the playbook. Twelve energy or commodity PMs at
multi-strategy funds, eight heads of data, AI or quant research. Map each draft to a named
person from the 108-contact list (or an Apollo gap-fill) and replace `[First name]`. The
`Personal line` is the one sentence you must make true for that person before sending; the
suggested angle is a prompt, not a fact to assert.

**Fill before sending** (from `paper-book/report/dashboard.json`):

| Token | Source |
|---|---|
| `[X]` | `calls_vs_prints[-1].forecast_kbbl` (the most recent Wednesday's crude forecast, kbbl) |
| `[Y]` | `calls_vs_prints[-1].actual_kbbl` (the EIA print, kbbl) |
| `[dashboard]` | `https://www.thecrudeoracle.com/paper-book` |
| `[repo]` | `https://github.com/dm1033/thecrudeoracle/tree/main/paper-book` |

Rules (docs/COMPLIANCE.md): never "fund", "returns", "investors" or an invitation to invest. It
is a paper book, a research process and a tooling capability. No performance figures in wave
one. Misses are mentioned on purpose.

Signature on every message:

> David Miller · The Crude Oracle · [dashboard]
> Simulated paper trading. No client money. Not investment advice.

---

## Segment 1 — energy and commodity PMs at multi-strategy funds (12)

All twelve use **Message A**. Subject line is fixed; only the personal line changes.

**Subject:** EIA Wednesdays, run by agents — timestamped before the print

> [First name],
>
> [Personal line]
>
> I've built an AI desk that trades a paper crude book: four analyst agents, a bull/bear
> debate, a PM that outputs JSON, and hard risk code it can't override. Every call is committed
> and timestamped before the market grades it, and it runs against a no-AI baseline.
>
> Last Wednesday it called crude stocks at [X] kb against a print of [Y] kb.
>
> Ten minutes on a screen-share? I'll show you the log — misses included.
>
> David

| # | Target | Personal line (make it true, then send) |
|---|---|---|
| 1 | Energy PM, Citadel (commodities) | Suggested angle: the scale of their energy book means the EIA print is a weekly event for them; ask what their analysts do in the 30 minutes before 10:30. Example: "Your Wednesday 10:30 is presumably a bigger event than mine — which is exactly why I wanted to show you how I grade mine." |
| 2 | Energy PM, Millennium | Angle: pod autonomy. "Pod-level research tooling that leaves an audit trail seems like a thing you'd want to see before anyone else at the firm does." |
| 3 | Commodities PM, Balyasny | Angle: a commodities build-out that is still hiring analysts. "If you're still adding analysts to the energy book, this is what one analyst plus a stack looks like." |
| 4 | Energy PM, Verition | Angle: the expansion from three to six commodity pods and the London/Dubai hires (Hedgeweek). "You've gone from three to six commodity pods this year; the process below is built to scale an analyst, not replace one." |
| 5 | Commodities PM, Jain Global | Angle: a young platform with a clean slate on tooling. "Newer platforms get to choose their research stack rather than inherit it — that's the conversation I'd like." |
| 6 | Energy PM, ExodusPoint | Angle: risk discipline. "The part a risk officer would like is that the model can't override the limits; the part you'd like is the Wednesday call." |
| 7 | Energy PM, Point72 | Angle: their stated interest in AI across the firm. "You've said publicly the firm is leaning into AI; here's a crude-specific version with the look-ahead problem solved." |
| 8 | Commodities PM, Schonfeld | Angle: spreads. "The spread sleeve — WTI–Brent and the 3-2-1 — is the one I'd most like your view on." |
| 9 | Commodities PM, Brevan Howard | Angle: macro-driven oil. "Your oil view is probably macro-first; mine is balances-first, which is why the baseline sleeve exists to keep me honest." |
| 10 | Energy PM, Eisler Capital | Angle: quantitative discretionary. "Discretionary calls with a systematic control group is the setup I think you'd test me on." |
| 11 | Energy PM, Walleye Capital | Angle: smaller pods, faster decisions. "Smaller energy pods are where one person plus a stack changes the maths." |
| 12 | Commodities PM, Squarepoint | Angle: systematic firm looking at LLM signals. "You'll have seen LLM backtests; this is the forward-only version with the model pinned." |

Pick 12 real people before sending. If your list has more than 12 PMs, prefer London, Geneva
and Houston first (time zones you can demo to live), then New York.

## Segment 3 — heads of data, AI or quant research (8)

All eight use **Message B**.

**Subject:** How I stopped my LLM cheating its own backtest

> [First name],
>
> [Personal line]
>
> LLM backtests mostly measure memory. So I don't run them: my crude desk runs forward only,
> inputs frozen, decisions timestamped, model pinned, and the model never touches the order
> API.
>
> The pre-registered rules and every decision file are public: [repo]. Happy to walk you
> through the governance in ten minutes — it's the part most AI trading demos skip.
>
> David

| # | Target | Personal line (make it true, then send) |
|---|---|---|
| 13 | Head of Data Science, Citadel | Angle: evaluation rigour. "You'll have a view on parametric look-ahead in LLM backtests; I'd like to hear where my fix falls short." |
| 14 | Head of AI / ML Research, Millennium | Angle: governance across many pods. "A pod-level AI process that leaves a replayable audit trail is probably more useful to you than any single signal." |
| 15 | Head of Quant Research, Balyasny | Angle: the control group. "The baseline sleeve is the only reason the AI numbers will mean anything; I suspect you'd have designed it the same way." |
| 16 | Head of Data, Point72 | Angle: alternative data and frozen inputs. "Every input is frozen with a SHA-256 manifest before an agent sees it — the data-lineage half of this might interest you more than the trading half." |
| 17 | Head of AI, Man Group (AHL / Numeric) | Angle: published research on LLMs in markets. "Given what your research group has published on LLMs, I'd value a critique of the look-ahead controls." |
| 18 | Head of Quant / Data, Jain Global | Angle: building a stack from scratch. "A new platform's data stack is a chance to build the audit trail in from day one; here's a small worked example." |
| 19 | Head of Data / Technology, Verition | Angle: scaling the new energy pods. "Six commodity pods will want the same research tooling; one way to give it to them with governance built in." |
| 20 | Head of Research / Quant, Brevan Howard | Angle: deterministic risk layer. "The model proposes, deterministic code disposes — I'd like your view on whether that split is enough." |

## Follow-ups (one each, five business days after the first message, then stop)

**Follow-up to A**

> [First name] — one line, no chase: this Wednesday's call is [X] kb against a print of [Y] kb,
> logged before 10:30 ET. The ten minutes stands if useful. David

**Follow-up to B**

> [First name] — in case it helps decide: the risk check that rejects the model's proposals is
> 200 lines of Python, tested, public: [repo]/risk/check.py. Ten minutes whenever suits. David

## LinkedIn connection note (300 characters, when email is unknown)

> Built a forward-only AI crude desk: agents propose, code disposes, every call timestamped
> before the EIA print, measured against a no-AI baseline. Public log at thecrudeoracle.com/paper-book.
> Would value ten minutes of your criticism. — David

## Tracking

Log each send in `docs/contacts_template.csv` (`message_sent` = A or B, `last_contact` =
date). No second follow-up. Replies go into the same CSV with the next action.
