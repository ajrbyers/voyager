"""Pelican configuration for the Voyager documentation site.

The docs dogfood the package: content pages render the *installed*
`voyager` macros (via ``render_snippet`` / direct imports) and load the
package's own CSS/JS. Pelican is only the docs engine - the shippable
design system is the ``voyager`` Django app, untouched by anything here.
"""

import os

import jinja2
import voyager

SITENAME = "Voyager"
SITEURL = ""
PATH = "content"
OUTPUT_PATH = "output"
TIMEZONE = "Europe/London"
DEFAULT_LANG = "en"
THEME = "themes/voyager-docs"

# Docs pages are plain static pages that mirror the content tree.
PLUGINS = ["pelican.plugins.jinja2content"]
PAGE_PATHS = ["."]
ARTICLE_PATHS = ["__no_articles__"]
PATH_METADATA = r"(?P<path_no_ext>.*)\..*"
PAGE_URL = PAGE_SAVE_AS = "{path_no_ext}.html"
INDEX_SAVE_AS = ""  # the homepage is content/index.html, not a blog index

# No feeds / author / category pages for a docs site.
FEED_ALL_ATOM = CATEGORY_FEED_ATOM = TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = AUTHOR_FEED_RSS = None
DIRECT_TEMPLATES = []
DEFAULT_PAGINATION = False
RELATIVE_URLS = True

# --- Resolve the installed package's macro tree --------------------------
# render_snippet renders a component invocation against the packaged
# macros; content pages also get the tree on the jinja2content loader path
# so they can `{% from "voyager/components/..." import ... %}` directly.
_VOYAGER_JINJA = os.path.join(os.path.dirname(voyager.__file__), "jinja2")
JINJA2CONTENT_TEMPLATES = [".", os.path.relpath(_VOYAGER_JINJA, PATH)]

_snippet_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(_VOYAGER_JINJA),
    autoescape=False,
    keep_trailing_newline=False,
)


def render_snippet(src):
    """Render a component invocation string against the packaged macros.

    Macros emit leading/trailing newlines, so the rendered output collects
    blank lines. Drop blank lines and trailing whitespace so the live
    preview and the auto-derived HTML pane read cleanly. The Jinja2 pane
    shows the authored source verbatim, so its formatting is untouched.
    """
    rendered = _snippet_env.from_string(src).render()
    return "\n".join(
        line.rstrip() for line in rendered.splitlines() if line.strip()
    )


# --- Docs sidebar (single source; retires the old SIDEBAR_HTML in JS) ----
SIDEBAR = [
    ("Get started", [("Overview", "index.html"), ("Architecture", "architecture.html")]),
    ("Foundations", [
        ("Tokens", "foundations/tokens.html"),
        ("Typography", "foundations/typography.html"),
        ("Layout", "foundations/layout.html"),
    ]),
    ("Components", [
        ("Page header", "components/page-header.html"),
        ("Button", "components/button.html"),
        ("Icon", "components/icon.html"),
        ("Summary block", "components/summary-block.html"),
        ("Information", "components/information.html"),
        ("Warning text", "components/warning-text.html"),
        ("App header", "components/app-header.html"),
        ("Breadcrumbs", "components/breadcrumbs.html"),
        ("Tabs", "components/tabs.html"),
        ("Sidebar nav", "components/sidebar-nav.html"),
        ("Application shell", "components/app-shell.html"),
        ("App footer", "components/app-footer.html"),
        ("Rail", "components/rail.html"),
        ("Back link", "components/back-link.html"),
        ("Pagination", "components/pagination.html"),
        ("Tag", "components/tag.html"),
        ("Code chip", "components/code-chip.html"),
        ("Table", "components/table.html"),
        ("Form", "components/form.html"),
        ("Modal", "components/modal.html"),
        ("Details", "components/details.html"),
        ("Panel", "components/panel.html"),
        ("Stat", "components/stat.html"),
        ("Queue card", "components/queue-card.html"),
        ("Steps", "components/steps.html"),
        ("Action menu", "components/action-menu.html"),
        ("Avatar", "components/avatar.html"),
        ("Theme toggle", "components/theme-toggle.html"),
        ("Section divider", "components/section-divider.html"),
        ("Item list", "components/item-list.html"),
        ("Tag picker", "components/tag-picker.html"),
    ]),
    ("Patterns", [("Check answers", "components/check-answers.html")]),
    ("Inbox pattern", [
        ("Folder list", "components/folder-list.html"),
        ("Article card", "components/article-card.html"),
        ("Alert pill", "components/alert-pill.html"),
        ("Filter bar", "components/filter-bar.html"),
        ("Progress bar", "components/progress-bar.html"),
    ]),
    ("Manager pattern", [
        ("Function card", "components/function-card.html"),
        ("Function filter", "components/function-filter.html"),
    ]),
    ("Examples", [
        ("Dashboard", "examples/dashboard.html"),
        ("Manager", "examples/manager.html"),
        ("Peer review", "examples/peer-review.html"),
    ]),
]

JINJA_GLOBALS = {"render_snippet": render_snippet, "SIDEBAR": SIDEBAR}
