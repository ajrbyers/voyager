# Voyager

Voyager is Janeway's design system - dense chrome for scanning editorial
queues, and disciplined, accessible forms for consequential actions.

Plain modern CSS - no preprocessor, no framework. Native CSS
nesting and custom properties only.

## What's in here

The tree splits cleanly into two worlds - the shippable design system, and the
documentation site around it:

```
# Shippable design system (all a consumer needs)
assets/css/          index.css entry + settings/reset/elements/utilities layers
assets/js/           index.js entry - imports and inits each component driver
components/<name>/    co-located <name>.css, <name>.j2 and (where a component
                      has behaviour) <name>.js source per component

# Documentation site (never shipped)
docs/assets/css/      site.css (docs chrome) + pages/ (per-page docs styles)
docs/assets/js/       site.js - the JS that powers the docs site
docs/components/       a documentation page per component
foundations/          tokens, typography, layout (doc pages)
examples/             reference pages built only from documented components
```

Two stylesheet entry points, and every doc/example page links both:

- `assets/css/index.css` - the **design system**. It `@import`s every layer
  (settings → reset → elements → components → utilities) in order. This is the
  only file consumers ship.
- `docs/assets/css/site.css` - the **docs-site chrome** (header, sidebar, code
  previews) plus, via `@import`, the page-specific styles in
  `docs/assets/css/pages/`. It lives in the docs tree and is never shipped.

The JS mirrors the same split. `assets/js/index.js` is the design-system
entry: an ES module that imports each component's driver
(`components/<name>/<name>.js`) and calls its init - the JS analogue of
`index.css`. `docs/assets/js/site.js` holds only docs-site behaviour
(sidebar injection, code-preview tabs) and imports the design-system
entry, consuming it exactly as an application would. Every doc/example
page loads `site.js` with `<script type="module">`.

## Architecture

ITCSS layer order:

```
settings  →  reset  →  elements  →  components  →  utilities
```

Utilities load **last**, and single-purpose override utilities (text,
margin, flow) carry `!important` so they beat component declarations at
any nesting depth - the ITCSS terminal layer. See
[`assets/css/README.md`](assets/css/README.md) for the full architecture
document.

### Tokens

Two-tier system on `:root` in `settings.css`:

1. **Raw tokens** - the underlying value: `--colour-grey-7: #1f2328;`
2. **Semantic aliases** - point at raw tokens by role: `--colour-fg: var(--colour-grey-7);`

Components reference **semantic** tokens. Pages and themes can override
semantic aliases without touching raw tokens.

### Components

- Each component lives in `components/<name>/` with co-located `<name>.css`
  and a `<name>.j2` macro for the Janeway integration. Its documentation page
  (with canonical markup) is `docs/components/<name>.html`.
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

## Viewing locally

Voyager is a static site, but its JS loads as ES modules, which browsers
refuse over `file://` - so serve the directory rather than opening files
directly:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

The docs site supports light and dark themes via the toggle in the header;
preference is stored in `localStorage`.

## Using Voyager in a page

Link the stylesheet bundle and the behaviour entry, then use the
component markup:

```html
<link rel="stylesheet" href="/voyager/assets/css/index.css">
<script type="module" src="/voyager/assets/js/index.js"></script>

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

Packaging notes: `assets/` and `components/` stay where they are in the
repo; `hatch_build.py` maps CSS and JS into `voyager/static/voyager/`
and macros into `voyager/jinja2/voyager/` at build time, preserving
their relative geometry so the `@import` paths in `index.css` and the
module imports in `index.js` resolve unchanged (Django's
`ManifestStaticFilesStorage` rewrites both in production). Editable installs use the committed symlinks in
`voyager/static/` and `voyager/jinja2/` instead (Linux and macOS only).

## Status

Voyager is at `v0.1` - the foundations, component set, and three reference
pages (editor dashboard, manager index, peer-review screen) are in place. The
next phase is wiring components into Janeway templates.

## Licensing

Copyright Birkbeck, University of London. Maintained by the
[Open Library of Humanities](https://www.openlibhums.org/). Voyager is
available under the terms of the GNU Affero General Public License v3 -
see [LICENSE](LICENSE).
