# Voyager

Voyager is Janeway's design system - dense chrome for scanning editorial
queues, and disciplined, accessible forms for consequential actions.

Plain modern CSS - no preprocessor, no framework. Native CSS
nesting and custom properties only.

## What's in here

The repo has two parts - the shippable Django app, and a Pelican
documentation site that renders the real components:

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

# Documentation site (never shipped) - Pelican, dogfooding the package
content/                one page per component/foundation/example; each renders
                        the real packaged macros via the example() helper
themes/voyager-docs/    docs theme: the chrome, the example() macro, docs CSS/JS
pelicanconf.py          Pelican config: render_snippet + the sidebar registry
```

The **design system** has two entry points, both under
`voyager/static/voyager/assets/`:

- `css/index.css` - `@import`s every layer (settings → reset → elements →
  components → utilities) in order. The only stylesheet consumers ship.
- `js/index.js` - an ES module that imports each component's driver
  (`components/<name>/<name>.js`) and calls its init - the JS analogue of
  `index.css`.

The **docs site** supplies its own chrome (header, sidebar, code-preview
tabs) from `themes/voyager-docs/static/` and loads the design system
exactly as a consumer application would, so the docs are a live
integration test of the package.

## Architecture

ITCSS layer order:

```
settings  →  reset  →  elements  →  components  →  utilities
```

Utilities load **last**, and single-purpose override utilities (text,
margin, flow) carry `!important` so they beat component declarations at
any nesting depth - the ITCSS terminal layer. See
[`CSS-ARCHITECTURE.md`](CSS-ARCHITECTURE.md) for the full architecture
document.

### Tokens

Two-tier system on `:root` in `settings.css`:

1. **Raw tokens** - the underlying value: `--colour-grey-7: #1f2328;`
2. **Semantic aliases** - point at raw tokens by role: `--colour-fg: var(--colour-grey-7);`

Components reference **semantic** tokens. Pages and themes can override
semantic aliases without touching raw tokens.

### Components

- Each component's CSS/JS live at `voyager/static/voyager/components/<name>/`
  and its `<name>.j2` macro at `voyager/jinja2/voyager/components/<name>/`
  (Django keeps static files and templates in separate trees). Its
  documentation page is `content/components/<name>.html`.
- The CSS file opens with a **root class** matching the component name, and
  everything nests under it via `&`. Scoped element selectors under the root
  (`& li`, `& a`, `& td`) are fine; unscoped element selectors are not. A few
  components expose a small family of related roots (e.g. `form`,
  `information`) rather than a single class.
- Variants are **extra flat classes composed in the markup** - not BEM
  modifiers. Example: `<a class="btn btn-primary btn-large">` not
  `<a class="btn btn--primary btn--large">`.

### Rules

1. No inline styles. Anywhere. If a one-off margin or width is needed, add a
   utility class.
2. No *unscoped* element selectors in component files - bare `h1`, `a`, `p`
   belong in `elements.css`. Element selectors *scoped under the root class*
   (`& li`, `& a`) are fine and used throughout.
3. Components don't reference each other's classes. A component is
   self-contained; composition happens in the markup. The one deliberate
   exception is `.icon`, a shared primitive that each host component (`.btn`,
   `.app-header`, `.sidebar-nav`, …) sizes to its own context.
4. Utilities are last-resort and load last. Prefer composing existing
   components.
5. Accessibility is a quality bar - AA contrast, real focus rings, semantic
   HTML, no fake ARIA.

## Building the docs locally

The docs are a Pelican site. Install the build dependencies (and Voyager
itself, so the pages can render its macros), then build:

```sh
pip install -e . -r requirements-docs.txt
make docs          # renders content/ to output/
cd output && python3 -m http.server 8000
# then open http://localhost:8000
```

`make docs` stages the package's own CSS/JS into the theme (so the docs
load exactly what a consumer installs) and runs Pelican. The site supports
light and dark themes via the toggle in the header; preference is stored in
`localStorage`.

## Using Voyager in a page

Link the stylesheet bundle and the behaviour entry, then use the
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
bundles are linked with the `static` tag:

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
`support_js_module_import_aggregation` (Django >= 4.2) so the JS import
chain is hashed too.

Packaging notes: the shippable files live at their canonical Django
locations inside the package - `voyager/static/voyager/` (CSS and JS) and
`voyager/jinja2/voyager/` (macros) - so hatchling ships them as ordinary
package data. No build hook, no symlinks: standard `AppDirectoriesFinder`
and `APP_DIRS` Jinja resolve them.

## Status

Voyager is at `v0.1` - the foundations, component set, and three reference
pages (editor dashboard, manager index, peer-review screen) are in place. The
next phase is wiring components into Janeway templates.

## Licensing

Copyright Birkbeck, University of London. Maintained by the
[Open Library of Humanities](https://www.openlibhums.org/). Voyager is
available under the terms of the GNU Affero General Public License v3 -
see [LICENSE](LICENSE).
