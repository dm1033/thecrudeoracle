.PHONY: test dryrun fixtures tearsheet
test:
	python -m pytest -q tests
fixtures:
	python tests/make_fixtures.py
dryrun:
	PAPER_BOOK_NOW=2026-11-04T08:00 python agents/run_desk.py --run daily --offline --no-proof
tearsheet:
	python report/tearsheet.py
chart:
	python report/weekly_chart.py
issue:
	python report/sunday_issue.py
eia-post:
	python report/eia_post.py
