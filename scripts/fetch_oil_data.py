import os
import json
from datetime import datetime, timezone
import requests

EIA_API_KEY = os.environ.get("EIA_API_KEY", "DEMO_KEY")
OUTPUT_PATH = "data/market_snapshot.json"


def fetch_eia_crude_stocks():
    """Fetches the last 12 weeks of U.S. Crude Oil Ending Stocks (WCRSTUS1) from EIA API v2."""
    url = "https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
    params = {
        "api_key": EIA_API_KEY,
        "frequency": "weekly",
        "data[0]": "value",
        "facets[series][]": "WCRSTUS1",
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
        records.append({
            "period": row.get("period"),
            "series": row.get("series"),
            "value_thousand_bbl": float(row["value"]) if row.get("value") is not None else None,
            "units": row.get("units", "MBBL"),
        })
    return records


def _num(row, key):
    return int(float(row.get(key) or 0))


def fetch_cftc_wti_managed_money():
    """Fetches the last 12 weeks of NYMEX WTI Physical (067651) Managed Money COT positioning."""
    url = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json"
    params = {
        "$where": "cftc_contract_market_code='067651'",
        "$order": "report_date_as_yyyy_mm_dd DESC",
        "$limit": 12,
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    raw_rows = resp.json()

    records = []
    for row in raw_rows:
        long_pos = _num(row, "m_money_positions_long_all")
        short_pos = _num(row, "m_money_positions_short_all")
        records.append({
            "report_date": (row.get("report_date_as_yyyy_mm_dd") or "")[:10],
            "contract": row.get("market_and_exchange_names", "WTI-PHYSICAL - NEW YORK MERCANTILE EXCHANGE"),
            "open_interest": _num(row, "open_interest_all"),
            "managed_money_long": long_pos,
            "managed_money_short": short_pos,
            "managed_money_spreading": _num(row, "m_money_positions_spread_all"),
            "managed_money_net": long_pos - short_pos,
        })
    return records


def main():
    payload = {
        "source": "The Crude Oracle (https://www.thecrudeoracle.com)",
        "license": "CC-BY-4.0",
        "updated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "eia_us_crude_stocks": fetch_eia_crude_stocks(),
        "cftc_wti_managed_money": fetch_cftc_wti_managed_money(),
    }
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Successfully wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
