# The Wednesday EIA post — forecast before the print, grade after

Every EIA Wednesday from go-live. Two posts on the same thread. The first goes out after the
08:00 ET run has committed and stamped, and before 10:30. The second is the reply at 11:00,
after the `eia` run has graded the call. The point of the pair is the timestamp: the forecast
is provably on the record before the number exists.

**Build:** `python report/eia_post.py --date YYYY-MM-DD` writes `report/eia_post_<date>.md` with
both parts filled from the day's decision files. Run it once after 08:00 for part 1, and again
after 11:00 for part 2.

**Rules** (docs/COMPLIANCE.md): "paper book", never "fund"; no "returns"; the forecast is a
research call, not a recommendation; no live exchange prices; the disclaimer line in the body.

**Timing** (America/New_York): post part 1 between 08:30 and 10:00. Never inside 10:00–10:30,
and never edit it after 10:30. If the 08:00 run recorded no trade or the forecast line failed to
parse, post the failure instead (template below); a missing call is still a call on the record.

**Fill from** `log/decisions/<date>-daily.json` and `<date>-eia.json`:

| Token | Source |
|---|---|
| `[X]`, `[range]` | `eia_forecast.crude_kbbl`, `.crude_range_kbbl` |
| gasoline, distillate | `eia_forecast.gasoline_kbbl`, `.distillate_kbbl` |
| `[commit]`, `[ots proof]` | `proof.stdout` ("stamped <hash> ...") and `log/proofs/<date>-daily.json.ots` |
| `[Y]`, `[E]`, inside/outside | `eia_grading.actual.crude_ex_spr.change_kbbl`, `.crude_error_kbbl`, `.crude_within_range` |
| `[n]` | week number since go-live |

---

## Part 1 — template (before 10:30 ET)

> **EIA Wednesday. The desk's call, on the record before the print.**
>
> US commercial crude stocks: **[X] kb** (range [range]). Gasoline [G] kb. Distillate [D] kb.
> Negative = draw.
>
> Made by the AI desk at 08:00 ET from frozen EIA, CFTC and price data, committed and anchored
> before 10:30: commit `[commit]`, OpenTimestamps proof `[ots proof]`.
>
> The print lands at 10:30. I'll grade it here at 11:00, miss or not.
>
> thecrudeoracle.com/paper-book
>
> Simulated paper trading. No client money. Not investment advice.

## Part 2 — template (reply at 11:00 ET)

> **Graded.** EIA printed **[Y] kb** against the desk's [X] kb. Error [E] kb, [inside / outside]
> the range it gave.
>
> [One sentence on the balance: where the miss or the hit came from — runs, exports, Cushing,
> imports — taken from the eia run's fundamentals report.]
>
> Forecast and print both in the public log, week [n]. The 11:00 run re-read the print and
> [approved N trade(s) / stood aside].
>
> Simulated paper trading. No client money. Not investment advice.

## If the 08:00 run produced no forecast

> **EIA Wednesday. No call today — and that is in the log too.**
>
> The 08:00 run ended "no trade": [reason from `no_trade_reason`, e.g. the EIA data pull failed /
> the fundamentals agent did not emit a parseable forecast]. The rule is that a failed step is
> recorded, not patched. I'll post the print at 11:00 and what changes so it doesn't repeat.
>
> thecrudeoracle.com/paper-book · Simulated paper trading. No client money. Not investment advice.

---

## Variant — Wednesday 4 November 2026 (the first one)

Add one sentence to part 1, after the forecast line:

> This is the first live call. The rules were committed on 8 October, the book went live on
> Monday, and this forecast is the first thing the market gets to grade.

And one to part 2, before the disclaimer:

> One call is not a track record. Every Wednesday from here is in the same log, misses first.

## Holiday weeks

When the EIA shifts the release (Thanksgiving week, Christmas, New Year), set the date in
`config.yaml` via `--eia-date` on the run and post on the shifted day. The `eia` cron entry is
Wednesday-only; run it by hand on a shifted Thursday.

## Checklist

- [ ] Part 1 posted after the daily decision file shows `proof.stdout` starting "stamped".
- [ ] Posted before 10:00 ET; not edited after 10:30.
- [ ] Numbers match `eia_forecast` exactly; the commit hash is the one in the file.
- [ ] Part 2 posted as a reply on the same thread, not a new post.
- [ ] Error and inside/outside copied from `eia_grading`, not recomputed by hand.
- [ ] Disclaimer present as text in both parts.
