"""The scheduled desk run. One Messages API call per role, frozen inputs, no web access.

    python agents/run_desk.py --run daily|eia|cot|postmortem [--dry-run] [--offline] [--no-proof] [--no-exec]

Protocol (RULES.md section 5): collect -> freeze -> four analysts -> bull/bear -> PM JSON ->
risk check -> commit + timestamp -> place approved orders -> log fills. Any failure records
"no trade" with the reason; nothing is retried inside the run.

--dry-run   : no model calls (canned analyst text and an empty PM proposal), no orders
--offline   : data from tests/fixtures instead of EIA/CFTC/IB/RSS (implies --dry-run unless
              ANTHROPIC_API_KEY is set and --model-calls is passed)
--no-proof  : skip git commit/push and OpenTimestamps (dry runs only; live runs always stamp)
--no-exec   : stop after the decision file (orders are not sent)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import (LOG, ROOT, StepFailed, load_book, load_config, load_limits, manifest, now_ny,  # noqa: E402
                    read_json, run_id as make_run_id, save_book, write_json)
from risk.check import check  # noqa: E402
from risk.contracts import tradeable_months  # noqa: E402
from baseline.trend_carry import proposals as baseline_proposals  # noqa: E402

PROMPTS = ROOT / "agents" / "prompts"
FIXTURES = ROOT / "tests" / "fixtures"
ANALYSTS = ["fundamentals", "positioning", "news", "technical"]

PM_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "trades": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "sleeve": {"type": "string", "enum": ["event", "spread"]},
                    "structure": {"type": "string", "enum": ["outright", "spread"]},
                    "legs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "symbol": {"type": "string", "enum": ["CL", "BZ", "RB", "HO"]},
                                "month": {"type": "string"},
                                "side": {"type": "string", "enum": ["BUY", "SELL"]},
                                "ratio": {"type": "integer"},
                            },
                            "required": ["symbol", "month", "side", "ratio"],
                            "additionalProperties": False,
                        },
                    },
                    "risk_pct_nav": {"type": "number"},
                    "entry": {"type": "number"},
                    "stop": {"type": "number"},
                    "target": {"type": "number"},
                    "horizon_days": {"type": "integer"},
                    "thesis": {"type": "string"},
                    "kill_criteria": {"type": "string"},
                    "confidence": {"type": "integer"},
                },
                "required": ["sleeve", "structure", "legs", "risk_pct_nav", "entry", "stop", "target",
                             "horizon_days", "thesis", "kill_criteria", "confidence"],
                "additionalProperties": False,
            },
        },
        "no_trade_reason": {"type": "string"},
    },
    "required": ["trades", "no_trade_reason"],
    "additionalProperties": False,
}

FORECAST_RE = re.compile(
    r"EIA_FORECAST\s+crude=(?P<crude>-?[\d.]+)\s+crude_range=(?P<lo>-?[\d.]+)\.\.(?P<hi>-?[\d.]+)"
    r"\s+gasoline=(?P<gas>-?[\d.]+)\s+distillate=(?P<dist>-?[\d.]+)")


# ----------------------------------------------------------------------------- model desk
class Desk:
    """Wraps the Anthropic client so every call is logged with the pinned model and usage."""

    def __init__(self, cfg: dict[str, Any], when: dt.datetime, dry_run: bool):
        self.cfg, self.when, self.dry_run = cfg, when, dry_run
        self.calls: list[dict[str, Any]] = []
        self.client = None
        if not dry_run:
            import anthropic
            self.client = anthropic.Anthropic()

    def _system(self, role: str) -> str:
        shared = (PROMPTS / "_shared.md").read_text().replace("{DATE}", f"{self.when:%Y-%m-%d}").replace(
            "{TIME}", f"{self.when:%H:%M}")
        return shared + "\n\n" + (PROMPTS / f"{role}.md").read_text()

    def ask(self, role: str, inputs: str, json_schema: dict[str, Any] | None = None) -> str:
        m = self.cfg["model"]
        if self.dry_run:
            text = self._canned(role)
            self.calls.append({"role": role, "model": "dry-run", "input_chars": len(inputs)})
            return text
        import anthropic
        kwargs: dict[str, Any] = {
            "model": m["id"],
            "max_tokens": int(m["max_tokens_pm"] if role == "pm" else m["max_tokens_analyst"]),
            "system": [{"type": "text", "text": self._system(role), "cache_control": {"type": "ephemeral"}}],
            "messages": [{"role": "user", "content": inputs}],
            "output_config": {"effort": m.get("effort", "high")},
        }
        if json_schema:
            kwargs["output_config"]["format"] = {"type": "json_schema", "schema": json_schema}
        try:
            resp = self.client.messages.create(**kwargs)
        except anthropic.RateLimitError as e:
            raise StepFailed(f"{role}: rate limited ({e})") from e
        except anthropic.APIStatusError as e:
            raise StepFailed(f"{role}: API error {e.status_code}: {e.message}") from e
        except anthropic.APIConnectionError as e:
            raise StepFailed(f"{role}: connection error ({e})") from e
        rec = {"role": role, "model_requested": m["id"], "model_served": resp.model, "stop_reason": resp.stop_reason,
               "usage": resp.usage.model_dump() if hasattr(resp.usage, "model_dump") else dict(resp.usage)}
        self.calls.append(rec)
        if resp.stop_reason == "refusal":
            cat = getattr(getattr(resp, "stop_details", None), "category", None)
            raise StepFailed(f"{role}: model refused (category={cat})")
        if resp.stop_reason == "max_tokens":
            raise StepFailed(f"{role}: output truncated at max_tokens")
        if resp.model != m["id"]:
            raise StepFailed(f"{role}: served model {resp.model} differs from pinned {m['id']}")
        text = "".join(b.text for b in resp.content if b.type == "text")
        if not text.strip():
            raise StepFailed(f"{role}: empty response")
        return text

    @staticmethod
    def _canned(role: str) -> str:
        if role == "pm":
            return json.dumps({"trades": [], "no_trade_reason": "dry run: no model call made"})
        if role == "fundamentals":
            return ("DRY RUN. Facts: none read. Judgement: none.\nVIEW neutral CONFIDENCE 1 HORIZON 5 "
                    "Evidence: a real run.\nEIA_FORECAST crude=0 crude_range=-1000..1000 gasoline=0 distillate=0")
        if role == "postmortem":
            return "DRY RUN.\n```json\n{\"grades\": [], \"proposed_change\": \"none (dry run)\"}\n```"
        return f"DRY RUN ({role}). VIEW neutral CONFIDENCE 1 HORIZON 5 Evidence: a real run."


# ----------------------------------------------------------------------------- steps
def collect_inputs(run: str, inputs_dir: Path, cfg: dict[str, Any], offline: bool) -> dict[str, Any]:
    inputs_dir.mkdir(parents=True, exist_ok=True)
    bundle: dict[str, Any] = {}
    if offline:
        for name in ("eia", "cot", "news", "prices"):
            src = FIXTURES / f"{name}.json"
            if not src.exists():
                raise StepFailed(f"offline fixture missing: {src}")
            shutil.copy(src, inputs_dir / f"{name}.json")
            bundle[name] = read_json(inputs_dir / f"{name}.json")
        return bundle
    from data import collect_eia, collect_cot, collect_news, collect_prices
    bundle["eia"] = collect_eia.collect(inputs_dir, cfg)
    bundle["cot"] = collect_cot.collect(inputs_dir, cfg)
    bundle["news"] = collect_news.collect(inputs_dir, cfg)
    bundle["prices"] = collect_prices.collect(inputs_dir, cfg)
    return bundle


def freeze(inputs_dir: Path) -> dict[str, str]:
    m = manifest(inputs_dir)
    write_json(inputs_dir / "MANIFEST.json", m)
    return m


def analyst_inputs(role: str, bundle: dict[str, Any], run: str, book_view: dict[str, Any]) -> str:
    head = f"RUN={run}. "
    if role == "fundamentals":
        head += "EIA day: forecast this week's print BEFORE it is released. " if run == "daily" and book_view.get("eia_day") else ""
        return head + "\n\nEIA DATA (JSON):\n" + json.dumps(bundle["eia"], indent=1)
    if role == "positioning":
        return head + "\n\nCOT DATA (JSON):\n" + json.dumps(bundle["cot"], indent=1)
    if role == "news":
        return head + "\n\nHEADLINES (JSON, UTC timestamps):\n" + json.dumps(bundle["news"], indent=1)
    if role == "technical":
        slim = json.loads(json.dumps(bundle["prices"]))
        for p in slim["products"].values():
            p["front"]["bars"] = p["front"]["bars"][-60:]
        return head + "\n\nPRICE DATA (JSON, last 60 bars shown; indicators computed on the full history):\n" + json.dumps(slim, indent=1)
    raise ValueError(role)


def parse_forecast(text: str) -> dict[str, Any] | None:
    m = FORECAST_RE.search(text)
    if not m:
        return None
    return {"crude_kbbl": float(m["crude"]), "crude_range_kbbl": [float(m["lo"]), float(m["hi"])],
            "gasoline_kbbl": float(m["gas"]), "distillate_kbbl": float(m["dist"]), "units": "kbbl, negative = draw"}


def book_view(book: dict[str, Any], cfg: dict[str, Any], limits: dict[str, Any], when: dt.datetime) -> dict[str, Any]:
    tm = {sym: tradeable_months(cfg["products"][sym]["expiry_rule"], when.date(), int(limits["roll_business_days_before_ltd"]))
          for sym in ("CL", "BZ", "RB", "HO")}
    return {"nav": book["nav"], "peak_nav": book["peak_nav"], "drawdown_pct": round((book["nav"] / book["peak_nav"] - 1) * 100, 3),
            "open_positions": [{k: v for k, v in p.items() if k != "fills"} for p in book["positions"]],
            "tradeable_months": tm, "limits": limits}


def grade_last_forecast(cfg: dict[str, Any], offline: bool) -> dict[str, Any] | None:
    """On the EIA run: compare the most recent pre-print forecast with the actual print."""
    decisions = sorted(LOG.glob("decisions/*-daily.json"))
    for path in reversed(decisions):
        d = read_json(path)
        fc = d.get("eia_forecast")
        if fc:
            if offline:
                actual = read_json(FIXTURES / "eia_actual.json")
            else:
                from data import collect_eia
                actual = collect_eia.actual_print(cfg)
            crude_actual = actual["crude_ex_spr"]["change_kbbl"]
            return {"forecast_from": path.name, "forecast": fc, "actual": actual,
                    "crude_error_kbbl": round(crude_actual - fc["crude_kbbl"], 1),
                    "crude_within_range": fc["crude_range_kbbl"][0] <= crude_actual <= fc["crude_range_kbbl"][1]}
    return None


def proof(decision_path: Path, cfg: dict[str, Any]) -> dict[str, Any]:
    script = ROOT / "proof" / "stamp.sh"
    res = subprocess.run(["bash", str(script), str(decision_path)], capture_output=True, text=True, cwd=str(ROOT))
    out = {"returncode": res.returncode, "stdout": res.stdout[-2000:], "stderr": res.stderr[-2000:]}
    if res.returncode != 0:
        raise StepFailed(f"proof step failed: {res.stderr[-500:]}")
    return out


# ----------------------------------------------------------------------------- the run
def _rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def run_desk(run: str, dry_run: bool, offline: bool, no_proof: bool, no_exec: bool) -> Path:
    cfg, limits, book = load_config(), load_limits(), load_book()
    when = now_ny()
    rid = make_run_id(run, when)
    inputs_dir = LOG / "inputs" / rid
    decision_path = LOG / "decisions" / f"{rid}.json"
    eia_day = when.weekday() == int(cfg["eia"]["release_weekday"]) or os.environ.get("PAPER_BOOK_EIA_DAY") == "1"
    decision: dict[str, Any] = {
        "run_id": rid, "run": run, "date": f"{when:%Y-%m-%d}", "time_ny": f"{when:%H:%M}",
        "model_pinned": cfg["model"]["id"], "model_effort": cfg["model"].get("effort"), "dry_run": dry_run, "offline": offline,
        "eia_day": eia_day, "inputs_dir": _rel(inputs_dir), "status": "started",
        "book_before": {"nav": book["nav"], "peak_nav": book["peak_nav"], "open_positions": len(book["positions"])},
    }
    desk = Desk(cfg, when, dry_run)
    try:
        bundle = collect_inputs(run, inputs_dir, cfg, offline)
        decision["inputs_manifest"] = freeze(inputs_dir)
        view = book_view(book, cfg, limits, when)
        view["eia_day"] = eia_day
        decision["book_view"] = {k: v for k, v in view.items() if k != "limits"}

        if run == "eia":
            decision["eia_grading"] = grade_last_forecast(cfg, offline)

        if run == "postmortem":
            week = [read_json(p) for p in sorted(LOG.glob("decisions/*.json"))[-14:] if "postmortem" not in p.name]
            text = desk.ask("postmortem", json.dumps({"decisions": week, "book": view}, default=str))
            decision["postmortem"] = text
            decision["status"] = "ok"
            decision["model_calls"] = desk.calls
            write_json(decision_path, decision)
            if not no_proof:
                decision["proof"] = proof(decision_path, cfg)
                write_json(decision_path, decision)
            return decision_path

        with ThreadPoolExecutor(max_workers=4) as ex:
            futs = {r: ex.submit(desk.ask, r, analyst_inputs(r, bundle, run, view)) for r in ANALYSTS}
            reports = {r: f.result() for r, f in futs.items()}
        decision["reports"] = reports
        if eia_day and run == "daily":
            decision["eia_forecast"] = parse_forecast(reports["fundamentals"])
            if decision["eia_forecast"] is None:
                decision["warnings"] = ["fundamentals analyst did not emit a parseable EIA_FORECAST line"]

        with ThreadPoolExecutor(max_workers=2) as ex:
            fb = ex.submit(desk.ask, "bull", json.dumps(reports))
            fr = ex.submit(desk.ask, "bear", json.dumps(reports))
            decision["bull"], decision["bear"] = fb.result(), fr.result()

        pm_raw = desk.ask("pm", json.dumps({"reports": reports, "bull": decision["bull"], "bear": decision["bear"], "book": view}),
                          json_schema=PM_SCHEMA)
        decision["pm_raw"] = pm_raw
        try:
            proposal = json.loads(pm_raw)
        except json.JSONDecodeError as e:
            proposal = {"trades": [], "no_trade_reason": f"PM output was not valid JSON: {e}"}
        decision["pm_proposal"] = proposal

        base = baseline_proposals(bundle["prices"], book, float(cfg["baseline"]["stop_atr_multiple"]))
        decision["baseline"] = base
        combined = {"trades": list(proposal.get("trades", [])) + list(base["trades"])}
        rc = check(combined, book, limits, cfg["products"], when, tradeable=view["tradeable_months"], eia_day=eia_day)
        decision["risk_check"] = rc
        decision["status"] = "ok" if rc["approved"] else "no_trade"
        if not rc["approved"]:
            decision["no_trade_reason"] = proposal.get("no_trade_reason") or "nothing approved by the risk check"
    except StepFailed as e:
        decision["status"] = "no_trade"
        decision["no_trade_reason"] = f"step failed: {e}"
    except Exception as e:  # anything unexpected is still a logged no-trade, never an improvised retry
        decision["status"] = "no_trade"
        decision["no_trade_reason"] = f"unexpected error: {e}"
        decision["traceback"] = traceback.format_exc()[-3000:]
    decision["model_calls"] = desk.calls
    write_json(decision_path, decision)

    if not no_proof:
        try:
            decision["proof"] = proof(decision_path, cfg)
        except StepFailed as e:
            decision["proof"] = {"error": str(e)}
            decision["status"] = "no_trade"
            decision["no_trade_reason"] = f"proof failed, orders withheld: {e}"
        write_json(decision_path, decision)

    if decision["status"] == "ok" and not no_exec and not dry_run:
        from exec.place_orders import execute
        decision["execution"] = execute(decision["risk_check"], decision.get("baseline", {}), book, cfg, limits, rid)
        write_json(decision_path, decision)
    return decision_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", choices=["daily", "eia", "cot", "postmortem"], required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--model-calls", action="store_true", help="with --offline, still call the model")
    ap.add_argument("--no-proof", action="store_true")
    ap.add_argument("--no-exec", action="store_true")
    a = ap.parse_args()
    dry = a.dry_run or (a.offline and not a.model_calls)
    p = run_desk(a.run, dry_run=dry, offline=a.offline, no_proof=a.no_proof, no_exec=a.no_exec)
    d = read_json(p)
    print(f"{_rel(p)}: {d['status']}" + (f" — {d.get('no_trade_reason')}" if d.get("no_trade_reason") else ""))
