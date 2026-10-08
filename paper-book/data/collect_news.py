"""Collect timestamped headlines from public RSS feeds for the news analyst.

Items without a parseable timestamp are dropped (the prompt also says to ignore them, but the
pipeline should not even show them). The feed list is logged with the run.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import load_config, write_json  # noqa: E402

UA = {"User-Agent": "CrudeOraclePaperBook/0.1 (+research desk; public RSS only)"}


def _ts(text: str | None) -> dt.datetime | None:
    if not text:
        return None
    try:
        d = parsedate_to_datetime(text)
    except Exception:
        try:
            d = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
        except Exception:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc)


def parse_feed(xml_text: str, feed_url: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    root = ET.fromstring(xml_text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for it in root.iter("item"):  # RSS 2.0
        ts = _ts((it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date")))
        title = (it.findtext("title") or "").strip()
        if ts and title:
            items.append({"ts_utc": ts.isoformat(), "title": title, "link": (it.findtext("link") or "").strip(), "feed": feed_url})
    for e in root.findall(".//atom:entry", ns):  # Atom
        ts = _ts(e.findtext("atom:updated", namespaces=ns) or e.findtext("atom:published", namespaces=ns))
        title = (e.findtext("atom:title", namespaces=ns) or "").strip()
        link_el = e.find("atom:link", ns)
        if ts and title:
            items.append({"ts_utc": ts.isoformat(), "title": title, "link": link_el.get("href", "") if link_el is not None else "", "feed": feed_url})
    return items


def collect(out_dir: Path, cfg: dict[str, Any] | None = None, now: dt.datetime | None = None) -> dict[str, Any]:
    cfg = cfg or load_config()
    now = now or dt.datetime.now(dt.timezone.utc)
    cutoff = now - dt.timedelta(hours=int(cfg["news"]["window_hours"]))
    items: list[dict[str, Any]] = []
    errors: list[str] = []
    for url in cfg["news"]["feeds"]:
        try:
            r = requests.get(url, headers=UA, timeout=30)
            r.raise_for_status()
            items.extend(parse_feed(r.text, url))
        except Exception as e:  # a dead feed is logged, not fatal: the analyst is told what it got
            errors.append(f"{url}: {e}")
    items = [i for i in items if dt.datetime.fromisoformat(i["ts_utc"]) >= cutoff]
    items.sort(key=lambda i: i["ts_utc"], reverse=True)
    out = {"collected_at_utc": now.isoformat(), "window_hours": cfg["news"]["window_hours"],
           "feeds": cfg["news"]["feeds"], "feed_errors": errors,
           "headlines": items[: int(cfg["news"]["max_items"])]}
    write_json(out_dir / "news.json", out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    res = collect(a.out)
    print(f"wrote {a.out / 'news.json'} ({len(res['headlines'])} headlines, {len(res['feed_errors'])} feed errors)")
