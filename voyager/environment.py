"""Jinja2 environment for rendering Voyager component templates.

Point Django's Jinja2 template backend at this factory:

    "OPTIONS": {
        "environment": "voyager.environment.environment",
    }

Provides:
  - static() and url() globals (the Django docs pattern)
  - {% trans %} / gettext via jinja2.ext.i18n, wired to Django's
    translation machinery (newstyle gettext)
  - date and pluralize filters, which Jinja2 lacks but back-office
    templates routinely need
"""

from django.template.defaultfilters import date, pluralize
from django.templatetags.static import static
from django.urls import reverse
from django.utils import translation

from jinja2 import Environment


def environment(**options):
    extensions = list(options.pop("extensions", []))
    if "jinja2.ext.i18n" not in extensions:
        extensions.append("jinja2.ext.i18n")
    env = Environment(extensions=extensions, **options)
    env.install_gettext_translations(translation, newstyle=True)
    env.globals.update(
        {
            "static": static,
            "url": reverse,
        }
    )
    env.filters.update(
        {
            "date": date,
            "pluralize": pluralize,
        }
    )
    return env
