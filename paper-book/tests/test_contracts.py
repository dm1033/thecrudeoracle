import datetime as dt

from risk.contracts import inside_roll_window, last_trade_date, tradeable_months


def test_cl_last_trade_date_rule():
    # Dec 2026 CL: 25 Nov 2026 is a Wednesday; three business days earlier is Fri 20 Nov.
    assert last_trade_date("202612", "cl") == dt.date(2026, 11, 20)


def test_rb_ho_last_business_day_of_prior_month():
    assert last_trade_date("202612", "rb_ho") == dt.date(2026, 11, 30)


def test_bz_last_business_day_two_months_prior():
    assert last_trade_date("202612", "bz") == dt.date(2026, 10, 30)


def test_roll_window_and_tradeable_months():
    today = dt.date(2026, 11, 16)
    assert inside_roll_window("202612", "cl", today, 5)          # 5 bdays before 20 Nov is 13 Nov
    assert not inside_roll_window("202701", "cl", today, 5)
    assert tradeable_months("cl", today, 5) == ["202701", "202702"]
