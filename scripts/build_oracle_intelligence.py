#!/usr/bin/env python3
"""The Crude Oracle: public-data monitor pipeline.

Builds public/data/oracle_intelligence.json from free public sources:

  EIA Open Data API v2   spot prices, product spots, weekly stocks   EIA_API_KEY
  CFTC public reporting  disaggregated Commitments of Traders        no key
  FRED API               broad dollar index, 10-year real yield      FRED_API_KEY
  GDELT DOC 2.0 API      news volume on oil supply chokepoints       no key
  GIE AGSI+              EU gas storage                              AGSI_API_KEY

Rules this script keeps, because the site publishes whatever it writes:

  * Nothing is invented. There is no fallback value anywhere. A source that
    is unreachable, has no key, or returns something unexpected produces a
    module with status "not_loaded" and a reason, or keeps the last good
    module with its original dates.
  * Every module carries `as_of`, the date of the newest data point in it,
    and `fetched_utc`, when it was last fetched successfully. Neither is
    refreshed unless that module's data was fetched in this run.
  * No figure is derived from a number typed into this file: no assumed
    freight rate, no assumed five-year average, no assumed mean or standard
    deviation. A statistic is computed from fetched history or left out.
  * Output is descriptive. It carries no buy/sell wording, no support or
    resistance levels and no price targets.
  * The file is rewritten only when a module's data changed, so a run that
    finds nothing new does not trigger a redeploy.

Standard library only.
"""

import datetime
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

EIA_API_KEY = (os.environ.get("EIA_API_KEY") or "").strip()
FRED_API_KEY = (os.environ.get("FRED_API_KEY") or "").strip()
AGSI_API_KEY = (os.environ.get("AGSI_API_KEY") or "").strip()
OUTPUT_PATH = os.environ.get("ORACLE_OUTPUT_PATH") or "public/data/oracle_intelligence.json"

SCHEMA_VERSION = "3.0.0"
USER_AGENT = "public-data-monitor/3.0"
CFTC_WTI_CONTRACT = "067651"  # NYMEX WTI Physical
GDELT_QUERY = (
    '("Strait of Hormuz" OR "Bab el-Mandeb" OR "Red Sea tanker" OR "OPEC quota" '
    'OR "Suez Canal" OR "Libya oilfield") sourcelang:english'
)


class NotLoaded(Exception):
    """A module could not be built. The message is shown on the site."""


def warn(message):
    print(f"::warning::{message}")


def now_utc():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_json(url, params=None, headers=None, timeout=25):
    """GET a JSON document. Raises NotLoaded with a message that never includes the URL (it may carry a key)."""
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    host = urllib.parse.urlsplit(url).netloc
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # Rate limited or briefly unavailable: wait and try again, a few times.
            if exc.code in (429, 502, 503) and attempt < 3:
                time.sleep(15 * (attempt + 1))
                continue
            raise NotLoaded(f"{host} answered HTTP {exc.code}") from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise NotLoaded(f"{host} could not be reached") from None
        except ValueError:
            raise NotLoaded(f"{host} did not return JSON") from None
    raise NotLoaded(f"{host} did not answer")


def number(value):
    """A finite float, or None. Never a default."""
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def mean(values):
    return sum(values) / len(values)


def sample_std(values):
    m = mean(values)
    return math.sqrt(sum((v - m) ** 2 for v in values) / (len(values) - 1))


def pearson(xs, ys):
    mx, my = mean(xs), mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = math.sqrt(sum((x - mx) ** 2 for x in xs)) * math.sqrt(sum((y - my) ** 2 for y in ys))
    return None if den == 0 else num / den


# --- EIA ---------------------------------------------------------------------

def eia_series(route, series_id, frequency, length):
    """Newest-first list of (period, value) for one EIA v2 series."""
    if not EIA_API_KEY:
        raise NotLoaded("the EIA_API_KEY repository secret is not set")
    payload = fetch_json(
        f"https://api.eia.gov/v2/{route}/data/",
        {
            "api_key": EIA_API_KEY,
            "frequency": frequency,
            "data[0]": "value",
            "facets[series][]": series_id,
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "offset": 0,
            "length": length,
        },
    )
    rows = payload.get("response", {}).get("data") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        raise NotLoaded(f"EIA returned no data block for {series_id}")
    points = {}
    for row in rows:
        if not isinstance(row, dict) or row.get("series") != series_id:
            continue
        period, value = row.get("period"), number(row.get("value"))
        if isinstance(period, str) and value is not None and value > 0:
            points[period[:10]] = value
    if not points:
        raise NotLoaded(f"EIA returned no usable rows for {series_id}")
    return sorted(points.items(), reverse=True)


def build_prices():
    brent = eia_series("petroleum/pri/spt", "RBRTE", "daily", 260)
    wti = eia_series("petroleum/pri/spt", "RWTC", "daily", 260)
    values = {
        "brent_usd_bbl": round(brent[0][1], 2),
        "brent_date": brent[0][0],
        "wti_usd_bbl": round(wti[0][1], 2),
        "wti_date": wti[0][0],
    }
    # A spread is only meaningful when both prints are for the same day.
    if brent[0][0] == wti[0][0]:
        values["brent_wti_spread_usd_bbl"] = round(brent[0][1] - wti[0][1], 2)

    wti_closes = [v for _, v in wti]
    if len(wti_closes) >= 50:
        values["wti_50d_average_usd_bbl"] = round(mean(wti_closes[:50]), 2)
    if len(wti_closes) >= 200:
        values["wti_200d_average_usd_bbl"] = round(mean(wti_closes[:200]), 2)
    if len(wti_closes) >= 31:
        moves = [abs(wti_closes[i] - wti_closes[i + 1]) for i in range(30)]
        values["wti_30d_average_daily_move_usd_bbl"] = round(mean(moves), 2)

    try:
        hub = eia_series("natural-gas/pri/fut", "RNGWHHD", "daily", 10)
        values["henry_hub_usd_mmbtu"] = round(hub[0][1], 2)
        values["henry_hub_date"] = hub[0][0]
    except NotLoaded as exc:
        warn(f"prices: Henry Hub left out ({exc})")

    # 3-2-1 crack from New York Harbor spot products, in $/bbl. Left out unless
    # all three prints are for the same day.
    try:
        gasoline = eia_series("petroleum/pri/spt", "EER_EPMRU_PF4_Y35NY_DPG", "daily", 10)
        diesel = eia_series("petroleum/pri/spt", "EER_EPD2DXL0_PF4_Y35NY_DPG", "daily", 10)
        if gasoline[0][0] == diesel[0][0] == wti[0][0]:
            crack = (2 * gasoline[0][1] * 42 + diesel[0][1] * 42 - 3 * wti[0][1]) / 3
            values["crack_321_usd_bbl"] = round(crack, 2)
            values["crack_321_date"] = wti[0][0]
        else:
            warn("prices: 3-2-1 crack left out (product and crude prints are for different days)")
    except NotLoaded as exc:
        warn(f"prices: 3-2-1 crack left out ({exc})")

    return {
        "as_of": max(brent[0][0], wti[0][0]),
        "source_name": "U.S. Energy Information Administration, Open Data API v2",
        "source_url": "https://www.eia.gov/opendata/",
        "data_type": "delayed",
        "values": values,
        "wti_history": [{"date": d, "usd_bbl": round(v, 2)} for d, v in wti],
    }


def stock_block(points):
    latest_date, latest = points[0]
    block = {"week_ending": latest_date, "million_barrels": round(latest / 1000, 3)}
    if len(points) > 1:
        block["change_million_barrels"] = round((latest - points[1][1]) / 1000, 3)
        block["previous_week_ending"] = points[1][0]
    history = [v for _, v in points[:52]]
    if len(history) >= 26:
        spread = sample_std(history)
        block["weeks_in_comparison"] = len(history)
        block["average_million_barrels"] = round(mean(history) / 1000, 3)
        if spread > 0:
            block["z_score"] = round((latest - mean(history)) / spread, 2)
    return block


def build_inventories():
    crude = eia_series("petroleum/stoc/wstk", "WCESTUS1", "weekly", 60)
    values = {"us_commercial_crude": stock_block(crude)}
    try:
        cushing = eia_series("petroleum/stoc/wstk", "W_EPC0_SAX_YCUOK_MBBL", "weekly", 60)
        values["cushing"] = stock_block(cushing)
    except NotLoaded as exc:
        warn(f"inventories: Cushing left out ({exc})")
    return {
        "as_of": crude[0][0],
        "source_name": "EIA Weekly Petroleum Status Report",
        "source_url": "https://www.eia.gov/petroleum/supply/weekly/",
        "data_type": "delayed",
        "values": values,
    }


# --- CFTC --------------------------------------------------------------------

def build_positioning():
    rows = fetch_json(
        "https://publicreporting.cftc.gov/resource/72hh-3qpy.json",
        {
            "$where": f"cftc_contract_market_code='{CFTC_WTI_CONTRACT}'",
            "$order": "report_date_as_yyyy_mm_dd DESC",
            "$limit": 53,
        },
    )
    if not isinstance(rows, list):
        raise NotLoaded("CFTC did not return a list of reports")

    def first(row, *columns):
        for column in columns:
            value = number(row.get(column))
            if value is not None and value >= 0:
                return value
        return None

    reports = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        date = row.get("report_date_as_yyyy_mm_dd")
        long_ = first(row, "m_money_positions_long_all")
        short = first(row, "m_money_positions_short_all")
        open_interest = first(row, "open_interest_all")
        # A report missing a core field is dropped, never read as zero.
        if not isinstance(date, str) or long_ is None or short is None or not open_interest:
            continue
        report = {"date": date[:10], "long": int(long_), "short": int(short), "open_interest": int(open_interest)}
        # The dataset is not consistent about the _all suffix, so both spellings are tried.
        producer_long = first(row, "prod_merc_positions_long_all", "prod_merc_positions_long")
        producer_short = first(row, "prod_merc_positions_short_all", "prod_merc_positions_short")
        if producer_long is not None and producer_short is not None:
            report["producer_net"] = int(producer_long) - int(producer_short)
        reports.append(report)
    reports.sort(key=lambda r: r["date"], reverse=True)
    if not reports:
        sample = rows[0] if rows and isinstance(rows[0], dict) else {}
        columns = sorted(k for k in sample if "m_money_positions" in k or "open_interest_all" in k or "report_date" in k)
        raise NotLoaded(
            f"CFTC returned no usable reports for contract {CFTC_WTI_CONTRACT} ({len(rows)} rows; columns seen: {columns})"
        )
    if "producer_net" not in reports[0]:
        sample = rows[0] if isinstance(rows[0], dict) else {}
        warn(f"positioning: producer/merchant net left out; columns seen: {sorted(k for k in sample if 'prod_merc' in k)}")

    latest = reports[0]
    net = latest["long"] - latest["short"]
    values = {
        "managed_money_long": latest["long"],
        "managed_money_short": latest["short"],
        "managed_money_net": net,
        "managed_money_net_pct_open_interest": round(100 * net / latest["open_interest"], 2),
        "open_interest": latest["open_interest"],
    }
    if "producer_net" in latest:
        values["producer_merchant_net"] = latest["producer_net"]
    if len(reports) > 1:
        previous = reports[1]
        values["net_change"] = net - (previous["long"] - previous["short"])
        values["previous_report_date"] = previous["date"]
    nets = [r["long"] - r["short"] for r in reports[:52]]
    if len(nets) >= 26 and max(nets) > min(nets):
        # Where the latest net sits between the lowest and highest net of the period.
        values["net_position_in_range_pct"] = round(100 * (net - min(nets)) / (max(nets) - min(nets)), 1)
        values["reports_in_range"] = len(nets)
        values["range_low_net"] = min(nets)
        values["range_high_net"] = max(nets)
    return {
        "as_of": latest["date"],
        "source_name": "CFTC Disaggregated Commitments of Traders, futures only",
        "source_url": "https://publicreporting.cftc.gov/d/72hh-3qpy",
        "data_type": "delayed",
        "values": values,
    }


# --- FRED --------------------------------------------------------------------

def fred_series(series_id, limit=80):
    if not FRED_API_KEY:
        raise NotLoaded("the FRED_API_KEY repository secret is not set")
    payload = fetch_json(
        "https://api.stlouisfed.org/fred/series/observations",
        {"series_id": series_id, "api_key": FRED_API_KEY, "file_type": "json", "sort_order": "desc", "limit": limit},
    )
    observations = payload.get("observations") if isinstance(payload, dict) else None
    if not isinstance(observations, list):
        raise NotLoaded(f"FRED returned no observations for {series_id}")
    points = {}
    for obs in observations:
        if isinstance(obs, dict) and isinstance(obs.get("date"), str):
            value = number(obs.get("value"))
            if value is not None:
                points[obs["date"][:10]] = value
    if not points:
        raise NotLoaded(f"FRED returned no usable observations for {series_id}")
    return sorted(points.items(), reverse=True)


def change_correlation(series_a, series_b, window=30):
    """Correlation of day-to-day changes on the dates both series have. None if too few."""
    b = dict(series_b)
    shared = [(d, a, b[d]) for d, a in series_a if d in b][: window + 1]
    if len(shared) < 21:
        return None, 0
    da = [shared[i][1] - shared[i + 1][1] for i in range(len(shared) - 1)]
    db = [shared[i][2] - shared[i + 1][2] for i in range(len(shared) - 1)]
    result = pearson(da, db)
    return (None if result is None else round(result, 2)), len(da)


def build_macro(wti_history):
    dollar = fred_series("DTWEXBGS")
    real_yield = fred_series("DFII10")
    values = {
        "broad_dollar_index": round(dollar[0][1], 2),
        "broad_dollar_date": dollar[0][0],
        "real_yield_10y_pct": round(real_yield[0][1], 2),
        "real_yield_date": real_yield[0][0],
    }
    if wti_history:
        for key, series in (("wti_vs_broad_dollar", dollar), ("wti_vs_real_yield_10y", real_yield)):
            correlation, days = change_correlation(wti_history, series)
            if correlation is not None:
                values[f"{key}_correlation"] = correlation
                values[f"{key}_days"] = days
    return {
        "as_of": max(dollar[0][0], real_yield[0][0]),
        "source_name": "Board of Governors of the Federal Reserve System, via FRED",
        "source_url": "https://fred.stlouisfed.org/",
        "data_type": "delayed",
        "values": values,
    }


# --- GDELT -------------------------------------------------------------------

def gdelt_time(text):
    return datetime.datetime.strptime(text, "%Y%m%dT%H%M%SZ").replace(tzinfo=datetime.timezone.utc)


def build_news():
    base = "https://api.gdeltproject.org/api/v2/doc/doc"
    timeline = fetch_json(base, {"query": GDELT_QUERY, "mode": "timelinevol", "timespan": "7d", "format": "json"})
    series = timeline.get("timeline") if isinstance(timeline, dict) else None
    points = []
    if isinstance(series, list) and series and isinstance(series[0], dict):
        for point in series[0].get("data") or []:
            value = number(point.get("value")) if isinstance(point, dict) else None
            try:
                when = gdelt_time(point["date"])
            except (KeyError, TypeError, ValueError):
                continue
            if value is not None and value >= 0:
                points.append((when, value))
    if len(points) < 24:
        raise NotLoaded("GDELT returned too few timeline points")
    points.sort()
    newest = points[-1][0]
    last_day = [v for when, v in points if newest - when < datetime.timedelta(hours=24)]
    week_average = mean([v for _, v in points])
    if week_average <= 0 or not last_day:
        raise NotLoaded("GDELT returned an empty timeline")

    values = {
        "share_last_24h_vs_7d_average": round(mean(last_day) / week_average, 2),
        "timeline_points": len(points),
        "search_terms": ["Strait of Hormuz", "Bab el-Mandeb", "Red Sea tanker", "OPEC quota", "Suez Canal", "Libya oilfield"],
    }

    time.sleep(6)  # GDELT asks for no more than one request every five seconds.
    headlines = []
    try:
        listing = fetch_json(
            base,
            {"query": GDELT_QUERY, "mode": "artlist", "maxrecords": 15, "sort": "datedesc", "timespan": "3d", "format": "json"},
        )
        seen = set()
        for article in (listing.get("articles") if isinstance(listing, dict) else None) or []:
            if not isinstance(article, dict):
                continue
            title, url, domain = article.get("title"), article.get("url"), article.get("domain")
            if not (isinstance(title, str) and isinstance(url, str) and isinstance(domain, str)):
                continue
            title = " ".join(title.split())
            if not title or not url.startswith("https://") or domain in seen:
                continue
            seen.add(domain)
            try:
                seen_at = gdelt_time(article.get("seendate")).strftime("%Y-%m-%dT%H:%M:%SZ")
            except (TypeError, ValueError):
                continue
            headlines.append({"title": title[:200], "domain": domain[:80], "url": url[:500], "seen_utc": seen_at})
            if len(headlines) == 5:
                break
    except NotLoaded as exc:
        warn(f"news: headlines left out ({exc})")
    values["headlines"] = headlines

    return {
        "as_of": newest.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_name": "The GDELT Project, DOC 2.0 API",
        "source_url": "https://www.gdeltproject.org/",
        "data_type": "delayed",
        "values": values,
    }


# --- GIE AGSI+ ---------------------------------------------------------------

def build_gas_storage():
    if not AGSI_API_KEY:
        raise NotLoaded("the AGSI_API_KEY repository secret is not set")
    payload = fetch_json("https://agsi.gie.eu/api", {"type": "eu", "size": 5}, headers={"x-key": AGSI_API_KEY})
    rows = payload.get("data") if isinstance(payload, dict) else None
    best = None
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        day, full = row.get("gasDayStart"), number(row.get("full"))
        if isinstance(day, str) and full is not None and 0 <= full <= 100:
            if best is None or day > best[0]:
                best = (day[:10], full, number(row.get("trend")))
    if best is None:
        raise NotLoaded("GIE AGSI+ returned no usable EU storage row")
    values = {"eu_storage_pct_full": round(best[1], 2)}
    if best[2] is not None:
        values["daily_change_pct_points"] = round(best[2], 2)
    return {
        "as_of": best[0],
        "source_name": "Gas Infrastructure Europe, AGSI+",
        "source_url": "https://agsi.gie.eu/",
        "data_type": "delayed",
        "values": values,
    }


# --- assembly ----------------------------------------------------------------

def load_previous():
    try:
        with open(OUTPUT_PATH, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return {}
    modules = data.get("modules") if isinstance(data, dict) else None
    if data.get("schema_version") != SCHEMA_VERSION or not isinstance(modules, dict):
        return {}
    return modules


def comparable(module):
    return {k: v for k, v in module.items() if k != "fetched_utc"}


def main():
    previous = load_previous()
    stamp = now_utc()
    modules, fresh = {}, 0
    wti_history = []

    def run(name, builder):
        nonlocal fresh
        try:
            module = {"status": "ok", "fetched_utc": stamp, **builder()}
            fresh += 1
            print(f"{name}: ok, as of {module['as_of']}")
            return module
        except NotLoaded as exc:
            reason = str(exc)
        except Exception as exc:  # A bug in one module must not take the others down.
            reason = f"unexpected {exc.__class__.__name__}"
        old = previous.get(name)
        if isinstance(old, dict) and old.get("status") == "ok":
            warn(f"{name}: {reason}; keeping the module fetched {old.get('fetched_utc')}")
            return old
        warn(f"{name}: not loaded ({reason})")
        return {"status": "not_loaded", "reason": reason}

    prices = run("prices", build_prices)
    if prices.get("status") == "ok":
        wti_history = [(p["date"], p["usd_bbl"]) for p in prices.pop("wti_history", [])]
    modules["prices"] = prices
    modules["inventories"] = run("inventories", build_inventories)
    modules["positioning"] = run("positioning", build_positioning)
    modules["macro"] = run("macro", lambda: build_macro(wti_history))
    modules["news"] = run("news", build_news)
    modules["gas_storage"] = run("gas_storage", build_gas_storage)

    changed = {k: comparable(v) for k, v in modules.items()} != {k: comparable(v) for k, v in previous.items()}
    if not changed:
        print("Nothing changed since the last run; leaving the file untouched.")
        return 0 if fresh else 1

    payload = {
        "schema_version": SCHEMA_VERSION,
        "generated_utc": stamp,
        "publisher": "The Crude Oracle (https://www.thecrudeoracle.com)",
        "notice": (
            "Delayed public data for information only. Not financial advice. "
            "This product uses the FRED API but is not endorsed or certified by the Federal Reserve Bank of St. Louis."
        ),
        "modules": modules,
    }
    os.makedirs(os.path.dirname(OUTPUT_PATH) or ".", exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(f"Wrote {OUTPUT_PATH}")
    return 0 if fresh else 1


if __name__ == "__main__":
    sys.exit(main())
