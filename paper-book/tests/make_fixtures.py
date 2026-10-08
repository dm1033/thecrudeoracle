"""Generate deterministic synthetic fixtures for offline dry runs and tests.

    python tests/make_fixtures.py

The numbers are SYNTHETIC. They exist so the pipeline can be exercised end to end with no
network, no gateway and no API key. They must never be mistaken for market data.
"""
from __future__ import annotations

import datetime as dt
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import load_config, load_limits  # noqa: E402
from data.collect_prices import indicators  # noqa: E402
from risk.contracts import tradeable_months  # noqa: E402

OUT = Path(__file__).resolve().parent / "fixtures"
TODAY = dt.date(2026, 11, 4)  # a Wednesday: EIA day
rng = random.Random(20261104)


def bars(start: float, n: int = 300, drift: float = 0.0002, vol: float = 0.02):
    out, px, d = [], start, TODAY - dt.timedelta(days=int(n * 1.45))
    while len(out) < n:
        d += dt.timedelta(days=1)
        if d.weekday() >= 5:
            continue
        r = rng.gauss(drift, vol)
        o = px
        px = max(0.5, px * (1 + r))
        hi, lo = max(o, px) * (1 + abs(rng.gauss(0, 0.004))), min(o, px) * (1 - abs(rng.gauss(0, 0.004)))
        out.append({"date": d.isoformat(), "open": round(o, 4), "high": round(hi, 4), "low": round(lo, 4), "close": round(px, 4), "volume": float(rng.randint(50000, 300000))})
    return out


def main() -> None:
    cfg, limits = load_config(), load_limits()
    OUT.mkdir(exist_ok=True)
    prices = {"source": "SYNTHETIC FIXTURE — not market data", "data_type": "synthetic", "as_of": TODAY.isoformat(), "products": {}}
    for sym, start, back in (("CL", 62.0, 0.35), ("BZ", 66.0, 0.30), ("RB", 1.95, 0.01), ("HO", 2.25, -0.01)):
        months = tradeable_months(cfg["products"][sym]["expiry_rule"], TODAY, int(limits["roll_business_days_before_ltd"]))
        b = bars(start)
        front = {"month": months[0], "ib_last_trade_date": None, "bars": b, **indicators(b)}
        second_close = round(front["last_close"] - back, 4)
        second = {"month": months[1], "last_close": second_close}
        prices["products"][sym] = {"tradeable_months": months, "front": front, "second": second,
                                   "term_structure_front_minus_second": round(front["last_close"] - second_close, 4),
                                   "curve": "backwardation" if back > 0 else "contango"}
    (OUT / "prices.json").write_text(json.dumps(prices, indent=1, sort_keys=True))

    def weekly(level: float, n: int = 12, step: float = 1500):
        d = TODAY - dt.timedelta(days=TODAY.weekday() + 2)  # last Friday
        rows = []
        for i in range(n):
            rows.append({"period": (d - dt.timedelta(weeks=n - 1 - i)).isoformat(), "value": round(level + rng.gauss(0, step) + i * 200, 1)})
        return rows

    def series(name: str, level: float, unit_step: float):
        rows = weekly(level, 12, unit_step)
        return {"series": name, "latest_period": rows[-1]["period"], "latest": rows[-1]["value"],
                "change_vs_last_week": round(rows[-1]["value"] - rows[-2]["value"], 1), "last_year_same_week": round(level * 0.97, 1),
                "change_vs_last_year": round(rows[-1]["value"] - level * 0.97, 1), "five_year_avg_same_week": round(level * 1.01, 1),
                "five_year_min_same_week": round(level * 0.92, 1), "five_year_max_same_week": round(level * 1.08, 1), "last_12_weeks": rows}

    eia = {"source": "SYNTHETIC FIXTURE — not EIA data", "fetched_at": "fixture", "units": {"stocks": "kbbl", "flows": "kb/d", "refinery_util": "%", "spot": "USD/bbl"},
           "weekly": {"crude_ex_spr": series("WCESTUS1", 420000, 2500), "cushing": series("WCESTOK1", 24000, 600),
                      "gasoline": series("WGTSTUS1", 215000, 1800), "distillate": series("WDISTUS1", 118000, 1500),
                      "refinery_util": series("WPULEUS3", 88.5, 0.8), "crude_imports": series("WCRIMUS2", 6200, 300),
                      "crude_exports": series("WCREXUS2", 3900, 300), "product_supplied": series("WRPUPUS2", 20500, 400)},
           "daily_spot": {"wti": {"series": "RWTC", "last_60": [{"period": x["date"], "value": x["close"]} for x in prices["products"]["CL"]["front"]["bars"][-60:]]},
                          "brent": {"series": "RBRTE", "last_60": [{"period": x["date"], "value": x["close"]} for x in prices["products"]["BZ"]["front"]["bars"][-60:]]}}}
    (OUT / "eia.json").write_text(json.dumps(eia, indent=1, sort_keys=True))
    (OUT / "eia_actual.json").write_text(json.dumps({k: {"period": TODAY.isoformat(), "change_kbbl": v} for k, v in
                                                     (("crude_ex_spr", -2100.0), ("gasoline", 900.0), ("distillate", -1400.0))}, indent=1))

    cot = {"source": "SYNTHETIC FIXTURE — not CFTC data", "as_of_note": "COT positions are as of Tuesday and published Friday.",
           "crowded_rule": "managed-money net above p85 or below p15 of 3 years", "products": {}}
    tue = TODAY - dt.timedelta(days=(TODAY.weekday() - 1) % 7)
    for sym, net, pct in (("CL", 180000, 62.0), ("BZ", 150000, 88.0), ("RB", 45000, 40.0), ("HO", 12000, 12.0)):
        wk = []
        for i in range(52):
            n_ = int(net + rng.gauss(0, 12000) - (51 - i) * 500)
            wk.append({"date": (tue - dt.timedelta(weeks=51 - i)).isoformat(), "mm_long": n_ + 90000, "mm_short": 90000, "mm_net": n_,
                       "prod_merc_net": -n_ // 2, "swap_dealer_net": -n_ // 3, "open_interest": 1800000})
        cot["products"][sym] = {"cftc_code": cfg["cot"]["codes"][sym], "market_name": f"SYNTHETIC {sym}", "latest_date": wk[-1]["date"],
                                "mm_net_latest": wk[-1]["mm_net"], "mm_net_change_1w": wk[-1]["mm_net"] - wk[-2]["mm_net"],
                                "mm_net_3y_percentile": pct, "crowded": "long" if pct >= 85 else ("short" if pct <= 15 else "no"),
                                "mm_net_3y_min": net - 90000, "mm_net_3y_max": net + 90000, "weekly": wk}
    (OUT / "cot.json").write_text(json.dumps(cot, indent=1, sort_keys=True))

    now = dt.datetime(2026, 11, 4, 12, 30, tzinfo=dt.timezone.utc)
    heads = ["OPEC+ eight members hold output policy unchanged for December (SYNTHETIC)", "Cushing storage operators report rising utilisation (SYNTHETIC)",
             "Tanker rates on the Gulf-to-Asia route firm for a third week (SYNTHETIC)", "Gulf Coast refinery restarts a CDU after planned work (SYNTHETIC)"]
    news = {"collected_at_utc": now.isoformat(), "window_hours": 24, "feeds": ["fixture"], "feed_errors": [],
            "headlines": [{"ts_utc": (now - dt.timedelta(hours=i * 3 + 1)).isoformat(), "title": h, "link": "", "feed": "fixture"} for i, h in enumerate(heads)]}
    (OUT / "news.json").write_text(json.dumps(news, indent=1, sort_keys=True))
    print(f"fixtures written to {OUT}")


if __name__ == "__main__":
    main()
