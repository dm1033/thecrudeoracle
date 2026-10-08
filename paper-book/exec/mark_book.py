"""Mark the book at settlement and append the day's return to log/nav/<date>.json and book.json.

    python exec/mark_book.py [--prices log/inputs/<run-id>/prices.json]

Returns are attributed per sleeve (ai = event + spread, baseline) so the tear sheet can show
"AI versus baseline". Stops are checked against the day's low/high and, if hit, the position
is flagged `stop_hit` for the next run to close (the run logs it; nothing closes silently).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import LOG, load_book, load_config, now_ny, read_json, save_book, write_json  # noqa: E402


def mark(book: dict[str, Any], prices: dict[str, Any], cfg: dict[str, Any], date: str) -> dict[str, Any]:
    pnl = {"event": 0.0, "spread": 0.0, "baseline": 0.0}
    for pos in book["positions"]:
        for leg in pos["legs"]:
            base = "CL" if leg["symbol"] == "MCL" else leg["symbol"]
            prod = prices["products"].get(base)
            if not prod:
                continue
            bar = prod["front"]["bars"][-1] if prod["front"]["month"] == leg["month"] else None
            if bar is None:
                continue
            settle = float(bar["close"])
            mult = cfg["products"][leg["symbol"]]["multiplier"]
            sign = 1 if leg["side"] == "BUY" else -1
            pnl[pos["sleeve"]] += sign * (settle - float(leg["last_mark"])) * mult * int(leg["qty"])
            leg["last_mark"] = settle
        lead = pos["legs"][0]
        if pos["structure"] == "outright":
            lo, hi = float(prod["front"]["bars"][-1]["low"]), float(prod["front"]["bars"][-1]["high"])
            if (lead["side"] == "BUY" and lo <= float(pos["stop"])) or (lead["side"] == "SELL" and hi >= float(pos["stop"])):
                pos["stop_hit"] = date
    nav_before = float(book["nav"])
    total = sum(pnl.values())
    book["nav"] = nav_before + total
    book["peak_nav"] = max(float(book["peak_nav"]), book["nav"])
    rec = {"date": date, "nav": round(book["nav"], 2), "pnl_usd": {k: round(v, 2) for k, v in pnl.items()},
           "ret": total / nav_before if nav_before else 0.0,
           "ret_ai": (pnl["event"] + pnl["spread"]) / nav_before if nav_before else 0.0,
           "ret_baseline": pnl["baseline"] / nav_before if nav_before else 0.0,
           "open_positions": len(book["positions"]), "stops_hit": [p["id"] for p in book["positions"] if p.get("stop_hit") == date]}
    book["daily_returns"] = [r for r in book.get("daily_returns", []) if r["date"] != date] + [rec]
    return rec


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--prices", type=Path)
    a = ap.parse_args()
    when = now_ny()
    prices_path = a.prices or (LOG / "inputs" / f"{when:%Y-%m-%d}-daily" / "prices.json")
    prices = read_json(prices_path)
    if prices is None:
        sys.exit(f"no prices at {prices_path}")
    book = load_book()
    rec = mark(book, prices, load_config(), f"{when:%Y-%m-%d}")
    save_book(book)
    write_json(LOG / "nav" / f"{rec['date']}.json", rec)
    print(rec)
