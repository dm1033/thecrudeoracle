"""Collect CFTC Commitments of Traders (disaggregated, futures only) for the positioning analyst.

Usage:
  python data/collect_cot.py --out log/inputs/<run-id>
  python data/collect_cot.py --discover      # print candidate contract codes by name pattern

Output per product: last 52 weeks of managed-money long/short/net, producer/merchant net and
swap-dealer net, plus 3-year percentiles of managed-money net so "crowded" is defined in code
(85th / 15th percentile, config.yaml) and not left to the model.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path
from typing import Any

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import StepFailed, load_config, write_json  # noqa: E402

COLS = {
    "date": ["Report_Date_as_YYYY-MM-DD", "As_of_Date_In_Form_YYMMDD"],
    "name": ["Market_and_Exchange_Names"],
    "code": ["CFTC_Contract_Market_Code"],
    "mm_long": ["M_Money_Positions_Long_All", "M_Money_Positions_Long_ALL"],
    "mm_short": ["M_Money_Positions_Short_All", "M_Money_Positions_Short_ALL"],
    "pm_long": ["Prod_Merc_Positions_Long_All", "Prod_Merc_Positions_Long_ALL"],
    "pm_short": ["Prod_Merc_Positions_Short_All", "Prod_Merc_Positions_Short_ALL"],
    "sd_long": ["Swap_Positions_Long_All", "Swap_Positions_Long_ALL"],
    "sd_short": ["Swap__Positions_Short_All", "Swap_Positions_Short_All", "Swap__Positions_Short_ALL"],
    "oi": ["Open_Interest_All", "Open_Interest_ALL"],
}


def _col(df: pd.DataFrame, key: str) -> str:
    for c in COLS[key]:
        if c in df.columns:
            return c
    raise StepFailed(f"COT file is missing a column for {key}; columns start {list(df.columns)[:8]}")


def load_history(cfg: dict[str, Any]) -> pd.DataFrame:
    import cot_reports as cot  # imported lazily so tests without the package still run

    year = dt.date.today().year
    frames = []
    for y in range(year - int(cfg["cot"]["years_of_history"]) + 1, year + 1):
        try:
            frames.append(cot.cot_year(y, cot_report_type=cfg["cot"]["report_type"], store_txt=False, verbose=False))
        except Exception as e:  # a missing current-year file early in January is not fatal
            if y == year:
                print(f"warning: COT {y} not available yet: {e}")
            else:
                raise StepFailed(f"COT {y}: {e}") from e
    if not frames:
        raise StepFailed("no COT data loaded")
    df = pd.concat(frames, ignore_index=True)
    df["_date"] = pd.to_datetime(df[_col(df, "date")])
    df["_code"] = df[_col(df, "code")].astype(str).str.strip()
    return df


def discover(cfg: dict[str, Any]) -> None:
    df = load_history(cfg)
    name_col = _col(df, "name")
    latest = df[df["_date"] == df["_date"].max()]
    for sym, pat in cfg["cot"]["name_patterns"].items():
        hits = latest[latest[name_col].str.contains(pat, case=False, regex=True)]
        print(f"\n{sym}: /{pat}/")
        for _, r in hits.iterrows():
            print(f"   {r['_code']:8s} {r[name_col]}")


def collect(out_dir: Path, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    cfg = cfg or load_config()
    df = load_history(cfg)
    hi, lo = cfg["cot"]["crowded_high_pct"], cfg["cot"]["crowded_low_pct"]
    out: dict[str, Any] = {"source": "CFTC disaggregated futures-only via cot_reports",
                           "as_of_note": "COT positions are as of Tuesday and published Friday.",
                           "crowded_rule": f"managed-money net above p{hi} or below p{lo} of 3 years",
                           "products": {}}
    for sym, code in cfg["cot"]["codes"].items():
        d = df[df["_code"] == str(code)].sort_values("_date")
        if d.empty:
            raise StepFailed(f"COT: no rows for {sym} code {code}; run --discover and fix config.yaml")
        mm_net = (d[_col(d, "mm_long")] - d[_col(d, "mm_short")]).astype(float)
        pm_net = (d[_col(d, "pm_long")] - d[_col(d, "pm_short")]).astype(float)
        sd_net = (d[_col(d, "sd_long")] - d[_col(d, "sd_short")]).astype(float)
        pct = float((mm_net < mm_net.iloc[-1]).mean() * 100)
        weekly = [{
            "date": r["_date"].strftime("%Y-%m-%d"),
            "mm_long": int(r[_col(d, "mm_long")]), "mm_short": int(r[_col(d, "mm_short")]),
            "mm_net": int(mn), "prod_merc_net": int(pn), "swap_dealer_net": int(sn),
            "open_interest": int(r[_col(d, "oi")]),
        } for (_, r), mn, pn, sn in zip(d.tail(52).iterrows(), mm_net.tail(52), pm_net.tail(52), sd_net.tail(52))]
        out["products"][sym] = {
            "cftc_code": str(code), "market_name": str(d[_col(d, "name")].iloc[-1]),
            "latest_date": weekly[-1]["date"],
            "mm_net_latest": weekly[-1]["mm_net"],
            "mm_net_change_1w": weekly[-1]["mm_net"] - weekly[-2]["mm_net"] if len(weekly) > 1 else None,
            "mm_net_3y_percentile": round(pct, 1),
            "crowded": "long" if pct >= hi else ("short" if pct <= lo else "no"),
            "mm_net_3y_min": int(mm_net.min()), "mm_net_3y_max": int(mm_net.max()),
            "weekly": weekly,
        }
    write_json(out_dir / "cot.json", out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path)
    ap.add_argument("--discover", action="store_true")
    a = ap.parse_args()
    if a.discover:
        discover(load_config())
    elif a.out:
        collect(a.out)
        print(f"wrote {a.out / 'cot.json'}")
    else:
        ap.error("--out or --discover")
