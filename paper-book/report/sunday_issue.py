"""Assemble the Sunday Crude Oracle issue draft from the logs.

    python report/sunday_issue.py [--date YYYY-MM-DD]   -> report/sunday_issue_draft.md

Reads the Sunday post-mortem decision file (the reviewer's text and its JSON grades), the
week's daily/eia/cot decision files, and report/dashboard.json. Everything that exists in the
logs is filled in; everything editorial is left as a [fill: ...] marker for you. The output is
a draft for editing in the Crude Oracle voice, never published unedited.

House rules carried from prompts/desk-draft.md and docs/COMPLIANCE.md: information only, no
buy/sell/hold, every number with source and date, no licensed exchange prints, UK English,
losses included, no performance figures before 60 trading days.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import LOG, ROOT, now_ny, read_json  # noqa: E402

GRADE_LABEL = {"right_right": "right for the right reason", "right_wrong": "right for the wrong reason",
               "wrong_known": "wrong for a known risk", "wrong_unknown": "wrong for an unknown risk"}
DISCLAIMER = ("Simulated paper trading. No client money. Not investment advice. Past performance, actual or "
              "simulated, is not a reliable indicator of future results.")


def parse_postmortem(text: str) -> dict[str, Any]:
    if "```json" in text:
        try:
            return json.loads(text.split("```json", 1)[1].split("```", 1)[0])
        except Exception:
            pass
    return {"grades": [], "proposed_change": ""}


def build(sunday: dt.date) -> Path:
    pm_path = LOG / "decisions" / f"{sunday:%Y-%m-%d}-postmortem.json"
    pm = read_json(pm_path) or {}
    pm_text = pm.get("postmortem", "")
    pm_json = parse_postmortem(pm_text)
    grades = {g["decision_id"]: g for g in pm_json.get("grades", [])}
    monday = sunday - dt.timedelta(days=6)
    week = [read_json(p) for p in sorted(LOG.glob("decisions/*.json"))
            if monday.isoformat() <= p.name[:10] <= sunday.isoformat() and "postmortem" not in p.name]
    dash = read_json(ROOT / "report" / "dashboard.json") or {}
    calls = [c for c in dash.get("calls_vs_prints", []) if monday.isoformat() <= c["week"] <= sunday.isoformat()]
    approved = [(d, t) for d in week for t in d.get("risk_check", {}).get("approved", [])]
    rejected = [(d, r) for d in week for r in d.get("risk_check", {}).get("rejected", [])]
    no_trade = [d for d in week if d.get("status") == "no_trade"]
    best = [g for g in grades.values() if g["grade"] == "right_right"]
    worst = [g for g in grades.values() if g["grade"] in ("wrong_known", "wrong_unknown")]
    honest = [g for g in grades.values() if g["grade"] == "right_wrong"]
    show_perf = bool(dash.get("show_performance"))
    n_days = dash.get("trading_days", 0)

    L: list[str] = []
    L += [f"# The Crude Oracle — Sunday issue, {sunday:%-d %B %Y}", "",
          f"*Machine vs baseline, week ending {sunday:%-d %B}. Built from the desk's own log. Every loss included.*", "",
          "**Headline:** [fill: one line, the week's single most important read from the desk]", "",
          "## 1. The week in one paragraph", "",
          f"The desk ran {len(week)} scheduled decision{'s' if len(week) != 1 else ''} this week "
          f"({', '.join(sorted({d['run'] for d in week})) or 'none'}). The risk code approved {len(approved)} trade"
          f"{'s' if len(approved) != 1 else ''} and rejected {len(rejected)} proposal{'s' if len(rejected) != 1 else ''}; "
          f"{len(no_trade)} run{'s' if len(no_trade) != 1 else ''} ended in no trade. "
          "[fill: two sentences on what the market did, with source and date for any number]", ""]

    L += ["## 2. Wednesday's call against the print", ""]
    if calls:
        for c in calls:
            L += [f"- Week of {c['week']}: the fundamentals agent called US commercial crude stocks at **{c['forecast_kbbl']:+,.0f} kb** "
                  f"(range {c['range_kbbl'][0]:+,.0f} to {c['range_kbbl'][1]:+,.0f}) before 10:30 ET. The EIA printed **{c['actual_kbbl']:+,.0f} kb**. "
                  f"Error {c['error_kbbl']:+,.0f} kb, {'inside' if c['within_range'] else 'outside'} the range. "
                  "Source: EIA Weekly Petroleum Status Report; the desk's forecast is in the timestamped decision file."]
        L += ["", "![Calls versus prints](weekly_chart.png) *(run `make chart`)*", ""]
    else:
        L += ["[fill: no graded EIA call in the log for this week — say so plainly, or note the holiday shift]", ""]

    def trade_line(d: dict[str, Any], t: dict[str, Any]) -> str:
        legs = " / ".join(f"{l['side']} {l.get('qty', '?')} {l['symbol']} {l['month']}" for l in t["legs"])
        return f"{d['run_id']}: {legs} ({t['sleeve']}) — \"{t.get('thesis', '')}\""

    L += ["## 3. Best call", ""]
    if best:
        g = best[0]
        L += [f"**{g['decision_id']}** — graded *{GRADE_LABEL[g['grade']]}*: {g['note']}", "",
              "[fill: one paragraph — the thesis, the evidence it rested on, and why it was right for that reason]", ""]
    else:
        L += ["[fill: no call graded 'right for the right reason' this week — say so; a flat week is a finding]", ""]

    L += ["## 4. Worst call", ""]
    if worst:
        g = worst[0]
        L += [f"**{g['decision_id']}** — graded *{GRADE_LABEL[g['grade']]}*: {g['note']}", "",
              "[fill: one paragraph — what the desk believed, what happened, what it missed. No softening.]", ""]
    else:
        L += ["[fill: no losing call this week — state it, and note the sample is small]", ""]

    L += ["## 5. Right for the wrong reason", ""]
    L += [f"- **{g['decision_id']}**: {g['note']}" for g in honest] or ["None this week. [fill: delete or keep as a one-liner]"]
    L += ["", "## 6. What the risk code rejected, and why", ""]
    if rejected:
        for d, r in rejected:
            t = r.get("trade") or {}
            legs = " / ".join(f"{l.get('side', '?')} {l.get('symbol', '?')} {l.get('month', '?')}" for l in t.get("legs", []) if isinstance(l, dict)) if isinstance(t, dict) else "—"
            L.append(f"- {d['run_id']}: {legs or 'proposal'} — *{r['reason']}*")
    else:
        L.append("Nothing rejected this week.")
    L += ["", "The model proposes; the code disposes. Every rejection above is in the public log with the proposal it refused.", ""]

    L += ["## 7. Machine vs baseline", ""]
    if show_perf and dash.get("stats"):
        s = dash["stats"]
        L += [f"AI sleeves versus the no-AI baseline, net of costs, {n_days} trading days (simulated): "
              f"**{s.get('ai_minus_baseline_pct', 0):+.2f} points** "
              f"(AI {s['ai']['total_return_pct']:+.2f}%, baseline {s['baseline']['total_return_pct']:+.2f}%, "
              f"max drawdown AI {s['ai']['max_drawdown_pct']:.2f}%). Past performance, actual or simulated, is not a reliable indicator of future results.", ""]
    else:
        L += [f"Performance figures are withheld until 60 NYMEX trading days ({n_days} so far). Until then this section is about process: "
              "[fill: what the baseline sleeve did this week on its own signals — positions opened or closed, from the decision files' `baseline` block — and whether the AI sleeves agreed or disagreed with it]", ""]
    if approved:
        L += ["Trades approved this week:", ""] + [f"- {trade_line(d, t)}" for d, t in approved] + [""]

    L += ["## 8. What changes next week", "",
          (pm_json.get("proposed_change") or "[fill: the post-mortem's one prompt or data change]"), "",
          "Any change to a limit or the model is a dated revision in RULES.md, committed before it applies. Prompt wording changes are committed too; they are not revisions of the rules.", "",
          "## 9. Next week's calendar (America/New_York)", "",
          f"- Wednesday {sunday + dt.timedelta(days=3):%-d %b}: EIA Weekly Petroleum Status Report, 10:30. Desk forecast at 08:00, graded at 11:00.",
          f"- Friday {sunday + dt.timedelta(days=5):%-d %b}: CFTC Commitments of Traders, 15:30. Positioning run at 16:00.",
          "- [fill: OPEC+ meetings, holidays, expiries that shift the schedule]", "",
          "## 10. The log", "",
          f"- Post-mortem: `log/decisions/{sunday:%Y-%m-%d}-postmortem.json`"]
    L += [f"- {d['run_id']}: status {d['status']}" + (f", {d['no_trade_reason']}" if d.get('no_trade_reason') else "") +
          (f" — proof {d['proof']['stdout'].strip()}" if isinstance(d.get('proof'), dict) and d['proof'].get('stdout') else "") for d in week]
    L += ["- Dashboard: https://www.thecrudeoracle.com/paper-book", "", "---", "",
          "## Reviewer's notes (verbatim from the post-mortem agent, for editing)", "", "> " + pm_text.replace("\n", "\n> ") if pm_text else "[no post-mortem file for this Sunday]", "", "---", "",
          f"*{DISCLAIMER}* Data labels: EIA = public domain; CFTC = public, delayed (positions as of Tuesday); prices = the book's own settlement marks, not a licensed tape.", ""]
    out = ROOT / "report" / "sunday_issue_draft.md"
    out.write_text("\n".join(L))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", type=dt.date.fromisoformat, help="the Sunday (default: today in New York)")
    a = ap.parse_args()
    p = build(a.date or now_ny().date())
    print(f"wrote {p}")
