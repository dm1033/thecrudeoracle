PYTHON ?= $(shell command -v python 2>/dev/null || command -v python3)

.PHONY: test dryrun fixtures tearsheet chart issue
test:
	$(PYTHON) -m pytest -q tests
fixtures:
	$(PYTHON) tests/make_fixtures.py
dryrun:
	PAPER_BOOK_NOW=2026-11-04T08:00 $(PYTHON) agents/run_desk.py --run daily --offline --no-proof
tearsheet:
	$(PYTHON) report/tearsheet.py
chart:
	$(PYTHON) report/weekly_chart.py
issue:
	$(PYTHON) report/sunday_issue.py
