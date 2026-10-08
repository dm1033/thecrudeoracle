"""Build the tear sheet and the dashboard data file from the logs.

    python report/tearsheet.py

Reads log/nav/*.json (daily returns per sleeve), log/decisions/*.json and log/book.json.
Writes report/dashboard.json (consumed by the site's /paper-book route), report/tearsheet.md
and, when quantstats is installed, report/tearsheet.html.

Net-of-cost returns subtract the estimated slippage and commission recorded on each fill
(limits.yaml) on the day the position opened and the day it closed. Performance statistics
are published only once `trading_days >= 60`; before that the file carries the process
(decision log, calls vs prints) and `show_performance: false`.
"""
from __future__ import annotations

import datetime as dt
import math
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import LOG, ROOT, load_book, load_config, load_limits, read_json, write_json  # noqa: E402

MIN_DAYS_FOR_STATS = 60
DISCLAIMER = ("Simulated paper trading. No client money. Not investment advice. Past performance, actual or "
              "simulated, is not a reliable indicator of future results.")


def _stats(rets: list[float]) -> dict[str, Any]:
    n = len(rets)
    if n == 0:
        return {}
    cum = 1.0
    peak = 1.0
    mdd = 0.0
    for r in rets:
        cum *= 1 + r
        peak = max(peak, cum)
        mdd = min(mdd, cum / peak - 1)
    mu = sum(rets) / n
    sd = math.sqrt(sum((x - mu) ** 2 for x in rets) / (n - 1)) if n > 1 else 0.0
    return {"trading_days": n, "total_return_pct": round((cum - 1) * 100, 2),
            "annualised_vol_pct": round(sd * math.sqrt(252) * 100, 2),
            "sharpe": round((mu / sd) * math.sqrt(252), 2) if sd > 0 else None,
            "max_drawdown_pct": round(mdd * 100, 2),
            "hit_rate_days_pct": round(sum(1 for r in rets if r > 0) / n * 100, 1)}


def build() -> dict[str, Any]:
    cfg, limits, book = load_config(), load_limits(), load_book()
    navs = [read_json(p) for p in sorted(LOG.glob("nav/*.json"))]
    decisions = [read_json(p) for p in sorted(LOG.glob("decisions/*.json"))]
    closed = book.get("closed_positions", [])

    # cost drag by date: open-day and close-day one-side costs
    cost_by_date: dict[str, float] = {}
    for p in book["positions"] + closed:
        d_open = p["opened"][:10]
        cost_by_date[d_open] = cost_by_date.get(d_open, 0.0) + float(p.get("costs_usd", 0.0))
        if p.get("closed"):
            d_close = p["closed"]["run_id"][:10]
            cost_by_date[d_close] = cost_by_date.get(d_close, 0.0) + float(p.get("costs_usd", 0.0))

    curve = []
    nav_ai = nav_base = nav_total = 100.0
    gross_total = 100.0
    rets_total, rets_ai, rets_base = [], [], []
    for r in navs:
        drag = cost_by_date.get(r["date"], 0.0) / max(float(book["starting_nav"]), 1.0)
        rt, ra, rb = r["ret"] - drag, r["ret_ai"] - drag * 0.5, r["ret_baseline"] - drag * 0.5
        rets_total.append(rt); rets_ai.append(ra); rets_base.append(rb)
        nav_total *= 1 + rt; nav_ai *= 1 + ra; nav_base *= 1 + rb; gross_total *= 1 + r["ret"]
        curve.append({"date": r["date"], "total_net": round(nav_total, 3), "ai_net": round(nav_ai, 3),
                      "baseline_net": round(nav_base, 3), "total_gross": round(gross_total, 3)})

    trades = [{"id": p["id"], "sleeve": p["sleeve"], "opened": p["opened"], "closed": p.get("closed", {}).get("run_id"),
               "legs": [f"{l['side']} {l['qty']} {l['symbol']} {l['month']}" for l in p["legs"]],
               "entry": p["entry"], "stop": p["stop"], "target": p["target"], "thesis": p.get("thesis", ""),
               "kill_criteria": p.get("kill_criteria", ""), "risk_usd": p.get("risk_usd")} for p in closed + book["positions"]]

    grades: dict[str, str] = {}
    for d in decisions:
        pm = d.get("postmortem")
        if pm and "```json" in pm:
            try:
                import json
                block = pm.split("```json", 1)[1].split("```", 1)[0]
                for g in json.loads(block).get("grades", []):
                    grades[g["decision_id"]] = g["grade"]
            except Exception:
                pass

    log_rows = []
    calls_vs_prints = []
    for d in decisions:
        if d.get("run") == "postmortem":
            continue
        rc = d.get("risk_check", {})
        log_rows.append({
            "run_id": d["run_id"], "date": d["date"], "run": d["run"], "status": d["status"],
            "model": d.get("model_pinned"), "approved": len(rc.get("approved", [])), "rejected": len(rc.get("rejected", [])),
            "no_trade_reason": d.get("no_trade_reason", ""),
            "theses": [t.get("thesis", "") for t in rc.get("approved", [])],
            "rejections": [r.get("reason", "") for r in rc.get("rejected", [])],
            "commit": (d.get("proof") or {}).get("stdout", "").strip().split(" ")[1] if (d.get("proof") or {}).get("stdout", "").startswith("stamped") else None,
            "ots": f"log/proofs/{d['run_id']}.json.ots" if d.get("proof") and not d["proof"].get("error") else None,
            "grade": grades.get(d["run_id"]),
        })
        g = d.get("eia_grading")
        if g:
            calls_vs_prints.append({"week": g["actual"]["crude_ex_spr"]["period"], "forecast_kbbl": g["forecast"]["crude_kbbl"],
                                    "range_kbbl": g["forecast"]["crude_range_kbbl"], "actual_kbbl": g["actual"]["crude_ex_spr"]["change_kbbl"],
                                    "error_kbbl": g["crude_error_kbbl"], "within_range": g["crude_within_range"]})

    n = len(rets_total)
    show = n >= MIN_DAYS_FOR_STATS
    inception = navs[0]["date"] if navs else None
    stats = {"total": _stats(rets_total), "ai": _stats(rets_ai), "baseline": _stats(rets_base)} if show else {}
    if show and stats["ai"] and stats["baseline"]:
        stats["ai_minus_baseline_pct"] = round(stats["ai"]["total_return_pct"] - stats["baseline"]["total_return_pct"], 2)

    risk_used = {
        "open_ai_trades": sum(1 for p in book["positions"] if p["sleeve"] in ("event", "spread")),
        "max_open_ai_trades": limits["max_open_ai_trades"],
        "drawdown_pct": round((book["nav"] / book["peak_nav"] - 1) * 100, 2),
        "drawdown_stepdown_pct": limits["drawdown_stepdown_pct"], "drawdown_stop_pct": limits["drawdown_stop_pct"],
        "gross_exposure_x_nav": round(sum(abs(int(l["qty"]) * float(l.get("last_mark") or l["fill"]) * cfg["products"][l["symbol"]]["multiplier"])
                                          for p in book["positions"] for l in p["legs"]) / float(book["nav"]), 3),
        "gross_exposure_max_x_nav": limits["gross_exposure_max_x_nav"],
    }

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "book_name": cfg["book_name"], "disclaimer": DISCLAIMER,
        "inception": inception, "trading_days": n, "min_days_for_stats": MIN_DAYS_FOR_STATS, "show_performance": show,
        "model_pinned": cfg["model"]["id"], "stats": stats, "curve": curve, "risk_used": risk_used,
        "open_positions": [t for t in trades if not t["closed"]], "trades": trades,
        "decision_log": list(reversed(log_rows))[:200], "calls_vs_prints": calls_vs_prints,
        "costs_note": f"Net figures subtract {limits['slippage_ticks_per_side']} tick slippage per side plus USD {limits['commission_usd_per_side']} commission per side.",
    }
    write_json(ROOT / "report" / "dashboard.json", out)

    md = [f"# {cfg['book_name']} — tear sheet", "", f"**{DISCLAIMER}**", "",
          f"Inception: {inception or 'not live'} · Trading days: {n} · Model: {cfg['model']['id']}", ""]
    if show:
        md += ["| Sleeve | Return % | Vol % | Sharpe | Max DD % | Hit rate (days) % |", "|---|---|---|---|---|---|"]
        for k in ("total", "ai", "baseline"):
            s = stats[k]
            md.append(f"| {k} | {s['total_return_pct']} | {s['annualised_vol_pct']} | {s['sharpe']} | {s['max_drawdown_pct']} | {s['hit_rate_days_pct']} |")
        md += ["", f"AI minus baseline: {stats.get('ai_minus_baseline_pct')} percentage points (sample: {n} trading days).", ""]
    else:
        md += [f"Performance statistics are withheld until {MIN_DAYS_FOR_STATS} trading days (currently {n}).", ""]
    md += [out["costs_note"], "", "## Calls versus prints (crude, kbbl)", "", "| Week | Forecast | Range | Actual | Error | In range |", "|---|---|---|---|---|---|"]
    md += [f"| {c['week']} | {c['forecast_kbbl']} | {c['range_kbbl'][0]}..{c['range_kbbl'][1]} | {c['actual_kbbl']} | {c['error_kbbl']} | {'yes' if c['within_range'] else 'no'} |" for c in calls_vs_prints] or ["| — | | | | | |"]
    (ROOT / "report" / "tearsheet.md").write_text("\n".join(md) + "\n")

    try:
        import pandas as pd
        import quantstats as qs
        if show:
            idx = pd.to_datetime([r["date"] for r in navs])
            qs.reports.html(pd.Series(rets_ai, index=idx), benchmark=pd.Series(rets_base, index=idx),
                            output=str(ROOT / "report" / "tearsheet.html"), title=f"{cfg['book_name']} — AI sleeves vs baseline (simulated)")
    except Exception as e:  # quantstats is optional; the markdown and JSON are the record
        print(f"quantstats html skipped: {e}")
    return out


if __name__ == "__main__":
    o = build()
    print(f"dashboard.json: {o['trading_days']} trading days, show_performance={o['show_performance']}, "
          f"{len(o['decision_log'])} decisions, {len(o['calls_vs_prints'])} graded EIA calls")
