"""End-to-end dry run on fixtures: no network, no gateway, no API key."""
import json
import os
import shutil
from pathlib import Path

import pytest

import common
from agents import run_desk
from exec.mark_book import mark
from report import tearsheet


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    log = tmp_path / "log"
    shutil.copytree(common.LOG, log, ignore=shutil.ignore_patterns("*.json"))
    for mod in (common, run_desk, tearsheet):
        monkeypatch.setattr(mod, "LOG", log)
    monkeypatch.setattr(common, "BOOK_PATH", log / "book.json")
    monkeypatch.setattr(tearsheet, "ROOT", tmp_path)
    (tmp_path / "report").mkdir()
    monkeypatch.setenv("PAPER_BOOK_NOW", "2026-11-04T08:00")
    return tmp_path


def test_dry_run_records_decision_and_no_trade(sandbox):
    p = run_desk.run_desk("daily", dry_run=True, offline=True, no_proof=True, no_exec=True)
    d = json.loads(p.read_text())
    assert d["status"] == "no_trade" or d["risk_check"]["approved"]
    assert d["eia_day"] is True and d["eia_forecast"]["crude_kbbl"] == 0
    assert (sandbox / "log" / "inputs" / "2026-11-04-daily" / "MANIFEST.json").exists()
    assert set(d["reports"]) == {"fundamentals", "positioning", "news", "technical"}
    assert d["pm_proposal"] == {"trades": [], "no_trade_reason": "dry run: no model call made"}
    assert d["baseline"]["trades"]  # the no-AI sleeve still proposes from the fixture prices


def test_eia_run_grades_last_forecast(sandbox, monkeypatch):
    run_desk.run_desk("daily", dry_run=True, offline=True, no_proof=True, no_exec=True)
    monkeypatch.setenv("PAPER_BOOK_NOW", "2026-11-04T11:00")
    p = run_desk.run_desk("eia", dry_run=True, offline=True, no_proof=True, no_exec=True)
    d = json.loads(p.read_text())
    g = d["eia_grading"]
    assert g["forecast_from"] == "2026-11-04-daily.json" and g["crude_error_kbbl"] == -2100.0 and g["crude_within_range"] is False


def test_mark_and_tearsheet(sandbox):
    run_desk.run_desk("daily", dry_run=True, offline=True, no_proof=True, no_exec=True)
    book = common.load_book()
    prices = json.loads((common.ROOT / "tests" / "fixtures" / "prices.json").read_text())
    book["positions"].append({"id": "T-x", "sleeve": "baseline", "structure": "outright", "opened": "2026-11-03-daily", "risk_usd": 1000,
                              "entry": 60, "stop": 55, "target": 70, "horizon_days": 20, "costs_usd": 12.5,
                              "legs": [{"symbol": "CL", "month": prices["products"]["CL"]["front"]["month"], "side": "BUY", "ratio": 1, "qty": 1, "fill": 60.0, "last_mark": 60.0}]})
    rec = mark(book, prices, common.load_config(), "2026-11-04")
    common.save_book(book)
    common.write_json(common.LOG / "nav" / "2026-11-04.json", rec)
    assert rec["ret_baseline"] != 0 and rec["ret_ai"] == 0
    out = tearsheet.build()
    assert out["show_performance"] is False and out["trading_days"] == 1
    assert out["decision_log"][0]["run_id"] == "2026-11-04-daily"
    assert "Simulated paper trading" in out["disclaimer"]
