"""Fixture server for the browser test suite.

Serves small pages that load the packaged CSS/JS entry points plus a
vendored HTMX, with component markup rendered by the *real* packaged
macros - so the browser tests exercise genuine macro output against the
genuine drivers, not hand-written approximations.

Endpoints mimic the tag picker's server contract, including a slow
success (to race unrelated swaps against a pending action) and a
failing remove (to prove pending-state cleanup).
"""

import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import jinja2
from markupsafe import Markup

import voyager

VOYAGER_ROOT = Path(voyager.__file__).parent
FIXTURES = Path(__file__).parent / "fixtures"

TAG_PICKER_TEMPLATE = "voyager/components/tag-picker/tag-picker.j2"
MODAL_TEMPLATE = "voyager/components/modal/modal.j2"

# The two starting items: Astro removes via the slow-but-successful
# endpoint, Quantum via the failing one.
ITEMS = [
    {"name": "Astro", "remove_url": "/cats/remove"},
    {"name": "Quantum", "remove_url": "/cats/remove-fail"},
]
SLOW_REMOVE_SECONDS = 0.5

_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(str(VOYAGER_ROOT / "jinja2"))
)


def macros(template_name):
    return _env.get_template(template_name).module


def render_page(body):
    return (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<link rel="stylesheet" href="/static/voyager/assets/css/index.css">'
        '<script src="/htmx.min.js"></script>'
        '<script type="module" src="/static/voyager/assets/js/index.js"></script>'
        "</head><body>" + body + "</body></html>"
    )


def tag_picker_widget(items):
    return str(
        macros(TAG_PICKER_TEMPLATE).tag_picker(
            name="cats", label="category", items=items,
            search_url="/cats/search",
        )
    )


def tag_picker_page():
    body = (
        '<div id="panel">stale</div>'
        '<button id="refresh-panel" type="button"'
        ' hx-get="/panel" hx-target="#panel">Refresh panel</button>'
        + tag_picker_widget(ITEMS)
    )
    return render_page(body)


def modal_page():
    modal = macros(MODAL_TEMPLATE).modal
    modal_a = str(modal(
        "Modal A", id="modal-a",
        caller=lambda: Markup(
            '<button id="open-b" type="button"'
            ' data-modal-open="modal-b">Open B</button>'
        ),
    ))
    modal_b = str(modal(
        "Modal B", id="modal-b",
        caller=lambda: Markup("<p>Modal B body</p>"),
    ))
    body = (
        '<button id="open-a" type="button"'
        ' data-modal-open="modal-a">Open A</button>'
        + modal_a + modal_b
    )
    return render_page(body)


def rail_page():
    body = (
        '<div class="layout-with-rail">'
        '<aside class="rail" aria-label="Status"><section class="rail-section">'
        '<h2>Status</h2><a id="lead-link" href="#">Lead action</a>'
        "</section></aside>"
        '<div><h1>Content</h1><a id="content-link" href="#">Content link</a></div>'
        '<aside class="rail" aria-label="Steps"><section class="rail-section">'
        '<h2>Steps</h2><a id="trail-link" href="#">Trail link</a>'
        "</section></aside>"
        "</div>"
    )
    return render_page(body)


class FixtureHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # keep test output quiet
        pass

    def send_body(self, body, status=200, content_type="text/html; charset=utf-8"):
        payload = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_file(self, path, content_type):
        try:
            self.send_body(path.read_bytes(), content_type=content_type)
        except OSError:
            self.send_body("not found", status=404)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/tag-picker":
            self.send_body(tag_picker_page())
        elif path == "/modal":
            self.send_body(modal_page())
        elif path == "/rail":
            self.send_body(rail_page())
        elif path == "/panel":
            self.send_body('<span id="panel-fresh">fresh</span>')
        elif path == "/cats/search":
            q = parse_qs(parsed.query).get("q", [""])[0]
            self.send_body(str(
                macros(TAG_PICKER_TEMPLATE).tag_picker_results(
                    "cats", q,
                    results=[{"id": "3", "name": "Gravity"}],
                    add_url="/cats/add", can_create=True,
                )
            ))
        elif path == "/htmx.min.js":
            self.send_file(FIXTURES / "htmx.min.js", "text/javascript")
        elif path.startswith("/static/voyager/"):
            rel = path[len("/static/voyager/"):]
            target = (VOYAGER_ROOT / "static" / "voyager" / rel).resolve()
            if not str(target).startswith(str(VOYAGER_ROOT)):
                self.send_body("forbidden", status=403)
                return
            content_type = (
                "text/css" if target.suffix == ".css" else "text/javascript"
            )
            self.send_file(target, content_type)
        else:
            self.send_body("not found", status=404)

    def do_POST(self):
        if self.path == "/cats/remove":
            time.sleep(SLOW_REMOVE_SECONDS)
            remaining = [i for i in ITEMS if i["name"] != "Astro"]
            self.send_body(tag_picker_widget(remaining))
        elif self.path == "/cats/remove-fail":
            self.send_body("boom", status=500)
        elif self.path == "/cats/add":
            added = ITEMS + [{"name": "Gravity", "remove_url": "/cats/remove"}]
            self.send_body(tag_picker_widget(added))
        else:
            self.send_body("not found", status=404)


def start_server():
    """Start the fixture server on an OS-assigned port; return (server, url)."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    import threading

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{server.server_port}"
