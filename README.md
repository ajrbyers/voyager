# Voyager

Voyager is Janeway's design system. It draws inspiration from two systems we
admire — [GitHub Primer](https://primer.style/) (chrome density, admin patterns)
and the [GOV.UK Design System](https://design-system.service.gov.uk/)
(accessibility discipline, form conventions) — but every component is
hand-written for Janeway's editorial admin context. Voyager has no runtime
dependency on either source. The lessons are theirs; the code is ours.

Plain modern CSS — no preprocessor, no Tailwind, no framework. Native CSS
nesting and custom properties only.

## What's in here

```
foundations/   tokens, typography, layout
components/    one folder per component, co-located .html and .css
examples/      reference pages built only from documented components
assets/css/    the bundle entry point (index.css) and shared layers
assets/js/     the small amount of JS that powers the docs site
```

The single stylesheet entry point is `assets/css/index.css`. Pages link only to
that file; it `@import`s every layer in the correct order.

## Architecture

ITCSS layer order:

```
settings  →  reset  →  elements  →  components  →  utilities
```

Utilities load **last** so they win on specificity. See
[`assets/css/README.md`](assets/css/README.md) for the full architecture
document.

### Tokens

Two-tier system on `:root` in `settings.css`:

1. **Raw tokens** — the underlying value: `--colour-grey-9: #1f2328;`
2. **Semantic aliases** — point at raw tokens by role: `--colour-fg: var(--colour-grey-9);`

Components reference **semantic** tokens. Pages and themes can override
semantic aliases without touching raw tokens.

### Components

- Each component lives in `components/<name>/` with co-located `<name>.html`
  and `<name>.css` (and, in the Janeway integration, a `<name>.j2` macro).
- The CSS file opens with **one root class** matching the component name.
  Every other declaration nests under it via `&`.
- Variants are **extra flat classes composed in the markup** — not BEM
  modifiers. Example: `<a class="btn btn-primary btn-large">` not
  `<a class="btn btn--primary btn--large">`.

### Rules

1. No inline styles. Anywhere. If a one-off margin or width is needed, add a
   utility class.
2. Element selectors stay in `elements.css`. Don't add element selectors to
   component files.
3. Components don't reference each other's classes. A component is
   self-contained. Composition happens in the markup.
4. Utilities are last-resort and load last. Prefer composing existing
   components.
5. Accessibility is a quality bar — AA contrast, real focus rings, semantic
   HTML, no fake ARIA.

## Viewing locally

Voyager is a static site. Open `index.html` directly in a browser, or serve
the directory:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

The docs site supports light and dark themes via the toggle in the header;
preference is stored in `localStorage`.

## Using Voyager in a page

Link the single bundle and use the component markup:

```html
<link rel="stylesheet" href="/voyager/assets/css/index.css">

<span class="tag tag-green">Under review</span>
<span class="tag tag-grey">Article</span>
```

Or, in Janeway, call the Jinja2 macro:

```jinja
{% from "voyager/components/tag/tag.j2" import tag %}

{{ tag("Under review", kind="green") }}
{{ tag("Article", kind="grey") }}
```

## Status

Voyager is at `v0.1` — the foundations, component set, and three reference
pages (editor dashboard, manager index, peer-review screen) are in place. The
next phase is wiring components into Janeway templates.
