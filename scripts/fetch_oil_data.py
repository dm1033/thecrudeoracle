"""Writes data/market_snapshot.json from two public U.S. government sources.

Each source is fetched independently. If one is unavailable (no API key, a
network error, an empty or malformed response) the other is still written and
the unavailable section keeps the rows from the previous snapshot, with its
own `updated_at_utc` showing how old they are. Nothing is ever invented: a
section that has never been fetched stays an empty list.

Exit code is 1 only when no source returned fresh data, so a fully broken run
is visible in the Actions tab while a missing EIA key is a clean skip.
"""

import json
import os
import sys
from datetime import datetime, timezone

import requests

# The workflow passes an empty string when the secret is unset, so treat
# empty and missing the same way.
EIA_API_KEY = (os.environ.get("EIA_API_KEY") or "").strip()
OUTPUT_PATH = "data/market_snapshot.json"

# U.S. ending stocks of crude oil EXCLUDING the Strategic Petroleum Reserve:
# the headline commercial inventory figure in the Weekly Petroleum Status Report.
EIA_SERIES = "WCESTUS1"
EIA_SERIES_NAME = "U.S. Ending Stocks excluding SPR of Crude Oil"

CFTC_CONTRACT = "067651"  # NYMEX WTI Physical


def warn(message):
    # `::warning::` surfaces as an annotation on the GitHub Actions run.
    print(f"::warning::{message}")


def fetch_eia_crude_stocks():
    """Last 12 weeks of U.S. commercial crude stocks (WCESTUS1) from EIA API v2."""
    url = "https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
    params = {
        "api_key": EIA_API_KEY,
        "frequency": "weekly",
        "data[0]": "value",
        "facets[series][]": EIA_SERIES,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "offset": 0,
        "length": 12,
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    raw_rows = resp.json().get("response", {}).get("data", [])

    records = []
    for row in raw_rows:
        if row.get("series") != EIA_SERIES or row.get("value") is None:
            continue
        records.append({
            "period": row.get("period"),
            "series": EIA_SERIES,
            "value_thousand_bbl": float(row["value"]),
            "units": row.get("units", "MBBL"),
        })
    if not records:
        raise ValueError(f"EIA returned no usable rows for {EIA_SERIES}")
    return records


def _num(row, key):
    return int(float(row[key]))


def fetch_cftc_wti_managed_money():
    """Last 12 weeks of NYMEX WTI Physical (067651) Managed Money COT positioning."""
    url = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json"
    params = {
        "$where": f"cftc_contract_market_code='{CFTC_CONTRACT}'",
        "$order": "report_date_as_yyyy_mm_dd DESC",
        "$limit": 12,
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    raw_rows = resp.json()
    if not isinstance(raw_rows, list):
        raise ValueError("CFTC response was not a list of rows")

    records = []
    for row in raw_rows:
        try:
            long_pos = _num(row, "m_money_positions_long_all")
            short_pos = _num(row, "m_money_positions_short_all")
            record = {
                "report_date": row["report_date_as_yyyy_mm_dd"][:10],
                "contract": row.get("market_and_exchange_names", ""),
                "open_interest": _num(row, "open_interest_all"),
                "managed_money_long": long_pos,
                "managed_money_short": short_pos,
                "managed_money_spreading": _num(row, "m_money_positions_spread_all"),
                "managed_money_net": long_pos - short_pos,
            }
        except (KeyError, TypeError, ValueError):
            # A row missing a position field is dropped rather than reported as zero.
            continue
        records.append(record)
    if not records:
        # Say what came back, so a renamed column is visible in the run log.
        first = raw_rows[0] if raw_rows and isinstance(raw_rows[0], dict) else {}
        seen = sorted(k for k in first if "m_money" in k or "open_interest" in k or "report_date" in k)
        raise ValueError(
            f"CFTC returned no usable rows for contract {CFTC_CONTRACT} "
            f"({len(raw_rows)} raw rows; relevant columns in first row: {seen})"
        )
    return records


def load_previous():
    try:
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous = load_previous()
    fresh = 0

    def section(key, fetch, skip_reason=None):
        nonlocal fresh
        if skip_reason:
            warn(f"{key}: skipped ({skip_reason}).")
        else:
            try:
                rows = fetch()
                fresh += 1
                print(f"{key}: fetched {len(rows)} rows.")
                return {"updated_at_utc": now, "rows": rows}
            except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
                # Never print the request URL: it carries the API key.
                detail = exc.__class__.__name__
                status = getattr(getattr(exc, "response", None), "status_code", None)
                if status:
                    detail += f" (HTTP {status})"
                elif isinstance(exc, ValueError) and not isinstance(exc, requests.RequestException):
                    detail += f": {exc}"
                warn(f"{key}: fetch failed, keeping previous rows. {detail}")
        old = previous.get(key)
        if isinstance(old, dict) and isinstance(old.get("rows"), list):
            return old
        return {"updated_at_utc": None, "rows": []}

    eia = section(
        "eia_us_crude_stocks",
        fetch_eia_crude_stocks,
        None if EIA_API_KEY else "EIA_API_KEY secret is not set",
    )
    # The series changed from WCRSTUS1 (including SPR); never carry those rows forward.
    if any(r.get("series") != EIA_SERIES for r in eia["rows"]):
        eia = {"updated_at_utc": None, "rows": []}
    eia["series"] = EIA_SERIES
    eia["series_name"] = EIA_SERIES_NAME
    eia["origin"] = "U.S. Energy Information Administration, API v2"

    cftc = section("cftc_wti_managed_money", fetch_cftc_wti_managed_money)
    cftc["origin"] = "CFTC Disaggregated Futures-Only Commitments of Traders (72hh-3qpy)"

    if fresh == 0:
        print("No source returned fresh data; leaving the snapshot file untouched.")
        return 1

    payload = {
        "source": "The Crude Oracle (https://www.thecrudeoracle.com)",
        "license": "CC-BY-4.0",
        "updated_at_utc": now,
        "eia_us_crude_stocks": eia,
        "cftc_wti_managed_money": cftc,
    }
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    print(f"Wrote {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
