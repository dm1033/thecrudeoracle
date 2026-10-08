"""Deterministic risk check. The only path from a PM proposal to an order.

    result = check(proposal, book, limits, products, now)
    result["approved"]  -> sized trades, ready for exec/place_orders.py
    result["rejected"]  -> [{"trade": ..., "reason": ...}]
    result["actions"]   -> e.g. ["flatten_ai"] when the drawdown stop trips
    result["notes"]     -> sizing multipliers applied, realised vol, drawdown

Every rule in RULES.md section 6 is implemented here and covered by tests/test_risk.py.
The model never sees this code's output before it is logged.
"""
from __future__ import annotations

import datetime as dt
import math
import re
from typing import Any

from .contracts import inside_roll_window

MONTH_RE = re.compile(r"^\d{6}$")
AI_SLEEVES = {"event", "spread"}
ALL_SLEEVES = AI_SLEEVES | {"baseline"}


def realised_vol_annual_pct(daily_returns: list[dict[str, Any]], lookback: int, min_obs: int) -> float | None:
    rets = [float(r["ret"]) for r in daily_returns[-lookback:]]
    if len(rets) < min_obs:
        return None
    mu = sum(rets) / len(rets)
    var = sum((x - mu) ** 2 for x in rets) / (len(rets) - 1)
    return math.sqrt(var) * math.sqrt(252) * 100


def _hm(s: str) -> dt.time:
    h, m = s.split(":")
    return dt.time(int(h), int(m))


def _validate(trade: dict[str, Any], products: dict[str, Any], tradeable: dict[str, list[str]] | None) -> str | None:
    if not isinstance(trade, dict):
        return "trade is not an object"
    if trade.get("sleeve") not in ALL_SLEEVES:
        return f"unknown sleeve {trade.get('sleeve')!r}"
    legs = trade.get("legs")
    if not isinstance(legs, list) or not legs:
        return "no legs"
    for leg in legs:
        if leg.get("symbol") not in products:
            return f"unknown symbol {leg.get('symbol')!r}"
        if leg.get("side") not in ("BUY", "SELL"):
            return f"bad side {leg.get('side')!r}"
        if not isinstance(leg.get("month"), str) or not MONTH_RE.match(leg["month"]):
            return f"bad month {leg.get('month')!r}"
        if tradeable is not None and leg["month"] not in tradeable.get(leg["symbol"], []):
            return f"{leg['symbol']} {leg['month']} is not a tradeable month"
        try:
            if int(leg.get("ratio", 1)) <= 0:
                return "ratio must be positive"
        except (TypeError, ValueError):
            return "ratio must be an integer"
    for k in ("entry", "stop"):
        try:
            float(trade[k])
        except (KeyError, TypeError, ValueError):
            return f"missing or non-numeric {k}"
    if float(trade["stop"]) == float(trade["entry"]):
        return "stop equals entry"
    direction = 1 if legs[0]["side"] == "BUY" else -1
    if direction * (float(trade["stop"]) - float(trade["entry"])) >= 0:
        return "stop is on the wrong side of entry"
    try:
        conf = int(trade.get("confidence", 3))
    except (TypeError, ValueError):
        return "confidence must be an integer"
    if not 1 <= conf <= 5:
        return "confidence must be 1-5"
    return None


def _book_risk_by_product(book: dict[str, Any]) -> dict[str, float]:
    out: dict[str, float] = {}
    for p in book.get("positions", []):
        sym = p["legs"][0]["symbol"]
        out[sym] = out.get(sym, 0.0) + float(p.get("risk_usd", 0.0))
    return out


def _gross_notional(book: dict[str, Any], products: dict[str, Any]) -> float:
    g = 0.0
    for p in book.get("positions", []):
        for leg in p["legs"]:
            g += abs(float(leg.get("qty", 0)) * float(leg.get("fill", 0)) * products[leg["symbol"]]["multiplier"])
    return g


def _base_product(sym: str) -> str:
    return "CL" if sym == "MCL" else sym


def check(proposal: dict[str, Any], book: dict[str, Any], limits: dict[str, Any], products: dict[str, Any],
          now: dt.datetime, tradeable: dict[str, list[str]] | None = None, eia_day: bool = False) -> dict[str, Any]:
    nav = float(book["nav"])
    peak = max(float(book.get("peak_nav", nav)), nav)
    dd_pct = (nav / peak - 1.0) * 100.0
    notes: dict[str, Any] = {"nav": nav, "peak_nav": peak, "drawdown_pct": round(dd_pct, 3)}
    actions: list[str] = []
    approved: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    size_mult = 1.0
    if dd_pct <= float(limits["drawdown_stop_pct"]):
        actions.append("flatten_ai")
        notes["drawdown_stop"] = True
    elif dd_pct <= float(limits["drawdown_stepdown_pct"]):
        size_mult *= 0.5
        notes["drawdown_stepdown"] = True

    rv = realised_vol_annual_pct(book.get("daily_returns", []), int(limits["vol_lookback_days"]),
                                 int(limits["vol_min_observations"]))
    notes["realised_vol_60d_pct"] = None if rv is None else round(rv, 2)
    if rv is not None and rv > float(limits["vol_target_annual_pct"]):
        vol_mult = float(limits["vol_target_annual_pct"]) / rv
        size_mult *= vol_mult
        notes["vol_scaling"] = round(vol_mult, 3)
    notes["size_multiplier"] = round(size_mult, 3)

    halted = book.get("halt", {}).get("review_until")
    halt_active = bool(halted) and dt.date.fromisoformat(halted) >= now.date()

    in_blackout = eia_day and _hm(limits["eia_blackout_start_ny"]) <= now.time() < _hm(limits["eia_blackout_end_ny"])

    open_ai = sum(1 for p in book.get("positions", []) if p.get("sleeve") in AI_SLEEVES)
    gross = _gross_notional(book, products)
    risk_by_product = _book_risk_by_product(book)
    capacity = int(limits["max_open_ai_trades"]) * float(limits["risk_per_trade_pct_nav"]) / 100.0 * nav
    product_cap = float(limits["per_product_max_pct_book_risk"]) / 100.0 * capacity

    trades = proposal.get("trades") if isinstance(proposal, dict) else None
    if not isinstance(trades, list):
        return {"approved": [], "rejected": [{"trade": proposal, "reason": "proposal has no trades list"}],
                "actions": actions, "notes": notes}

    for t in trades:
        err = _validate(t, products, tradeable)
        if err:
            rejected.append({"trade": t, "reason": err})
            continue
        is_ai = t["sleeve"] in AI_SLEEVES
        if is_ai and "flatten_ai" in actions:
            rejected.append({"trade": t, "reason": "drawdown stop active: AI sleeves flattened"})
            continue
        if is_ai and halt_active:
            rejected.append({"trade": t, "reason": f"AI sleeves in post-drawdown review until {halted}"})
            continue
        if is_ai and in_blackout:
            rejected.append({"trade": t, "reason": "inside the EIA release blackout; delayed to the 11:00 ET run"})
            continue
        if is_ai and open_ai >= int(limits["max_open_ai_trades"]):
            rejected.append({"trade": t, "reason": f"open AI trades already at the limit of {limits['max_open_ai_trades']}"})
            continue
        roll_hit = [f"{l['symbol']} {l['month']}" for l in t["legs"]
                    if inside_roll_window(l["month"], products[l["symbol"]]["expiry_rule"], now.date(),
                                          int(limits["roll_business_days_before_ltd"]))]
        if roll_hit:
            rejected.append({"trade": t, "reason": f"contract inside the roll window: {', '.join(roll_hit)}"})
            continue

        conf = int(t.get("confidence", 3))
        cap_pct = float(limits["risk_per_trade_pct_nav_max"]) if conf >= 5 else float(limits["risk_per_trade_pct_nav"])
        try:
            want_pct = float(t.get("risk_pct_nav", cap_pct))
        except (TypeError, ValueError):
            want_pct = cap_pct
        risk_pct = min(max(want_pct, 0.0), cap_pct)
        risk_usd = risk_pct / 100.0 * nav * size_mult

        lead = t["legs"][0]
        sym = lead["symbol"]
        unit_risk = abs(float(t["entry"]) - float(t["stop"])) * products[sym]["multiplier"] * int(lead.get("ratio", 1))
        qty = math.floor(risk_usd / unit_risk) if unit_risk > 0 else 0
        sized_legs = []
        if qty == 0 and products[sym].get("micro"):
            micro = products[sym]["micro"]
            unit_risk_micro = abs(float(t["entry"]) - float(t["stop"])) * products[micro]["multiplier"] * int(lead.get("ratio", 1))
            qty_micro = math.floor(risk_usd / unit_risk_micro)
            if qty_micro > 0 and len(t["legs"]) == 1:
                sized_legs = [{**lead, "symbol": micro, "qty": qty_micro}]
                unit_risk = unit_risk_micro
                qty = qty_micro
        if qty == 0:
            rejected.append({"trade": t, "reason": f"risk budget {risk_usd:,.0f} USD is below one contract's entry-to-stop risk {unit_risk:,.0f} USD"})
            continue
        if not sized_legs:
            sized_legs = [{**l, "qty": qty * int(l.get("ratio", 1))} for l in t["legs"]]
        actual_risk = qty * unit_risk

        prod = _base_product(sym)
        if risk_by_product.get(prod, 0.0) + actual_risk > product_cap + 1e-6:
            rejected.append({"trade": t, "reason": f"{prod} would exceed {limits['per_product_max_pct_book_risk']}% of book risk capacity ({product_cap:,.0f} USD)"})
            continue
        new_notional = sum(abs(l["qty"] * float(t["entry"]) * products[l["symbol"]]["multiplier"]) for l in sized_legs[:1])
        if gross + new_notional > float(limits["gross_exposure_max_x_nav"]) * nav:
            rejected.append({"trade": t, "reason": f"gross exposure would exceed {limits['gross_exposure_max_x_nav']}x NAV"})
            continue

        approved.append({**t, "legs": sized_legs, "qty": qty, "risk_usd": round(actual_risk, 2),
                         "risk_pct_nav_applied": round(actual_risk / nav * 100, 4), "size_multiplier": round(size_mult, 3)})
        if is_ai:
            open_ai += 1
        gross += new_notional
        risk_by_product[prod] = risk_by_product.get(prod, 0.0) + actual_risk

    return {"approved": approved, "rejected": rejected, "actions": actions, "notes": notes}
