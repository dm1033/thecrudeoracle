"""Collect EIA weekly stocks and daily spot for the fundamentals analyst (frozen inputs).

Usage:
  python data/collect_eia.py --out log/inputs/<run-id>      # write eia.json
  python data/collect_eia.py --verify                        # confirm every series ID resolves
  python data/collect_eia.py --actual 2026-11-04             # the print for grading a forecast

Series IDs live in config.yaml. The playbook says to confirm them before relying on them;
`--verify` does that against the live API with your key.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import statistics
import sys
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import StepFailed, load_config, write_json  # noqa: E402


def _key() -> str:
    key = os.environ.get("EIA_API_KEY", "").strip()
    if not key or key == "replace_me":
        raise StepFailed("EIA_API_KEY is not set")
    return key


def fetch_series(series_id: str, length: int, cfg: dict[str, Any]) -> list[dict[str, Any]]:
    url = f"{cfg['eia']['base_url']}/seriesid/{series_id}"
    r = requests.get(url, params={"api_key": _key(), "length": length}, timeout=60)
    if r.status_code != 200:
        raise StepFailed(f"EIA {series_id}: HTTP {r.status_code} {r.text[:200]}")
    rows = (r.json().get("response") or {}).get("data") or []
    if not rows:
        raise StepFailed(f"EIA {series_id}: no data")
    rows = [{"period": x["period"], "value": float(x["value"])} for x in rows if x.get("value") is not None]
    rows.sort(key=lambda x: x["period"])  # oldest first
    return rows


def _same_week_prior_years(rows: list[dict[str, Any]], years: int = 5) -> list[float]:
    """Values from the same calendar week in each of the prior N years (5-year range)."""
    if not rows:
        return []
    latest = dt.date.fromisoformat(rows[-1]["period"])
    out: list[float] = []
    by_date = {dt.date.fromisoformat(r["period"]): r["value"] for r in rows}
    for y in range(1, years + 1):
        target = latest - dt.timedelta(days=364 * y)
        # nearest observation within 4 days
        best = None
        for d, v in by_date.items():
            if abs((d - target).days) <= 4 and (best is None or abs((d - target).days) < abs((best[0] - target).days)):
                best = (d, v)
        if best:
            out.append(best[1])
    return out


def summarise(name: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    last12 = rows[-12:]
    latest = rows[-1]["value"]
    prev = rows[-2]["value"] if len(rows) > 1 else None
    prior = _same_week_prior_years(rows)
    return {
        "series": name,
        "latest_period": rows[-1]["period"],
        "latest": latest,
        "change_vs_last_week": None if prev is None else round(latest - prev, 3),
        "last_year_same_week": prior[0] if prior else None,
        "change_vs_last_year": None if not prior else round(latest - prior[0], 3),
        "five_year_avg_same_week": None if not prior else round(statistics.mean(prior), 3),
        "five_year_min_same_week": None if not prior else min(prior),
        "five_year_max_same_week": None if not prior else max(prior),
        "last_12_weeks": last12,
    }


def collect(out_dir: Path, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    cfg = cfg or load_config()
    weeks = int(cfg["eia"]["weeks_of_history"])
    out: dict[str, Any] = {"source": "EIA Open Data API v2", "fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                           "units": {"stocks": "kbbl", "flows": "kb/d", "refinery_util": "%", "spot": "USD/bbl"},
                           "weekly": {}, "daily_spot": {}}
    for name, sid in cfg["eia"]["weekly_series"].items():
        out["weekly"][name] = summarise(sid, fetch_series(sid, weeks, cfg))
    for name, sid in cfg["eia"]["daily_spot"].items():
        rows = fetch_series(sid, 260, cfg)
        out["daily_spot"][name] = {"series": sid, "last_60": rows[-60:]}
    write_json(out_dir / "eia.json", out)
    return out


def actual_print(cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    """Latest weekly changes (kbbl) for grading the fundamentals agent's forecast."""
    cfg = cfg or load_config()
    res: dict[str, Any] = {}
    for key in ("crude_ex_spr", "gasoline", "distillate"):
        rows = fetch_series(cfg["eia"]["weekly_series"][key], 3, cfg)
        res[key] = {"period": rows[-1]["period"], "change_kbbl": round(rows[-1]["value"] - rows[-2]["value"], 1)}
    return res


def verify(cfg: dict[str, Any] | None = None) -> int:
    cfg = cfg or load_config()
    bad = 0
    for group in ("weekly_series", "daily_spot"):
        for name, sid in cfg["eia"][group].items():
            try:
                rows = fetch_series(sid, 2, cfg)
                print(f"OK   {name:18s} {sid:10s} latest {rows[-1]['period']} = {rows[-1]['value']}")
            except StepFailed as e:
                bad += 1
                print(f"FAIL {name:18s} {sid:10s} {e}")
    return bad


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path)
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--actual", action="store_true")
    a = ap.parse_args()
    if a.verify:
        sys.exit(1 if verify() else 0)
    if a.actual:
        print(actual_print())
        sys.exit(0)
    if not a.out:
        ap.error("--out is required")
    collect(a.out)
    print(f"wrote {a.out / 'eia.json'}")
