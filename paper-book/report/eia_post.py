"""Fill the Wednesday EIA posts from the day's decision files.

    python report/eia_post.py [--date YYYY-MM-DD]   -> report/eia_post_<date>.md

Part 1 (post before 10:30 ET) comes from log/decisions/<date>-daily.json: the fundamentals
agent's EIA_FORECAST line, the commit hash from the proof step and the OpenTimestamps file.
Part 2 (post after the 11:00 ET run) comes from log/decisions/<date>-eia.json: the grading
block with the print and the error. If the eia file does not exist yet, part 2 is left with
its tokens so part 1 can go out on time.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import LOG, ROOT, now_ny, read_json  # noqa: E402

DISCLAIMER = "Simulated paper trading. No client money. Not investment advice."


def kb(v: float | None) -> str:
    return "[X]" if v is None else f"{v:+,.0f} kb"


def build(day: dt.date) -> Path:
    daily = read_json(LOG / "decisions" / f"{day:%Y-%m-%d}-daily.json") or {}
    eia = read_json(LOG / "decisions" / f"{day:%Y-%m-%d}-eia.json") or {}
    fc = daily.get("eia_forecast") or {}
    proof = daily.get("proof") or {}
    stamped = proof.get("stdout", "").strip()
    commit = stamped.split(" ")[1] if stamped.startswith("stamped") else "[commit]"
    ots = f"log/proofs/{day:%Y-%m-%d}-daily.json.ots" if stamped else "[ots proof]"
    g = eia.get("eia_grading") or {}
    actual = (g.get("actual") or {}).get("crude_ex_spr", {}).get("change_kbbl")
    err = g.get("crude_error_kbbl")
    in_range = g.get("crude_within_range")
    lo, hi = (fc.get("crude_range_kbbl") or [None, None])
    rng = f"{lo:+,.0f} to {hi:+,.0f} kb" if lo is not None else "[range]"
    gas, dist = fc.get("gasoline_kbbl"), fc.get("distillate_kbbl")
    week_n = "[n]"

    L = [f"# Wednesday EIA posts — {day:%A %-d %B %Y}", "",
         "## Part 1 — post before 10:30 ET (after the 08:00 run has stamped)", "",
         f"> **EIA Wednesday. The desk's call, on the record before the print.**", ">",
         f"> US commercial crude stocks: **{kb(fc.get('crude_kbbl'))}** (range {rng}).",
         f"> Gasoline {kb(gas)}. Distillate {kb(dist)}. Negative = draw.", ">",
         f"> Made by the AI desk at 08:00 ET from frozen EIA, CFTC and price data, committed and",
         f"> anchored before 10:30: commit `{commit}`, OpenTimestamps proof `{ots}`.", ">",
         f"> The print lands at 10:30. I'll grade it here at 11:00, miss or not.", ">",
         f"> thecrudeoracle.com/paper-book", ">", f"> {DISCLAIMER}", "",
         "## Part 2 — reply at 11:00 ET (after the eia run)", "",
         f"> **Graded.** EIA printed **{kb(actual)}** against the desk's {kb(fc.get('crude_kbbl'))}.",
         f"> Error {kb(err)}, {'inside' if in_range else 'outside' if in_range is not None else '[inside/outside]'} the range it gave.", ">",
         f"> [fill: one sentence on what the desk got right or wrong in the balance — refinery runs, exports, Cushing — from the eia run's fundamentals report]", ">",
         f"> Forecast and print both in the public log, week {week_n}. The 11:00 run re-read the print and {'approved ' + str(len(eia.get('risk_check', {}).get('approved', []))) + ' trade(s)' if eia else '[traded / stood aside]'}.", ">",
         f"> {DISCLAIMER}", "",
         "## Sources", "",
         f"- Forecast: `log/decisions/{day:%Y-%m-%d}-daily.json` → `eia_forecast`",
         f"- Grading: `log/decisions/{day:%Y-%m-%d}-eia.json` → `eia_grading`",
         "- Print: EIA Weekly Petroleum Status Report, https://www.eia.gov/petroleum/supply/weekly/", ""]
    out = ROOT / "report" / f"eia_post_{day:%Y-%m-%d}.md"
    out.write_text("\n".join(L))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", type=dt.date.fromisoformat)
    a = ap.parse_args()
    print(f"wrote {build(a.date or now_ny().date())}")
