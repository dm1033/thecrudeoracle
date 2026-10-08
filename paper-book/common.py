"""Shared helpers for the Crude Oracle Paper Book pipeline.

Everything that touches the filesystem goes through here so the layout in RULES.md
(`log/inputs/<run-id>/`, `log/decisions/<run-id>.json`, ...) is defined in one place.
"""
from __future__ import annotations

import hashlib
import json
import os
import datetime as dt
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.yaml"
LIMITS_PATH = ROOT / "risk" / "limits.yaml"
BOOK_PATH = ROOT / "log" / "book.json"
LOG = ROOT / "log"
NY = ZoneInfo("America/New_York")


def load_yaml(path: Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_config() -> dict[str, Any]:
    return load_yaml(CONFIG_PATH)


def load_limits() -> dict[str, Any]:
    return load_yaml(LIMITS_PATH)


def now_ny() -> dt.datetime:
    override = os.environ.get("PAPER_BOOK_NOW")  # for tests and replays: "2026-11-04T11:00"
    if override:
        return dt.datetime.fromisoformat(override).replace(tzinfo=NY)
    return dt.datetime.now(tz=NY)


def run_id(run: str, when: dt.datetime | None = None) -> str:
    when = when or now_ny()
    return f"{when:%Y-%m-%d}-{run}"


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, sort_keys=True, default=str)
        f.write("\n")
    os.replace(tmp, path)


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def manifest(dir_path: Path) -> dict[str, str]:
    """SHA-256 of every file in an inputs directory, sorted, so the frozen inputs are provable."""
    out: dict[str, str] = {}
    for p in sorted(dir_path.rglob("*")):
        if p.is_file() and p.name != "MANIFEST.json":
            out[str(p.relative_to(dir_path))] = sha256_file(p)
    return out


def new_book(starting_nav: float) -> dict[str, Any]:
    return {
        "starting_nav": starting_nav,
        "nav": starting_nav,
        "peak_nav": starting_nav,
        "cash": starting_nav,
        "positions": [],
        "daily_returns": [],
        "halt": {"ai_flattened_on": None, "review_until": None},
        "trade_seq": 0,
    }


def load_book() -> dict[str, Any]:
    book = read_json(BOOK_PATH)
    if book is None:
        book = new_book(float(load_config()["starting_nav_usd"]))
        write_json(BOOK_PATH, book)
    return book


def save_book(book: dict[str, Any]) -> None:
    write_json(BOOK_PATH, book)


class StepFailed(Exception):
    """Raised by any pipeline step; the run records 'no trade' with this message."""
