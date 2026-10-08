"""Place approved paper orders through IB Gateway and record fills. Only risk-approved trades
ever reach this file; it never reads the model's output.

    execute(risk_result, baseline_result, book, cfg, limits, run_id, dry_run=False)

For each approved trade and each leg: qualify the NYMEX future, log the margin impact from
whatIfOrder, send a limit order at entry +/- 1 tick allowance, wait up to fill_wait_seconds,
record the fill (or the unfilled order) in log/fills/<run-id>.json and update log/book.json.
Spreads are sent leg by leg (combo orders are a later improvement; the log says which).
"""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import LOG, StepFailed, now_ny, save_book, write_json  # noqa: E402


def _cost_per_side(sym: str, qty: int, cfg: dict[str, Any], limits: dict[str, Any]) -> float:
    p = cfg["products"][sym]
    return qty * (float(limits["slippage_ticks_per_side"]) * p["tick"] * p["multiplier"] + float(limits["commission_usd_per_side"]))


def _connect(cfg: dict[str, Any]):
    from ib_async import IB
    ib = IB()
    try:
        ib.connect(cfg["ib"]["host"], int(cfg["ib"]["port"]), clientId=int(cfg["ib"]["client_id"]), timeout=30)
    except Exception as e:
        raise StepFailed(f"IB Gateway not reachable: {e}") from e
    return ib


def _send_leg(ib: Any, leg: dict[str, Any], limit_px: float, cfg: dict[str, Any], wait_s: int) -> dict[str, Any]:
    from ib_async import Future, LimitOrder
    p = cfg["products"][leg["symbol"]]
    c = Future(leg["symbol"], exchange=p["exchange"], lastTradeDateOrContractMonth=leg["month"])
    det = ib.reqContractDetails(c)
    if not det:
        raise StepFailed(f"no IB contract for {leg['symbol']} {leg['month']}")
    c = det[0].contract
    o = LimitOrder(leg["side"], int(leg["qty"]), round(limit_px, 4))
    what_if = ib.whatIfOrder(c, o)
    trade = ib.placeOrder(c, o)
    deadline = dt.datetime.now() + dt.timedelta(seconds=wait_s)
    while not trade.isDone() and dt.datetime.now() < deadline:
        ib.sleep(1)
    filled = int(trade.orderStatus.filled or 0)
    avg = float(trade.orderStatus.avgFillPrice or 0.0)
    if not trade.isDone():
        ib.cancelOrder(o)
        ib.sleep(1)
    return {"symbol": leg["symbol"], "month": leg["month"], "side": leg["side"], "qty_sent": int(leg["qty"]),
            "limit": round(limit_px, 4), "filled": filled, "avg_fill": avg, "status": trade.orderStatus.status,
            "ib_last_trade_date": c.lastTradeDateOrContractMonth, "ib_con_id": c.conId,
            "what_if": {"init_margin_change": getattr(what_if, "initMarginChange", None),
                        "maint_margin_change": getattr(what_if, "maintMarginChange", None),
                        "commission": getattr(what_if, "commission", None)}}


def close_position(ib: Any, pos: dict[str, Any], cfg: dict[str, Any], limits: dict[str, Any], wait_s: int) -> list[dict[str, Any]]:
    fills = []
    for leg in pos["legs"]:
        opp = "SELL" if leg["side"] == "BUY" else "BUY"
        tick = cfg["products"][leg["symbol"]]["tick"]
        ref = float(leg.get("last_mark") or leg.get("fill"))
        px = ref - 50 * tick if opp == "SELL" else ref + 50 * tick  # marketable limit
        fills.append(_send_leg(ib, {**leg, "side": opp}, px, cfg, wait_s))
    return fills


def execute(risk_result: dict[str, Any], baseline_result: dict[str, Any], book: dict[str, Any], cfg: dict[str, Any],
            limits: dict[str, Any], run_id: str, dry_run: bool = False) -> dict[str, Any]:
    wait_s = int(cfg["ib"]["fill_wait_seconds"])
    record: dict[str, Any] = {"run_id": run_id, "sent_at_ny": now_ny().isoformat(), "dry_run": dry_run,
                              "closes": [], "opens": [], "errors": []}
    ib = None if dry_run else _connect(cfg)
    try:
        # 1. closes: drawdown stop flattens AI sleeves; baseline signal flips close the old baseline leg
        to_close = []
        if "flatten_ai" in risk_result.get("actions", []):
            to_close += [p for p in book["positions"] if p["sleeve"] in ("event", "spread")]
            book["halt"] = {"ai_flattened_on": f"{now_ny():%Y-%m-%d}",
                            "review_until": f"{now_ny().date() + dt.timedelta(days=7):%Y-%m-%d}"}
        for sym in baseline_result.get("close_baseline", []):
            to_close += [p for p in book["positions"] if p["sleeve"] == "baseline" and p["legs"][0]["symbol"] == sym]
        for pos in to_close:
            try:
                fills = [] if dry_run else close_position(ib, pos, cfg, limits, wait_s)
                record["closes"].append({"position_id": pos["id"], "fills": fills})
                if dry_run or all(f["filled"] == f["qty_sent"] for f in fills):
                    book["positions"] = [p for p in book["positions"] if p["id"] != pos["id"]]
                    pos["closed"] = {"run_id": run_id, "fills": fills}
                    book.setdefault("closed_positions", []).append(pos)
            except StepFailed as e:
                record["errors"].append(f"close {pos['id']}: {e}")

        # 2. opens
        for t in risk_result.get("approved", []):
            book["trade_seq"] = int(book.get("trade_seq", 0)) + 1
            pid = f"T-{run_id}-{book['trade_seq']:03d}"
            fills = []
            try:
                for leg in t["legs"]:
                    tick = cfg["products"][leg["symbol"]]["tick"]
                    px = float(t["entry"]) + (tick if leg["side"] == "BUY" else -tick)
                    fills.append({"symbol": leg["symbol"], "month": leg["month"], "side": leg["side"], "qty_sent": leg["qty"],
                                  "limit": px, "filled": leg["qty"], "avg_fill": float(t["entry"]), "status": "DRY-RUN"}
                                 if dry_run else _send_leg(ib, leg, px, cfg, wait_s))
            except StepFailed as e:
                record["errors"].append(f"open {pid}: {e}")
            filled_all = bool(fills) and all(f["filled"] == f["qty_sent"] for f in fills)
            cost = sum(_cost_per_side(f["symbol"], f["filled"], cfg, limits) for f in fills)
            record["opens"].append({"position_id": pid, "trade": t, "fills": fills, "filled_all": filled_all,
                                    "estimated_cost_usd_one_side": round(cost, 2)})
            if filled_all:
                book["positions"].append({
                    "id": pid, "sleeve": t["sleeve"], "structure": t["structure"], "opened": run_id,
                    "legs": [{**leg, "fill": f["avg_fill"], "last_mark": f["avg_fill"],
                              "ib_last_trade_date": f.get("ib_last_trade_date")} for leg, f in zip(t["legs"], fills)],
                    "entry": t["entry"], "stop": t["stop"], "target": t["target"], "horizon_days": t["horizon_days"],
                    "risk_usd": t["risk_usd"], "thesis": t.get("thesis", ""), "kill_criteria": t.get("kill_criteria", ""),
                    "confidence": t.get("confidence"), "costs_usd": round(cost, 2),
                })
    finally:
        if ib is not None:
            ib.disconnect()
    write_json(LOG / "fills" / f"{run_id}.json", record)
    save_book(book)
    return record
