"""Static files storage for Voyager.

Django's default ManifestStaticFilesStorage rewrites CSS ``@import``/``url()``
but leaves ES-module ``import ... from`` specifiers untouched, so the component
drivers imported by ``assets/js/index.js`` would ship unhashed - no
cache-busting, and a hard 404 under any backend that serves only manifested
files. Enabling ``support_js_module_import_aggregation`` (Django >= 4.2, which
is Voyager's minimum) makes the manifest pipeline hash and rewrite the JS
import chain too, so the JS is cache-busted exactly like the CSS.

Point the staticfiles backend at this class::

    STORAGES = {
        "staticfiles": {
            "BACKEND": "voyager.storage.VoyagerManifestStaticFilesStorage",
        },
    }
"""

from django.contrib.staticfiles.storage import ManifestStaticFilesStorage


class VoyagerManifestStaticFilesStorage(ManifestStaticFilesStorage):
    support_js_module_import_aggregation = True
