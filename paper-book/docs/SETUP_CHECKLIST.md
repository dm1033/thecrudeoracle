# Setup checklist — the parts only you can do

Everything in this directory runs offline on fixtures today (`make test`, `make dryrun`). These
are the steps that need your accounts, your money or your server. Tick them in order; the
dry-run gate at the end is what decides go-live.

## 1. Accounts (week 1)

- [ ] IBKR Pro account → Client Portal → Settings → Paper Trading Account. Note the paper username.
- [ ] Complete the non-professional market-data questionnaire truthfully (docs/COMPLIANCE.md).
- [ ] Add NYMEX real-time top of book (about USD 1.25/month non-professional) before go-live; delayed data is fine for dry runs.
- [ ] EIA API key: https://www.eia.gov/opendata/register.php → `EIA_API_KEY`.
- [ ] Anthropic API key (console) → `ANTHROPIC_API_KEY`.
- [ ] GitHub: this repository is public, so committing `RULES.md` here is the pre-registration. If you prefer a standalone `crude-oracle-paper-book` repository, move the `paper-book/` directory there with `git subtree split` so the history (and the inception commit) travels with it.
- [ ] Vercel: the dashboard is the site's `/paper-book` route; it deploys with the site.
- [ ] Optional: Alpaca paper keys, QuantConnect, Databento, FRED, CFTC Socrata token.

## 2. Server (week 1–2)

- [ ] Small Linux VPS (2 vCPU, 4 GB). Install Docker, Python 3.12+, `uv`, `git`.
- [ ] `git clone` this repository to `/opt/crude-oracle-paper-book` (the crontab assumes that path; edit `schedule/crontab` if different).
- [ ] `cd paper-book && uv venv && . .venv/bin/activate && uv pip install -r requirements.txt`
- [ ] `cp .env.example .env` and fill it in. `chmod 600 .env`.
- [ ] A deploy key with push rights so `proof/stamp.sh` can push from the server.

## 3. IB Gateway headless (week 2)

```bash
git clone https://github.com/gnzsnz/ib-gateway-docker.git && cd ib-gateway-docker
cat > .env <<'EOT'
TWS_USERID=your_paper_username
TWS_PASSWORD=your_paper_password
TRADING_MODE=paper
EOT
docker compose up -d     # maps the paper API to 127.0.0.1:4002
```

Keep the API port bound to localhost only. Anyone who can reach it can trade the account.

## 4. Verify the data once (week 2)

- [ ] `python data/collect_eia.py --verify` — every series ID must print OK. Fix `config.yaml` if not.
- [ ] `python data/collect_cot.py --discover` — confirm the four CFTC codes, lock them in `config.yaml`.
- [ ] `python data/collect_prices.py --out /tmp/pb-test` — confirms the gateway, contract months and bars.
- [ ] `python data/collect_news.py --out /tmp/pb-test` — check the feeds return timestamped items; edit the list if a feed is dead.

## 5. Dry runs (weeks 3–4)

- [ ] `./run.sh daily` by hand on five separate days with the real data and the real model, with
      `proof.git_push: false` in `config.yaml` if you do not want dry-run commits pushed. Each must
      complete with no manual fix. Review every decision file.
- [ ] `./run.sh eia` on a Wednesday at 11:00 ET: the grading line must appear.
- [ ] `./run.sh mark` after settlement: `log/nav/<date>.json` appears.
- [ ] `./run.sh postmortem` on a Sunday: `report/dashboard.json` refreshes and the site shows it.
- [ ] Delete the dry-run logs (`git rm -r log/decisions log/inputs log/fills log/nav log/proofs` back to `.gitkeep`), reset `log/book.json` and commit "reset for inception".

## 6. Go-live gate (Monday 2 November 2026)

- [ ] Five clean dry runs recorded above.
- [ ] `RULES.md` revision 0 committed on `main` before 08:00 ET on go-live day.
- [ ] `crontab schedule/crontab` installed on the server; `logs/cron.log` shows the 08:00 run.
- [ ] Real-time NYMEX data active; `prices.json` `data_type` no longer says delayed.

## 7. Weekly after go-live

- Monday: LinkedIn post from the post-mortem (docs/OUTREACH.md).
- Wednesday: the 08:00 run's `eia_forecast` is public before 10:30 ET; graded at 11:00.
- Sunday: Crude Oracle issue from `report/tearsheet.md` and the post-mortem decision file.
- Any limit change: a dated row in `RULES.md` section 9, committed before it applies.
