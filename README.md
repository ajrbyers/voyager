# Voyager

Voyager is Janeway's design system. It provides CSS, Jinja macros, and
JavaScript for editorial and administration interfaces: compact layouts
for scanning submission queues, and accessible forms for consequential
actions.

It is plain modern CSS, using native nesting and custom properties
only, with no preprocessor and no framework.

## What's in here

The repository has two parts: the shippable Django app, and a Pelican
documentation site that renders the packaged components.

```
# Shippable design system - the `voyager` Django app (all a consumer needs)
voyager/static/voyager/assets/css/         index.css entry + settings/reset/
                                           elements/utilities layers
voyager/static/voyager/assets/js/          index.js entry - imports and inits
                                           each component driver
voyager/static/voyager/components/<name>/  <name>.css and, where a component
                                           has behaviour, <name>.js
voyager/jinja2/voyager/components/<name>/  <name>.j2 macro for Janeway
voyager/storage.py                         manifest storage that hashes the JS
                                           import chain as well as the CSS

# Documentation site (never shipped) - Pelican, rendering the package
content/                one page per component/foundation/example; every
                        component page renders the packaged macros via
                        the example() helper (foundations document tokens and
                        conventions; the example pages are currently
                        handwritten markup)
themes/voyager-docs/    docs theme: header, sidebar, example() macro, docs CSS/JS
pelicanconf.py          Pelican config: render_snippet + the sidebar registry
```

The **design system** has two entry points, both under
`voyager/static/voyager/assets/`:

- `css/index.css` imports every layer (settings → reset → elements →
  components → utilities) in order, and is the only stylesheet
  consumers ship.
- `js/index.js` is an ES module that imports each component's driver
  (`components/<name>/<name>.js`) and calls its init - the JavaScript
  analogue of `index.css`.

The **docs site** supplies its own header, sidebar, and code-preview
tabs from `themes/voyager-docs/static/` and loads the design system's
CSS and JavaScript entry points as a consumer application would. Component pages
render Voyager's Jinja macros: each example's preview and HTML output
come from the same render, so the build exercises macro rendering and
the shipped assets. It does not exercise release-package installation,
Django template discovery, or interactive behaviour; the test suite
covers those. The three reference pages use handwritten component
markup.

## Architecture

Styles load in layer order, following
[Memory Alpha's](https://github.com/openlibhums/memory-alpha) pattern:

```
settings  →  reset  →  elements  →  components  →  utilities
```

Utilities load **last**, and single-purpose override utilities (text,
margin, flow) carry `!important` so they take precedence over component
declarations at any nesting depth. See
[`CSS-ARCHITECTURE.md`](CSS-ARCHITECTURE.md) for the full architecture
document.

### Tokens

Tokens form a two-tier system on `:root` in `settings.css`:

1. **Raw tokens** hold the underlying value: `--colour-grey-7: #1f2328;`
2. **Semantic aliases** point at raw tokens by role: `--colour-fg: var(--colour-grey-7);`

Components reference **semantic** tokens, including the paired
`--colour-fg-on-emphasis` for text on solid emphasis backgrounds (it
flips with the theme, so components need no per-theme repairs). There
are two documented exceptions to the semantic-only rule: `--colour-white` is
used on fixed saturated backgrounds that stay the same in both themes
(the avatar colour pool), and some earlier components pair raw white
with a bespoke `data-theme="dark"` override block - new components
should use `--colour-fg-on-emphasis` instead. Pages and themes can
override semantic aliases without touching raw tokens.

### Components

- Each component's CSS and JavaScript live at `voyager/static/voyager/components/<name>/`
  and its `<name>.j2` macro at `voyager/jinja2/voyager/components/<name>/`
  (Django keeps static files and templates in separate trees). Its
  documentation page is `content/components/<name>.html`.
- The CSS file opens with a **root class** matching the component name, and
  everything nests under it via `&`. Scoped element selectors under the root
  (`& li`, `& a`, `& td`) are fine; unscoped element selectors are not. A few
  components expose a small family of related roots (for example
  `form` and `information`) rather than a single class.
- Variants are **extra flat classes composed in the markup**, not BEM
  modifiers: `<a class="btn btn-primary btn-large">`, not
  `<a class="btn btn--primary btn--large">`.

### Rules

1. No inline styles anywhere. If a one-off margin or width is needed, add a
   utility class.
2. No *unscoped* element selectors in component files: bare `h1`, `a`, and
   `p` belong in `elements.css`. Element selectors *scoped under the root
   class* (`& li`, `& a`) are fine and used throughout.
3. Components don't reference each other's classes. A component is
   self-contained; composition happens in the markup. The one exception is
   `.icon`, a shared primitive that each host component (`.btn`,
   `.app-header`, `.sidebar-nav`, and others) sizes to its own context.
4. Utilities are a last resort, and load last. Prefer composing existing
   components.
5. Accessibility is a quality bar: AA contrast, visible focus rings,
   semantic HTML, and no fake ARIA.

## Building the docs locally

The docs are a Pelican site. Install the build dependencies (and Voyager
itself, so the pages can render its macros), then build:

```sh
pip install -e . -r requirements-docs.txt
make docs          # renders content/ to output/
cd output && python3 -m http.server 8000
# then open http://localhost:8000
```

`make docs` stages the package's own CSS and JavaScript into the theme (so the docs
load exactly what a consumer installs) and runs Pelican. The site supports
light and dark themes via the toggle in the header; preference is stored in
`localStorage`.

## Running the tests

The tests check Jinja template discovery (every packaged macro renders
through Django's Jinja2 backend with `APP_DIRS=True`), selected macro
outputs, and static-file hashing (`collectstatic` with
`VoyagerManifestStaticFilesStorage` rewrites the CSS and JS import
chains):

```sh
make test
# or: DJANGO_SETTINGS_MODULE=tests.settings python -m django test tests
```

CI additionally installs Voyager from a built wheel - not the source
tree - at both edges of the supported version range, so a release
package missing templates, statics, or a dependency fails the build.

A separate Playwright suite drives the shipped JavaScript drivers in
Chromium against macro output rendered by a fixture server with HTMX.
It covers tag-picker focus and announcements around concurrent and
failed requests, modal single-open focus restoration and the inert
background, and rail reading and tab order at narrow and wide widths:

```sh
pip install playwright && playwright install chromium
make test-browser
```

## Using Voyager in a page

Link the stylesheet and JavaScript entry points, then use the
component markup:

```html
<link rel="stylesheet" href="{% static 'voyager/assets/css/index.css' %}">
<script type="module" src="{% static 'voyager/assets/js/index.js' %}"></script>

<span class="tag tag-green">Under review</span>
<span class="tag tag-grey">Article</span>
```

Or, in Janeway, call the Jinja2 macro:

```jinja
{% from "voyager/components/tag/tag.j2" import tag %}

{{ tag("Under review", kind="green") }}
{{ tag("Article", kind="grey") }}
```

## Installing in a Django project

Voyager is pip-installable as a Django app:

```sh
pip install git+https://github.com/openlibhums/voyager.git
# or, for live editing against a local checkout:
pip install -e ~/Code/voyager
```

Add it to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ...
    "voyager",
]
```

`collectstatic` then gathers the design system automatically, and the
entry points are linked with the `static` tag:

```html
<link rel="stylesheet" href="{% static 'voyager/assets/css/index.css' %}">
<script type="module" src="{% static 'voyager/assets/js/index.js' %}"></script>
```

The Jinja2 macros ship in the app's `jinja2/` directory, so a Jinja2
template backend with `APP_DIRS: True` resolves the
`voyager/components/...` import paths shown above with no further
configuration.

For production cache-busting, point the staticfiles backend at Voyager's
storage class:

```python
STORAGES = {
    "staticfiles": {
        "BACKEND": "voyager.storage.VoyagerManifestStaticFilesStorage",
    },
}
```

Django's default `ManifestStaticFilesStorage` hashes and rewrites the
`@import` chain in `index.css` but leaves the ES-module `import`
specifiers in `index.js` untouched, so the component drivers would ship
unhashed. `VoyagerManifestStaticFilesStorage` enables
`support_js_module_import_aggregation` (Django 4.2 or later) so the
JavaScript import chain is hashed too.

The shippable files live at their canonical Django locations inside
the package - `voyager/static/voyager/` for CSS and JavaScript, and
`voyager/jinja2/voyager/` for the macros - so hatchling ships them as
ordinary package data. There is no build hook and there are no
symlinks: the standard `AppDirectoriesFinder` and an `APP_DIRS` Jinja
backend resolve them.

## Status

Voyager is at `v0.1`. The foundations, the component set, and three
reference pages (the editor dashboard, the manager index, and the
peer-review screen) are in place. The reference pages use handwritten
component markup.

## Licensing

Copyright Birkbeck, University of London. Maintained by the
[Open Library of Humanities](https://www.openlibhums.org/). Voyager is
available under the terms of the GNU Affero General Public License v3 -
see [LICENSE](LICENSE).
