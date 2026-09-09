"""Browser regression tests for the JavaScript interaction contracts.

Gated behind VOYAGER_BROWSER_TESTS=1 (run via `make test-browser`):
they need Playwright plus an installed Chromium, which the plain unit
run shouldn't demand. Each test reproduces a behaviour from the
September 2026 review follow-up, driving real macro output (rendered by
the fixture server) with the real shipped drivers and HTMX.
"""

import os
import unittest

from tests.browser import server as fixture_server

RUN = os.environ.get("VOYAGER_BROWSER_TESTS") == "1"


@unittest.skipUnless(RUN, "browser tests run only with VOYAGER_BROWSER_TESTS=1")
class BrowserTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from playwright.sync_api import sync_playwright

        cls.server, cls.base_url = fixture_server.start_server()
        cls.addClassCleanup(cls.server.shutdown)
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        cls.browser = cls.playwright.chromium.launch()
        cls.addClassCleanup(cls.browser.close)

    def open_page(self, path, **kwargs):
        page = self.browser.new_page(**kwargs)
        self.addCleanup(page.close)
        page.goto(self.base_url + path)
        return page

    def active_element_id(self, page):
        return page.evaluate("document.activeElement && document.activeElement.id")

    def status_text(self, page):
        return page.evaluate(
            "(document.getElementById('tag-picker-cats-status') || {}).textContent || ''"
        ).strip()


class TagPickerTests(BrowserTestCase):
    def test_remove_announces_and_restores_focus(self):
        page = self.open_page("/tag-picker")
        page.click('button[aria-label="Remove Astro"]')
        page.wait_for_function(
            "!document.querySelector('[aria-label=\"Remove Astro\"]')"
        )
        self.assertEqual(self.status_text(page), "Astro removed")
        page.wait_for_function(
            "document.activeElement ==="
            " document.querySelector('#tag-picker-cats .tag-picker-search input')"
        )

    def test_unrelated_swap_does_not_announce_or_steal_focus(self):
        page = self.open_page("/tag-picker")
        # Start a slow remove, then refresh the unrelated panel while the
        # picker request is still in flight.
        page.click('button[aria-label="Remove Astro"]')
        page.click("#refresh-panel")
        page.wait_for_selector("#panel-fresh")
        # The panel swap must not surface the picker's pending action.
        self.assertEqual(self.status_text(page), "")
        self.assertEqual(self.active_element_id(page), "refresh-panel")
        # The picker's own swap then lands and announces normally.
        page.wait_for_function(
            "!document.querySelector('[aria-label=\"Remove Astro\"]')"
        )
        self.assertEqual(self.status_text(page), "Astro removed")

    def test_failed_request_clears_pending_state(self):
        page = self.open_page("/tag-picker")
        page.click('button[aria-label="Remove Quantum"]')  # endpoint returns 500
        page.wait_for_timeout(200)
        # A later unrelated swap must not replay the failed action.
        page.click("#refresh-panel")
        page.wait_for_selector("#panel-fresh")
        self.assertEqual(self.status_text(page), "")
        self.assertEqual(self.active_element_id(page), "refresh-panel")
        # The failed removal leaves the chip in place.
        self.assertTrue(page.query_selector('button[aria-label="Remove Quantum"]'))


class ModalTests(BrowserTestCase):
    def test_replacement_modal_restores_focus_to_page_opener(self):
        page = self.open_page("/modal")
        page.click("#open-a")
        page.wait_for_selector("#modal-a.is-open")
        page.click("#open-b")
        page.wait_for_selector("#modal-b.is-open")
        # Single-open: A is dismissed when B opens.
        self.assertFalse(page.query_selector("#modal-a.is-open"))
        page.keyboard.press("Escape")
        page.wait_for_function(
            "!document.querySelector('.modal-backdrop.is-open')"
        )
        # Focus returns to the page-level opener, not the hidden control
        # inside dismissed modal A.
        self.assertEqual(self.active_element_id(page), "open-a")

    def test_background_is_inert_while_open_and_restored_after(self):
        page = self.open_page("/modal")
        page.click("#open-a")
        page.wait_for_selector("#modal-a.is-open")
        self.assertTrue(page.evaluate("document.getElementById('open-a').inert"))
        page.keyboard.press("Escape")
        page.wait_for_function(
            "!document.querySelector('.modal-backdrop.is-open')"
        )
        self.assertFalse(page.evaluate("document.getElementById('open-a').inert"))
        self.assertEqual(self.active_element_id(page), "open-a")


class RailOrderTests(BrowserTestCase):
    LINK_IDS = {"lead-link", "content-link", "trail-link"}

    def tab_order(self, page):
        seen = []
        for _ in range(20):
            page.keyboard.press("Tab")
            active = self.active_element_id(page)
            if active in self.LINK_IDS and active not in seen:
                seen.append(active)
            if len(seen) == len(self.LINK_IDS):
                break
        return seen

    def test_narrow_screen_reading_and_tab_order_lead_first(self):
        page = self.open_page("/rail", viewport={"width": 800, "height": 900})
        boxes = page.evaluate(
            "['lead-link','content-link','trail-link'].map("
            "  id => document.getElementById(id).getBoundingClientRect().top)"
        )
        self.assertLess(boxes[0], boxes[1])  # lead above content
        self.assertLess(boxes[1], boxes[2])  # content above trailing rail
        self.assertEqual(
            self.tab_order(page), ["lead-link", "content-link", "trail-link"]
        )

    def test_wide_screen_places_lead_rail_in_right_column(self):
        page = self.open_page("/rail", viewport={"width": 1400, "height": 900})
        lead_x, content_x = page.evaluate(
            "['lead-link','content-link'].map("
            "  id => document.getElementById(id).getBoundingClientRect().x)"
        )
        self.assertGreater(lead_x, content_x)
        # Tab order still leads with the essential rail.
        self.assertEqual(
            self.tab_order(page), ["lead-link", "content-link", "trail-link"]
        )
