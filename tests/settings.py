"""Minimal Django settings for Voyager's test suite.

Deliberately consumer-shaped: voyager is an installed app, templates
resolve through the Jinja2 backend with APP_DIRS=True, and static files
are gathered by the standard staticfiles machinery - so the tests prove
the integration paths the README promises, not a bespoke harness.
"""

SECRET_KEY = "voyager-test-suite"

INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "voyager",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.jinja2.Jinja2",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {},
    },
]

STATIC_URL = "/static/"

STORAGES = {
    "staticfiles": {
        "BACKEND": "voyager.storage.VoyagerManifestStaticFilesStorage",
    },
}

USE_TZ = True
