# Voyager docs (Pelican). The design system's own CSS/JS is staged from the
# package into the theme at build time (gitignored) so the docs load exactly
# what a consumer installs.
PELICAN ?= pelican
PY ?= python

.PHONY: docs docs-serve docs-clean test test-browser
test:
	DJANGO_SETTINGS_MODULE=tests.settings $(PY) -m django test tests

# Requires: pip install playwright && playwright install chromium
test-browser:
	VOYAGER_BROWSER_TESTS=1 DJANGO_SETTINGS_MODULE=tests.settings $(PY) -m django test tests.browser

docs:
	rm -rf themes/voyager-docs/static/voyager
	cp -r voyager/static/voyager themes/voyager-docs/static/voyager
	$(PELICAN) content -s pelicanconf.py -o output

docs-serve: docs
	cd output && $(PY) -m http.server 8000

docs-clean:
	rm -rf output themes/voyager-docs/static/voyager
