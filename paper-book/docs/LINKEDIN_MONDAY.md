# The Monday LinkedIn post — "Machine vs baseline"

One post every Monday from the first live week. Same shape every time so readers learn the
rhythm: what the desk called last week, the best call, the worst call, one chart, one line on
what changes. First person, short, every loss included. No performance figures until 60
trading days (about 28 January 2027); after that, AI versus baseline only, net of costs, sample
size stated.

**Rules that apply to every post** (docs/COMPLIANCE.md): "paper book", never "fund"; no
"returns", "investors" or anything that reads as an offer; no live exchange prices; the
disclaimer line at the end in the body, not an image. Misses are mentioned on purpose.

**Chart:** `make chart` renders `report/weekly_chart.png` (calls versus prints, last eight EIA
weeks) from `report/dashboard.json`. `python report/weekly_chart.py --demo` previews the layout
with watermarked synthetic data. Attach the PNG as the single image.

**Fill from** `report/dashboard.json` and the Sunday post-mortem decision file
(`log/decisions/<sunday>-postmortem.json`):

| Token | Source |
|---|---|
| `[week]` | the Monday's date, e.g. "w/c 9 Nov" |
| `[X]`, `[Y]`, `[E]` | `calls_vs_prints[-1]` → forecast, actual, error (kbbl) |
| `[best]`, `[worst]` | post-mortem grades: the best "right for the right reason", the worst "wrong for a known risk" or "wrong for an unknown risk", each in one line with its thesis |
| `[rejected]` | count of PM proposals the risk check rejected last week (`decision_log[].rejected`) |
| `[change]` | post-mortem `proposed_change` |
| `[n]` | `trading_days` |

---

## Template (standard week)

> **Machine vs baseline, [week].**
>
> I run a paper crude book with an AI desk: four analyst agents, a bull/bear debate, a PM that
> outputs JSON, and risk code it can't override. Every call is timestamped before the market
> grades it. A no-AI trend-and-carry sleeve runs beside it as the control. Week [n of weeks].
>
> **Wednesday's call:** crude stocks [X] kb against a print of [Y] kb. Error [E] kb.
>
> **Best call:** [best — one line, with the thesis that was right and why]
>
> **Worst call:** [worst — one line, with the thesis that was wrong and what the post-mortem
> says it missed]
>
> **Risk check:** [rejected] of the PM's proposals rejected by the code last week. Every rejection
> is in the public log with its reason.
>
> **What changes this week:** [change]
>
> Full log, frozen inputs and timestamp proofs: thecrudeoracle.com/paper-book
>
> Simulated paper trading. No client money. Not investment advice.
>
> #crudeoil #energytrading #AI #EIA

After 60 trading days, add one line above the disclaimer:
> **AI sleeves vs baseline, net of costs, [n] trading days:** [±X.X] points. Simulated; past
> performance, actual or simulated, is not a reliable indicator of future results.

---

## Variant 0 — Monday 12 October 2026 (optional, pre-launch)

The playbook holds public posting until week six. This one is a process post with nothing to
claim, which is why it is defensible early; post it only if you want the pre-registration on the
record before day one. No chart; link to RULES.md instead.

> **I've written the rules before the first trade, on purpose.**
>
> Most AI trading demos are backtests the model has already memorised. A language model trained
> on 2024 text already knows how 2023 markets moved. So I'm not running one.
>
> Instead: a paper crude book, forward only, starting 2 November. Four analyst agents read
> frozen data, argue bull versus bear, a PM agent proposes trades as JSON, and deterministic
> code sizes, accepts or rejects every one. The model never touches the order API. Every
> decision is committed and timestamped before the EIA print grades it. A plain trend-and-carry
> sleeve with no AI runs alongside as the control group.
>
> The mandate, the risk limits and the schedule are committed today, in public, before day one.
> Nothing gets edited quietly; every change is a dated revision. Performance numbers appear
> after 60 trading days and not before, and the losses stay in the log.
>
> From 9 November I'll post every Monday: last week's best call, worst call, and what the
> control group did.
>
> Rules: github.com/dm1033/thecrudeoracle/blob/main/paper-book/RULES.md
>
> Simulated paper trading. No client money. Not investment advice.
>
> #crudeoil #energytrading #AI #EIA

---

## Variant 1 — Monday 9 November 2026 (first live week)

There is no prior week to compare and only one EIA Wednesday (4 November) in the log, so the
post leads with the single call and the first rejections. Chart: `make chart` with one row.

> **Machine vs baseline, week one.**
>
> The paper crude book went live on Monday. Four analyst agents, a bull/bear debate, a PM that
> outputs JSON, risk code it can't override, and a no-AI trend-and-carry sleeve as the control.
> Every call timestamped before the market grades it.
>
> **Wednesday's call:** at 08:00 ET the desk called crude stocks at [X] kb. The EIA printed [Y] kb
> at 10:30. Error [E] kb, [inside / outside] the range it gave. The forecast was committed and
> stamped two and a half hours before the number.
>
> **Best call:** [best]
>
> **Worst call:** [worst] — first week, first miss, and it's in the log with the reasoning that
> produced it.
>
> **Risk check:** [rejected] of the PM's proposals rejected by the code. One was [the most
> instructive rejection reason, e.g. "stop on the wrong side of entry"]. That is what the code is
> for.
>
> **The control group** [opened / stayed flat in] [products] on its own signals. I'll only ever
> report the AI sleeves against it, never on their own.
>
> **What changes this week:** [change]
>
> Full log, frozen inputs and timestamp proofs: thecrudeoracle.com/paper-book
>
> Simulated paper trading. No client money. Not investment advice.
>
> #crudeoil #energytrading #AI #EIA

---

## Checklist before posting

- [ ] Sunday post-mortem ran and `report/dashboard.json` is refreshed (`./run.sh postmortem`).
- [ ] `[X]`/`[Y]`/`[E]` match `calls_vs_prints[-1]` exactly; do not round the print.
- [ ] The worst call is a real loss or miss from the log, not a soft one.
- [ ] No "returns", "fund", "investors", no performance figure before 60 trading days.
- [ ] Chart attached is this week's `weekly_chart.png`, not the demo.
- [ ] Disclaimer line present as text.
- [ ] Log the post date in `docs/contacts_template.csv` notes or the Crude Oracle content calendar.
