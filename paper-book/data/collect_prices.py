"""Collect daily bars for the front two months of CL, BZ, RB, HO from IB Gateway (paper).

Output `prices.json`: per product, the two tradeable months, last 260 daily bars of the front
month, 20/50/200-day moving averages, 20-day ATR, 20-day realised volatility (annualised) and
term structure (front minus second settlement). Also the `tradeable_months` list the PM must
use, derived from risk/contracts.py so it matches what the risk check will accept.

Usage:
  python data/collect_prices.py --out log/inputs/<run-id>            # via IB Gateway
  python data/collect_prices.py --out ... --from-fixture tests/fixtures/prices.json

IB historical data on an unfunded paper account is delayed; that is fine for dry runs. The
run logs `data_type` so nothing delayed is ever shown as live.
"""
from __future__ import annotations

import argparse
import datetime as dt
import math
import shutil
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import StepFailed, load_config, load_limits, now_ny, write_json  # noqa: E402
from risk.contracts import tradeable_months  # noqa: E402


def indicators(bars: list[dict[str, Any]]) -> dict[str, Any]:
    closes = [b["close"] for b in bars]
    def sma(n: int) -> float | None:
        return round(sum(closes[-n:]) / n, 4) if len(closes) >= n else None
    trs = []
    for i in range(1, len(bars)):
        h, l, pc = bars[i]["high"], bars[i]["low"], bars[i - 1]["close"]
        trs.append(max(h - l, abs(h - pc), abs(l - pc)))
    atr20 = round(sum(trs[-20:]) / 20, 4) if len(trs) >= 20 else None
    rets = [math.log(closes[i] / closes[i - 1]) for i in range(1, len(closes)) if closes[i - 1] > 0]
    rv20 = None
    if len(rets) >= 20:
        r = rets[-20:]
        mu = sum(r) / len(r)
        rv20 = round(math.sqrt(sum((x - mu) ** 2 for x in r) / (len(r) - 1)) * math.sqrt(252) * 100, 2)
    return {"sma20": sma(20), "sma50": sma(50), "sma200": sma(200), "atr20": atr20,
            "realised_vol_20d_pct": rv20, "last_close": closes[-1] if closes else None}


def _ib_bars(ib: Any, contract: Any, days: int = 400) -> list[dict[str, Any]]:
    bars = ib.reqHistoricalData(contract, endDateTime="", durationStr=f"{days} D", barSizeSetting="1 day",
                                whatToShow="TRADES", useRTH=False, formatDate=1)
    out = []
    for b in bars:
        out.append({"date": b.date.strftime("%Y-%m-%d") if hasattr(b.date, "strftime") else str(b.date),
                    "open": float(b.open), "high": float(b.high), "low": float(b.low), "close": float(b.close),
                    "volume": float(b.volume)})
    return out


def collect_ib(out_dir: Path, cfg: dict[str, Any], limits: dict[str, Any]) -> dict[str, Any]:
    from ib_async import IB, Future  # lazy import so tests do not need a gateway

    today = now_ny().date()
    ib = IB()
    try:
        ib.connect(cfg["ib"]["host"], int(cfg["ib"]["port"]), clientId=int(cfg["ib"]["client_id"]) + 100, timeout=30)
    except Exception as e:
        raise StepFailed(f"IB Gateway not reachable: {e}") from e
    out: dict[str, Any] = {"source": "Interactive Brokers historical data (paper account)",
                           "data_type": "delayed unless a NYMEX subscription is active", "as_of": str(today),
                           "products": {}}
    try:
        for sym in ("CL", "BZ", "RB", "HO"):
            p = cfg["products"][sym]
            months = tradeable_months(p["expiry_rule"], today, int(limits["roll_business_days_before_ltd"]))
            legs = []
            for cm in months:
                c = Future(sym, exchange=p["exchange"], lastTradeDateOrContractMonth=cm)
                det = ib.reqContractDetails(c)
                if not det:
                    raise StepFailed(f"IB: no contract for {sym} {cm}")
                c = det[0].contract
                bars = _ib_bars(ib, c)
                if not bars:
                    raise StepFailed(f"IB: no bars for {sym} {cm}")
                legs.append({"month": cm, "ib_last_trade_date": det[0].contract.lastTradeDateOrContractMonth,
                             "bars": bars[-260:], **indicators(bars)})
            front, second = legs[0], legs[1] if len(legs) > 1 else legs[0]
            out["products"][sym] = {
                "tradeable_months": months,
                "front": front, "second": {k: v for k, v in second.items() if k != "bars"},
                "term_structure_front_minus_second": round(front["last_close"] - second["last_close"], 4),
                "curve": "backwardation" if front["last_close"] > second["last_close"] else "contango",
            }
    finally:
        ib.disconnect()
    write_json(out_dir / "prices.json", out)
    return out


def collect(out_dir: Path, cfg: dict[str, Any] | None = None, from_fixture: Path | None = None) -> dict[str, Any]:
    cfg = cfg or load_config()
    limits = load_limits()
    if from_fixture:
        out_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy(from_fixture, out_dir / "prices.json")
        import json
        return json.loads((out_dir / "prices.json").read_text())
    return collect_ib(out_dir, cfg, limits)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--from-fixture", type=Path)
    a = ap.parse_args()
    collect(a.out, from_fixture=a.from_fixture)
    print(f"wrote {a.out / 'prices.json'}")
