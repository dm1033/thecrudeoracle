"""Render the one chart for the Monday LinkedIn post: calls versus prints, last eight weeks.

    python report/weekly_chart.py            # from report/dashboard.json -> report/weekly_chart.png
    python report/weekly_chart.py --demo     # synthetic, watermarked, to check the layout before go-live

Form: one row per EIA week. A thin amber band is the fundamentals agent's forecast range, the
amber dot its point forecast, the blue dot the EIA print. Negative = draw (kbbl). Only the
latest week carries a direct label; the legend carries identity. Colours validated for the dark
surface with the dataviz palette checks (amber #c98500, blue #3987e5 on #10141b). No
performance numbers are drawn here, by design: this chart is allowed before the 60-day gate.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import ROOT, read_json  # noqa: E402

SURFACE, GRID = "#10141b", "#212936"
TEXT, TEXT2 = "#c3ccd8", "#8b98a9"
FORECAST, ACTUAL = "#c98500", "#3987e5"
DISCLAIMER = "Simulated paper trading. No client money. Not investment advice."


def render(rows: list[dict], out: Path, watermark: str | None = None) -> Path:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    rows = rows[-8:]
    n = len(rows)
    fig, ax = plt.subplots(figsize=(10, 5.625), dpi=160)   # 1600x900, LinkedIn-friendly 16:9
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.axvline(0, color=GRID, lw=1, zorder=1)
    ax.grid(axis="x", color=GRID, lw=1, zorder=0)
    ax.tick_params(colors=TEXT2, labelsize=10, length=0)

    ys = list(range(n))[::-1]
    for y, r in zip(ys, rows):
        lo, hi = r["range_kbbl"]
        ax.plot([lo, hi], [y, y], color=FORECAST, lw=6, alpha=0.25, solid_capstyle="round", zorder=2)
        ax.plot(r["forecast_kbbl"], y, "o", ms=9, color=FORECAST, mec=SURFACE, mew=2, zorder=4)
        ax.plot(r["actual_kbbl"], y, "o", ms=9, color=ACTUAL, mec=SURFACE, mew=2, zorder=4)
    if rows:
        last = rows[-1]
        ax.annotate(f"error {last['error_kbbl']:+,.0f} kb", xy=(last["actual_kbbl"], ys[-1]),
                    xytext=(8, 10), textcoords="offset points", color=TEXT, fontsize=10, ha="left")
    ax.set_yticks(ys)
    ax.set_yticklabels([r["week"] for r in rows], color=TEXT2)
    ax.set_xlabel("US commercial crude stocks, weekly change (thousand barrels; negative = draw)", color=TEXT2, fontsize=10)
    ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:+,.0f}"))

    ax.legend(handles=[Line2D([], [], marker="o", ms=8, color=FORECAST, lw=0, label="Desk forecast (before the print)"),
                       Line2D([], [], color=FORECAST, lw=6, alpha=0.25, label="Forecast range"),
                       Line2D([], [], marker="o", ms=8, color=ACTUAL, lw=0, label="EIA print")],
              loc="lower right", frameon=False, labelcolor=TEXT, fontsize=9)
    fig.text(0.04, 0.95, "Calls versus prints — the AI desk's EIA crude forecast against the number", color=TEXT, fontsize=14, weight="bold")
    fig.text(0.04, 0.905, f"Crude Oracle Paper Book · forecast committed and timestamped before 10:30 ET each Wednesday · {n} week{'s' if n != 1 else ''} shown",
             color=TEXT2, fontsize=10)
    fig.text(0.04, 0.02, DISCLAIMER, color=TEXT2, fontsize=9)
    fig.text(0.96, 0.02, "thecrudeoracle.com/paper-book", color=TEXT2, fontsize=9, ha="right")
    if watermark:
        fig.text(0.5, 0.5, watermark, color=TEXT2, fontsize=34, alpha=0.18, ha="center", va="center", rotation=20, weight="bold")
    fig.subplots_adjust(left=0.13, right=0.96, top=0.86, bottom=0.17)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=SURFACE)
    plt.close(fig)
    return out


def demo_rows() -> list[dict]:
    import random
    rng = random.Random(7)
    rows = []
    for i in range(6):
        week = dt.date(2026, 11, 4) + dt.timedelta(weeks=i)
        fc = rng.choice([-3200, -1800, -900, 400, 1500, -2600])
        actual = fc + rng.gauss(0, 1600)
        lo, hi = fc - 1500, fc + 1500
        rows.append({"week": week.isoformat(), "forecast_kbbl": fc, "range_kbbl": [lo, hi], "actual_kbbl": round(actual),
                     "error_kbbl": round(actual - fc), "within_range": lo <= actual <= hi})
    return rows


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--out", type=Path, default=ROOT / "report" / "weekly_chart.png")
    a = ap.parse_args()
    if a.demo:
        p = render(demo_rows(), a.out, watermark="ILLUSTRATIVE — SYNTHETIC DATA")
    else:
        d = read_json(ROOT / "report" / "dashboard.json") or {}
        rows = d.get("calls_vs_prints", [])
        if not rows:
            sys.exit("no graded EIA calls in report/dashboard.json yet; use --demo to preview the layout")
        p = render(rows, a.out)
    print(f"wrote {p}")
