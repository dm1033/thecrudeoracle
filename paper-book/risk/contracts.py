"""Contract-month helpers: last trade date approximations and the roll window.

IB contract details are the authoritative source for the last trade date and
`exec/place_orders.py` re-checks against them before sending. These rules are good enough
for the risk check to refuse a month that is obviously inside the roll window.

Rules (NYMEX, approximate):
  cl    : 3 business days before the 25th of the month preceding the contract month
          (if the 25th is not a business day, count from the business day before it)
  bz    : last business day of the second month preceding the contract month
  rb_ho : last business day of the month preceding the contract month
"""
from __future__ import annotations

import datetime as dt
import re

MONTH_RE = re.compile(r"^\d{6}$")


def _is_bday(d: dt.date) -> bool:
    return d.weekday() < 5


def add_bdays(d: dt.date, n: int) -> dt.date:
    step = 1 if n > 0 else -1
    left = abs(n)
    while left:
        d += dt.timedelta(days=step)
        if _is_bday(d):
            left -= 1
    return d


def _prev_bday_on_or_before(d: dt.date) -> dt.date:
    while not _is_bday(d):
        d -= dt.timedelta(days=1)
    return d


def _last_bday_of_month(year: int, month: int) -> dt.date:
    nxt = dt.date(year + (month // 12), (month % 12) + 1, 1)
    return _prev_bday_on_or_before(nxt - dt.timedelta(days=1))


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    idx = year * 12 + (month - 1) + delta
    return idx // 12, idx % 12 + 1


def last_trade_date(contract_month: str, rule: str) -> dt.date:
    if not MONTH_RE.match(contract_month):
        raise ValueError(f"contract month must be YYYYMM, got {contract_month!r}")
    y, m = int(contract_month[:4]), int(contract_month[4:])
    if rule == "cl":
        py, pm = _shift_month(y, m, -1)
        anchor = _prev_bday_on_or_before(dt.date(py, pm, 25))
        return add_bdays(anchor, -3)
    if rule == "bz":
        py, pm = _shift_month(y, m, -2)
        return _last_bday_of_month(py, pm)
    if rule == "rb_ho":
        py, pm = _shift_month(y, m, -1)
        return _last_bday_of_month(py, pm)
    raise ValueError(f"unknown expiry rule {rule!r}")


def inside_roll_window(contract_month: str, rule: str, today: dt.date, roll_bdays: int) -> bool:
    ltd = last_trade_date(contract_month, rule)
    return add_bdays(ltd, -roll_bdays) <= today


def tradeable_months(rule: str, today: dt.date, roll_bdays: int, count: int = 2) -> list[str]:
    """The first `count` contract months not inside the roll window."""
    out: list[str] = []
    y, m = today.year, today.month
    for _ in range(18):
        cm = f"{y:04d}{m:02d}"
        if not inside_roll_window(cm, rule, today, roll_bdays):
            out.append(cm)
            if len(out) == count:
                break
        y, m = _shift_month(y, m, 1)
    return out
