# The Sunday Crude Oracle issue — "Machine vs baseline"

Every Sunday from the first live week, after `./run.sh postmortem`. The issue is the written
record of the week: what the desk called, what the print said, the best and worst call with
their grades, what the code refused, what the control group did, and what changes. First
person, short, every loss included. It is market commentary and a process report, never a
recommendation.

**Build it:** `make issue` writes `report/sunday_issue_draft.md` with every section the logs can
fill already filled and a `[fill: ...]` marker wherever a sentence needs you. Edit, then publish
through the site's daily-briefing flow or the newsletter.

**House rules** (prompts/desk-draft.md, docs/COMPLIANCE.md):

- Information and education only. No buy/sell/hold, no "safe", no "guaranteed".
- Every number carries a source and a date. EIA and CFTC are public; prices are the book's own
  settlement marks, labelled as such. No licensed exchange or PRA prints.
- "Paper book", never "fund". No "returns", "investors" or anything that reads as an offer.
- No performance figures before 60 NYMEX trading days (about 28 January 2027). After that, AI
  versus baseline only, net of costs, sample size stated, FCA simulated-performance wording.
- UK English. Losses first when there are losses.

## Sections (fixed, in this order)

| # | Section | Filled from |
|---|---|---|
| — | Headline | you |
| 1 | The week in one paragraph | decision counts from the week's files; market sentences from you |
| 2 | Wednesday's call against the print | `dashboard.json → calls_vs_prints`; chart from `make chart` |
| 3 | Best call | post-mortem grade `right_right` + its note |
| 4 | Worst call | post-mortem grade `wrong_known` / `wrong_unknown` + its note |
| 5 | Right for the wrong reason | post-mortem grade `right_wrong` |
| 6 | What the risk code rejected, and why | `risk_check.rejected[].reason` across the week |
| 7 | Machine vs baseline | process until day 60; `dashboard.json → stats` after |
| 8 | What changes next week | post-mortem `proposed_change` |
| 9 | Next week's calendar | computed; OPEC+ and holidays from you |
| 10 | The log | run ids, statuses, proof lines |
| — | Reviewer's notes | the post-mortem agent's text, verbatim, for you to edit against |
| — | Disclaimer and data labels | fixed |

Section 5 is deliberate. "Right for the wrong reason" is the category most desks never
publish; publishing it is the point.

---

## Variant 0 — Sunday 11 October 2026 (optional, pre-launch)

No log exists yet, so this is the one issue that is not built by `make issue`. It introduces
the paper book to readers in the same terms as the pre-launch LinkedIn post. Post it only if
you want readers warned before 2 November; the playbook holds public posting until week six.

> # The Crude Oracle — Sunday issue, 11 October 2026
>
> *I've written the rules before the first trade. Here is what starts on 2 November.*
>
> **Headline:** An AI crude desk that has to show its working before the market marks it.
>
> **What it is.** A simulated paper book in WTI, Brent, RBOB and ULSD. Four analyst agents read
> frozen data (EIA stocks, CFTC positioning, timestamped headlines, daily bars), two more argue
> bull against bear, and a PM agent proposes zero to three trades as JSON. Deterministic code
> then sizes, accepts or rejects every one against limits that are already public. The model
> never touches the order API.
>
> **Why forward-only.** A language model trained on 2024 text already knows how 2023 markets
> moved, so a backtest mostly measures memory. There will be no LLM backtest here. Inputs are
> frozen with a hash, decisions are committed and anchored with OpenTimestamps before 10:30 ET
> on a Wednesday, and the model version is pinned and logged.
>
> **The control group.** A plain trend-plus-carry sleeve with no AI runs on the same schedule
> through the same risk code. The only claim I will ever make is "AI sleeves versus that". Not
> raw numbers, and not before 60 trading days.
>
> **What you'll get on Sundays.** Wednesday's call against the print. The best call and the
> worst, each graded: right for the right reason, right for the wrong reason, wrong for a known
> risk, wrong for an unknown risk. What the code refused. What changes next week. Every loss.
>
> **The rules.** github.com/dm1033/thecrudeoracle/blob/main/paper-book/RULES.md. The dashboard
> is at thecrudeoracle.com/paper-book and shows the process from day one.
>
> *Simulated paper trading. No client money. Not investment advice. Past performance, actual
> or simulated, is not a reliable indicator of future results.*

---

## Variant 1 — Sunday 8 November 2026 (first live week)

Run `python report/sunday_issue.py --date 2026-11-08` after the post-mortem. The generator fills sections 1, 2,
6, 9 and 10 from the log and leaves the rest marked. The editorial frame for week one:

- **Headline:** the Wednesday call in one line, honestly — e.g. "Called a [X] kb draw, got
  [Y]; here's why" or "Missed the print by [E] kb on day three; the log shows where".
- **Section 1:** say it is week one and the sample is five trading days. Name the first
  rejection by the risk code as the week's most useful event if the PM proposed nothing
  memorable.
- **Section 3 / 4:** with one week of calls, "best" and "worst" may be the same trade seen two
  ways. Say so rather than inventing a second.
- **Section 7:** process only. What the baseline sleeve opened on its first signals, and whether
  the AI sleeves agreed with it. No figures.
- **Section 8:** the post-mortem's single proposed change, and the commit that carries it.
- **Close:** one line pointing at the Monday LinkedIn post and the dashboard.

## Checklist before publishing

- [ ] `./run.sh postmortem` has run and `report/dashboard.json` is refreshed.
- [ ] Every `[fill: ...]` marker is gone.
- [ ] Every number has a source and a date; the EIA figures match `calls_vs_prints` exactly.
- [ ] The worst call is a real miss from the log, graded, not softened.
- [ ] No "fund", "returns", "investors"; no performance figure before day 60.
- [ ] The chart is this week's `weekly_chart.png`, not the demo.
- [ ] Disclaimer and data labels present as text.
- [ ] Add the issue to `data/daily-briefing.json` or the newsletter per `docs/DAILY_UPDATE_GUIDE.md`.
