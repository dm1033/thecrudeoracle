import datetime as dt
from zoneinfo import ZoneInfo

import pytest

from common import load_config, load_limits, new_book
from risk.check import check

NY = ZoneInfo("America/New_York")
NOW = dt.datetime(2026, 11, 4, 8, 0, tzinfo=NY)  # Wednesday 08:00
CFG, LIM = load_config(), load_limits()
PRODUCTS = CFG["products"]
TM = {"CL": ["202612", "202701"], "BZ": ["202701", "202702"], "RB": ["202612", "202701"], "HO": ["202612", "202701"]}


def trade(**kw):
    t = {"sleeve": "event", "structure": "outright", "legs": [{"symbol": "CL", "month": "202612", "side": "BUY", "ratio": 1}],
         "risk_pct_nav": 0.5, "entry": 60.0, "stop": 58.0, "target": 64.0, "horizon_days": 5, "thesis": "t", "kill_criteria": "k", "confidence": 3}
    t.update(kw)
    return t


def run(trades, book=None, now=NOW, **kw):
    return check({"trades": trades}, book or new_book(1_000_000), LIM, PRODUCTS, now, tradeable=TM, **kw)


def test_sizes_to_half_percent_of_nav():
    r = run([trade()])
    assert len(r["approved"]) == 1
    t = r["approved"][0]
    # 0.5% of 1,000,000 = 5,000 USD; CL risk per contract = 2.00 x 1000 = 2,000 -> 2 contracts
    assert t["qty"] == 2 and t["legs"][0]["qty"] == 2 and t["risk_usd"] == 4000


def test_confidence_five_allows_one_percent():
    r = run([trade(confidence=5, risk_pct_nav=1.0)])
    assert r["approved"][0]["qty"] == 5


def test_risk_pct_is_capped_not_trusted():
    r = run([trade(risk_pct_nav=5.0)])
    assert r["approved"][0]["qty"] == 2


def test_missing_stop_is_rejected():
    t = trade(); del t["stop"]
    r = run([t])
    assert not r["approved"] and "stop" in r["rejected"][0]["reason"]


def test_stop_wrong_side_is_rejected():
    r = run([trade(stop=61.0)])
    assert "wrong side" in r["rejected"][0]["reason"]


def test_unknown_symbol_and_bad_month():
    r = run([trade(legs=[{"symbol": "NG", "month": "202612", "side": "BUY", "ratio": 1}]),
             trade(legs=[{"symbol": "CL", "month": "2026-12", "side": "BUY", "ratio": 1}]),
             trade(legs=[{"symbol": "CL", "month": "202611", "side": "BUY", "ratio": 1}])])
    reasons = [x["reason"] for x in r["rejected"]]
    assert any("unknown symbol" in s for s in reasons)
    assert any("bad month" in s for s in reasons)
    assert any("not a tradeable month" in s for s in reasons)


def test_invalid_proposal_shape():
    r = check({"garbage": 1}, new_book(1e6), LIM, PRODUCTS, NOW)
    assert not r["approved"] and r["rejected"]


def test_micro_fallback_when_one_contract_too_big():
    # 0.5% = 5,000; stop 8.00 away -> 8,000 per CL contract -> 0 CL, so size in MCL (800 each -> 6)
    r = run([trade(stop=52.0)])
    t = r["approved"][0]
    assert t["legs"][0]["symbol"] == "MCL" and t["qty"] == 6


def test_open_trade_limit_is_six():
    book = new_book(1e6)
    for i in range(6):
        book["positions"].append({"id": f"P{i}", "sleeve": "spread", "structure": "outright", "risk_usd": 100.0,
                                  "legs": [{"symbol": "RB", "month": "202612", "side": "BUY", "ratio": 1, "qty": 1, "fill": 2.0}]})
    r = run([trade()], book)
    assert "limit of 6" in r["rejected"][0]["reason"]
    r2 = run([trade(sleeve="baseline")], book)   # baseline is not counted against the AI limit
    assert r2["approved"]


def test_per_product_cap_is_forty_percent_of_capacity():
    # capacity = 6 x 0.5% x 1e6 = 30,000; 40% = 12,000. Two 4,000 trades pass, the fourth would breach.
    r = run([trade(), trade(), trade(), trade()])
    assert len(r["approved"]) == 3 and "40%" in r["rejected"][0]["reason"]


def test_gross_exposure_cap():
    book = new_book(1e6)
    book["positions"].append({"id": "G", "sleeve": "baseline", "structure": "outright", "risk_usd": 0.0,
                              "legs": [{"symbol": "CL", "month": "202612", "side": "BUY", "ratio": 1, "qty": 66, "fill": 60.0}]})  # 3.96m
    r = run([trade()], book)  # +120k would exceed 4m
    assert "gross exposure" in r["rejected"][0]["reason"]


def test_drawdown_stepdown_halves_size():
    book = new_book(1e6); book["nav"] = 935_000  # -6.5%
    r = run([trade()], book)
    assert r["notes"]["drawdown_stepdown"] and r["approved"][0]["qty"] == 1  # 0.5% x 935k x 0.5 = 2,337 -> 1


def test_drawdown_stop_flattens_ai_but_not_baseline():
    book = new_book(1e6); book["nav"] = 895_000
    r = run([trade(), trade(sleeve="baseline")], book)
    assert "flatten_ai" in r["actions"]
    assert len(r["approved"]) == 1 and r["approved"][0]["sleeve"] == "baseline"


def test_vol_scaling_pro_rata():
    book = new_book(1e6)
    import random
    rng = random.Random(1)
    book["daily_returns"] = [{"date": f"d{i}", "ret": rng.gauss(0, 0.0126)} for i in range(60)]  # ~20% annualised
    r = run([trade()], book)
    assert r["notes"]["realised_vol_60d_pct"] > 10 and 0 < r["notes"]["vol_scaling"] < 1


def test_eia_blackout_delays_ai_only():
    inside = NOW.replace(hour=10, minute=35)
    r = run([trade(), trade(sleeve="baseline")], now=inside, eia_day=True)
    assert len(r["approved"]) == 1 and "blackout" in r["rejected"][0]["reason"]
    r2 = run([trade()], now=inside, eia_day=False)
    assert r2["approved"]


def test_roll_window_rejects_expiring_month():
    r = check({"trades": [trade()]}, new_book(1e6), LIM, PRODUCTS, dt.datetime(2026, 11, 16, 8, 0, tzinfo=NY), tradeable=None)
    assert "roll window" in r["rejected"][0]["reason"]


def test_spread_sized_on_lead_leg():
    t = trade(sleeve="spread", structure="spread", entry=-4.0, stop=-5.0,
              legs=[{"symbol": "CL", "month": "202612", "side": "BUY", "ratio": 1}, {"symbol": "BZ", "month": "202701", "side": "SELL", "ratio": 1}])
    r = run([t])
    a = r["approved"][0]
    assert a["qty"] == 5 and [l["qty"] for l in a["legs"]] == [5, 5]
