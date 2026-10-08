"""Baseline sleeve: plain trend plus curve carry, no language model anywhere.

Signal per product (CL, BZ, RB, HO), computed from prices.json:
  trend = +1 if front close > 50-day SMA > 200-day SMA, -1 if below both, else 0
  carry = +1 if backwardation (front > second), -1 if contango
  score = trend + carry  ->  long if >= +1, short if <= -1, flat otherwise
Stop = entry -/+ 2 x ATR20. Sizing is done by the same risk check as the AI sleeves.

The sleeve holds at most one position per product; a proposal is emitted only when the target
direction differs from the current baseline position. This is the control group: the only claim
the project makes is "AI sleeves versus this".
"""
from __future__ import annotations

from typing import Any


def signal(product: dict[str, Any]) -> dict[str, Any]:
    f = product["front"]
    close, s50, s200 = f.get("last_close"), f.get("sma50"), f.get("sma200")
    if close is None or s50 is None or s200 is None:
        trend = 0
    elif close > s50 > s200:
        trend = 1
    elif close < s50 < s200:
        trend = -1
    else:
        trend = 0
    carry = 1 if product.get("curve") == "backwardation" else -1
    score = trend + carry
    target = 1 if score >= 1 else (-1 if score <= -1 else 0)
    return {"trend": trend, "carry": carry, "score": score, "target": target}


def proposals(prices: dict[str, Any], book: dict[str, Any], stop_atr_multiple: float = 2.0) -> dict[str, Any]:
    current: dict[str, int] = {}
    for p in book.get("positions", []):
        if p.get("sleeve") == "baseline":
            current[p["legs"][0]["symbol"]] = 1 if p["legs"][0]["side"] == "BUY" else -1
    trades: list[dict[str, Any]] = []
    closes: list[str] = []
    signals: dict[str, Any] = {}
    for sym, prod in prices["products"].items():
        s = signal(prod)
        signals[sym] = s
        have = current.get(sym, 0)
        if s["target"] == have:
            continue
        if have != 0:
            closes.append(sym)  # exec closes the existing baseline position first
        if s["target"] == 0:
            continue
        f = prod["front"]
        atr = f.get("atr20")
        if not atr:
            continue
        side = "BUY" if s["target"] > 0 else "SELL"
        entry = float(f["last_close"])
        stop = entry - stop_atr_multiple * atr if side == "BUY" else entry + stop_atr_multiple * atr
        trades.append({
            "sleeve": "baseline", "structure": "outright",
            "legs": [{"symbol": sym, "month": f["month"], "side": side, "ratio": 1}],
            "risk_pct_nav": 0.5, "entry": round(entry, 4), "stop": round(stop, 4),
            "target": round(entry + (entry - stop) * 2, 4), "horizon_days": 20,
            "thesis": f"baseline: trend {s['trend']:+d}, carry {s['carry']:+d}", "kill_criteria": "score changes sign or stop",
            "confidence": 3,
        })
    return {"signals": signals, "trades": trades, "close_baseline": closes, "no_trade_reason": "" if trades else "no signal change"}
