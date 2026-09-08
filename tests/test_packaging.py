"""Packaging smoke tests: collectstatic gathers the design system and
VoyagerManifestStaticFilesStorage hashes both the CSS @import chain and
the ES-module import chain in index.js."""

import json
import re
import shutil
import tempfile

from django.core.management import call_command
from django.test import SimpleTestCase, override_settings

HASHED = re.compile(r"\.[0-9a-f]{8,}\.")


class CollectstaticTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.static_root = tempfile.mkdtemp(prefix="voyager-static-")
        cls.addClassCleanup(shutil.rmtree, cls.static_root, ignore_errors=True)
        with override_settings(STATIC_ROOT=cls.static_root):
            call_command("collectstatic", interactive=False, verbosity=0)
        manifest_path = f"{cls.static_root}/staticfiles.json"
        with open(manifest_path, encoding="utf-8") as fh:
            cls.manifest = json.load(fh)["paths"]

    def test_entry_points_are_collected_and_hashed(self):
        for entry in ("voyager/assets/css/index.css", "voyager/assets/js/index.js"):
            self.assertIn(entry, self.manifest)
            self.assertRegex(self.manifest[entry], HASHED)

    def test_css_import_chain_is_rewritten(self):
        hashed_css = self.manifest["voyager/assets/css/index.css"]
        with open(f"{self.static_root}/{hashed_css}", encoding="utf-8") as fh:
            content = fh.read()
        self.assertNotIn('"settings.css"', content)
        self.assertRegex(content, r'@import url\("settings\.[0-9a-f]{8,}\.css"\)')

    def test_js_module_import_chain_is_rewritten(self):
        hashed_js = self.manifest["voyager/assets/js/index.js"]
        with open(f"{self.static_root}/{hashed_js}", encoding="utf-8") as fh:
            content = fh.read()
        self.assertNotIn("modal/modal.js", content)
        self.assertRegex(content, r"modal/modal\.[0-9a-f]{8,}\.js")
