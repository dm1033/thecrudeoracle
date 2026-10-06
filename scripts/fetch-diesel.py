#!/usr/bin/env python3
"""Pull public EIA distillate workbooks into data/diesel-cache.json.

No API key required. These are the hist_xls files EIA publishes for each
series. A series is written only when the workbook's Sourcekey cell matches
the id we asked for. If a download fails, the previous cache is kept and
meta.fail is set.
"""

from __future__ import annotations

import json
import re
import ssl
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

try:
    import xlrd
except ImportError:  # last cache stays on disk; the page still renders
    xlrd = None

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "diesel-cache.json"
UA = {"User-Agent": "TheCrudeOracle diesel desk (public EIA hist_xls)"}

# Ids confirmed by an HTTP 200 on the hist_xls file AND a Sourcekey row inside it.
SERIES = [
    "WDISTUS1",
    "WDISTP11",
    "WDISTP21",
    "WDISTP31",
    "WDISTP41",
    "WDISTP51",
    "WDIST1A1",
    "WDIST1B1",
    "WDIST1C1",
    "WD0ST_NUS_1",
    "WD1ST_NUS_1",
    "WDGSTUS1",
    "WDIUPUS2",
    "WDIRPUS2",
    "WDIEXUS2",
    "WGIRIUS2",
    "WPULEUS3",
    "WOCLEUS2",
    "EER_EPD2DXL0_PF4_Y35NY_DPG",
    "EER_EPD2DXL0_PF4_RGC_DPG",
    "RWTC",
    "RBRTE",
    "EMD_EPD2D_PTE_NUS_DPG",
]

WEEKLY_FROM = date(2016, 1, 1)
DAILY_FROM = date(2021, 1, 1)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def file_suffix(series_id: str) -> str:
    if series_id in ("RWTC", "RBRTE") or series_id.startswith("EER_"):
        return "d"
    return "w"


def xls_url(series_id: str) -> str:
    return f"https://www.eia.gov/dnav/pet/hist_xls/{series_id}{file_suffix(series_id)}.xls"


def parse_book(data: bytes, series_id: str) -> dict:
    book = xlrd.open_workbook(file_contents=data)
    contents = book.sheet_by_index(0)
    release = None
    nxt = None
    for r in range(contents.nrows):
        label = str(contents.cell_value(r, 1)).strip()
        value = contents.cell_value(r, 2)
        if label == "Release Date:" and value:
            release = _coerce_date(value, book.datemode)
        if label == "Next Release Date:" and value:
            nxt = _coerce_date(value, book.datemode)
    data_sheet = book.sheet_by_name("Data 1")
    sourcekey = str(data_sheet.cell_value(1, 1)).strip()
    if sourcekey != series_id:
        raise RuntimeError(f"{series_id} workbook Sourcekey is {sourcekey}")
    title = str(data_sheet.cell_value(0, 1)).strip()
    title = re.sub(r"^Data 1:\s*", "", title)
    points = []
    for r in range(3, data_sheet.nrows):
        raw_date = data_sheet.cell_value(r, 0)
        raw_value = data_sheet.cell_value(r, 1)
        if raw_date in ("", None) or raw_value in ("", None):
            continue
        if data_sheet.cell_type(r, 1) != xlrd.XL_CELL_NUMBER:
            continue
        period = _coerce_date(raw_date, book.datemode)
        if period is None:
            continue
        points.append([period.isoformat(), round(float(raw_value), 4)])
    points.sort(key=lambda row: row[0])
    return {
        "id": series_id,
        "title": title,
        "sourceUrl": f"https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s={series_id}&f={file_suffix(series_id).upper()}",
        "releaseDate": release.isoformat() if release else None,
        "nextReleaseDate": nxt.isoformat() if nxt else None,
        "points": points,
    }


def _coerce_date(value, datemode) -> date | None:
    if isinstance(value, float):
        return xlrd.xldate_as_datetime(value, datemode).date()
    text = str(value).strip()
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def trim(series: dict) -> dict:
    daily = series["id"] in ("RWTC", "RBRTE") or series["id"].startswith("EER_")
    start = DAILY_FROM if daily else WEEKLY_FROM
    series["points"] = [p for p in series["points"] if p[0] >= start.isoformat()]
    return series


def load_news() -> list[dict]:
    feeds = [
        "https://www.eia.gov/rss/todayinenergy.xml",
        "https://www.iea.org/news/rss",
    ]
    words = ("diesel", "distillate", "gasoil", "ulsd", "heating oil")
    items = []
    for url in feeds:
        try:
            xml = fetch(url).decode("utf-8", "replace")
        except Exception:
            continue
        for block in re.findall(r"<item>(.*?)</item>", xml, flags=re.S | re.I)[:40]:
            title = _tag(block, "title")
            link = _tag(block, "link")
            when = _tag(block, "pubDate") or _tag(block, "dc:date")
            if not title or not link:
                continue
            if not any(w in title.lower() for w in words):
                continue
            source = "EIA Today in Energy" if "eia.gov" in url else "IEA"
            items.append({"title": title, "url": link, "time": when, "source": source})
    # unique by url, newest-looking first is feed order
    seen = set()
    out = []
    for item in items:
        if item["url"] in seen:
            continue
        seen.add(item["url"])
        out.append(item)
        if len(out) == 5:
            break
    return out


def _tag(block: str, name: str) -> str:
    m = re.search(rf"<{name}[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{name}>", block, flags=re.S | re.I)
    if not m:
        return ""
    return re.sub(r"\s+", " ", m.group(1)).strip()


def main() -> None:
    previous = {}
    if CACHE.exists():
        previous = json.loads(CACHE.read_text())
    if xlrd is None:
        previous["fail"] = "xlrd is not installed. Last cache kept. pip install xlrd, then rerun."
        previous["fetchedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        previous.setdefault("series", {})
        previous.setdefault("news", [])
        previous.setdefault("dark", [])
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(previous, indent=2) + "\n")
        print(f"FAIL xlrd missing; kept {CACHE}")
        return
    failures = []
    series_out = {}
    for series_id in SERIES:
        try:
            parsed = trim(parse_book(fetch(xls_url(series_id)), series_id))
            if len(parsed["points"]) < 8:
                raise RuntimeError(f"{series_id} returned {len(parsed['points'])} points")
            series_out[series_id] = parsed
            print(f"ok {series_id} {parsed['points'][-1][0]} n={len(parsed['points'])}")
        except Exception as exc:  # noqa: BLE001 — record and keep going
            failures.append(f"{series_id}: {exc}")
            print(f"FAIL {series_id}: {exc}")
            if series_id in previous.get("series", {}):
                series_out[series_id] = previous["series"][series_id]

    news = load_news()
    payload = {
        "fetchedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "fail": "; ".join(failures) if failures else None,
        "method": "EIA public hist_xls. Sourcekey must match the requested id. No API key.",
        "dark": [
            {
                "id": "HO",
                "label": "NYMEX ULSD (HO) front",
                "reason": "The desk tape does not carry a delayed HO print. No paid feed added.",
            },
            {
                "id": "ICE_GASOIL",
                "label": "ICE low-sulphur gasoil",
                "reason": "No free delayed gasoil mark is already in this repo. Not scraped.",
            },
            {
                "id": "ARA",
                "label": "ARA gasoil stocks",
                "reason": "No free official weekly ARA series wired. Insights Global / PJK is paid.",
            },
            {
                "id": "SINGAPORE",
                "label": "Singapore middle distillates",
                "reason": "Enterprise Singapore is public but not wired. Left dark rather than guessed.",
            },
            {
                "id": "STEO",
                "label": "STEO distillate path",
                "reason": "No STEO series id was confirmed against a workbook Sourcekey this run.",
            },
            {
                "id": "IEA_BALANCE",
                "label": "World diesel balance",
                "reason": "IEA Oil Market Report tables are not free to reproduce. No invented world balance.",
            },
        ],
        "series": series_out,
        "news": news,
    }
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {CACHE} series={len(series_out)} news={len(news)} fail={payload['fail']}")


if __name__ == "__main__":
    main()
