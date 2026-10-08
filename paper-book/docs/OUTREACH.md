# Outreach plan and scripts

Two waves. Sell the process from week six (two weeks after go-live, about 16 November 2026).
Numbers only after 60 trading days (about 28 January 2027). Not the audience: investors or
allocators (docs/COMPLIANCE.md).

## Targeting

Tag the 108 contacts into the six segments using `docs/contacts_template.csv`, then fill gaps
with Apollo: titles Portfolio Manager Energy, Head of Commodities, Commodities Analyst, Head of
Data Science, Quant Researcher; locations London, Geneva, New York, Houston, Dubai.

| # | Segment | Show them | Likely outcome |
|---|---|---|---|
| 1 | Energy/commodity PMs at multi-strategy funds | Wednesday EIA workflow, decision log, AI vs baseline | Subscription, analyst or consulting work |
| 2 | Specialist commodity and energy funds | Spread-sleeve calls, the weekly note | Research subscription, bespoke work |
| 3 | Heads of data / AI / quant research | Architecture, frozen inputs, timestamp proof, "LLM never touches orders" | Advisory or build engagement |
| 4 | Physical trading houses' analytics teams | Fundamentals agent output vs EIA prints | Data or tooling partnership |
| 5 | Bank commodity research and strats | The pipeline that drafts the morning note | Contract work, introductions |
| 6 | Specialist commodity recruiters | The one-page tear sheet | Placement or fractional roles |

First 20 messages go to segments 1 and 3 only. One personalised line per person.

## Message A — energy PM (wave one)

**Subject:** EIA Wednesdays, run by agents — timestamped before the print

> I've built an AI desk that trades a paper crude book: four analyst agents, a bull/bear debate, a
> PM that outputs JSON, and hard risk code it can't override. Every call is committed and
> timestamped before the market grades it, and it runs against a no-AI baseline. Last Wednesday it
> called crude stocks at [X] against a print of [Y]. Ten minutes on a screen-share? I'll show you
> the log — misses included.

## Message B — head of data or AI (wave one)

**Subject:** How I stopped my LLM cheating its own backtest

> LLM backtests mostly measure memory. So I don't run them: my crude desk runs forward only,
> inputs frozen, decisions timestamped, model pinned, and the model never touches the order API.
> Happy to walk you through the governance in ten minutes — it's the part most AI trading demos
> skip.

## Message C — wave two, after 60 trading days

**Subject:** 60 trading days, every call public

> Quick update on the AI crude desk: [N] trading days live, AI sleeves [+/−X%] against the
> baseline, net of costs, worst call [one line]. Full log and proofs here: [dashboard]. If your
> team has a question it argues about every week, I'll run it through the stack for two weeks.

Fill [X]/[Y] from `report/dashboard.json → calls_vs_prints`, [N] and [X%] from `stats`.

## Weekly cadence

- **Monday:** LinkedIn post "Machine vs baseline": last week's best and worst call, one chart.
- **Wednesday:** EIA forecast posted before 10:30 ET (from the 08:00 decision file), graded after.
- **Sunday:** Crude Oracle issue built from the post-mortem decision file.
- Draft follow-ups in Gmail; log replies against each contact in the CSV or Notion.
