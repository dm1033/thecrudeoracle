import json
from pathlib import Path

from baseline.trend_carry import proposals, signal
from common import new_book

FIX = Path(__file__).parent / "fixtures"


def test_signal_logic():
    up = {"front": {"last_close": 70, "sma50": 65, "sma200": 60}, "curve": "backwardation"}
    down = {"front": {"last_close": 50, "sma50": 55, "sma200": 60}, "curve": "contango"}
    mixed = {"front": {"last_close": 62, "sma50": 65, "sma200": 60}, "curve": "contango"}
    assert signal(up)["target"] == 1
    assert signal(down)["target"] == -1
    assert signal(mixed)["target"] == -1  # carry alone decides when trend is flat


def test_proposals_have_stops_and_only_change_on_flip():
    prices = json.loads((FIX / "prices.json").read_text())
    book = new_book(1e6)
    p = proposals(prices, book)
    for t in p["trades"]:
        assert t["sleeve"] == "baseline" and t["stop"] != t["entry"]
    # replay with the proposed positions already held: nothing new is proposed
    for t in p["trades"]:
        book["positions"].append({"sleeve": "baseline", "legs": [{**t["legs"][0], "qty": 1, "fill": t["entry"]}]})
    again = proposals(prices, book)
    assert again["trades"] == [] and again["close_baseline"] == []
