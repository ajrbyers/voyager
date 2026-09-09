# Voyager CSS architecture

Voyager is Janeway's design system. It is plain modern CSS - no
preprocessor, no framework. Native CSS nesting and custom properties only.

## Layer order

```
settings  →  reset  →  elements  →  components  →  utilities
```

Each layer is a file or set of files. Utilities are imported **last**, and
single-purpose override utilities (text, margin, flow) carry `!important` so
they beat component declarations at any nesting depth. `index.css` imports the layers in order.

| Layer | File | Contains |
| ----- | ---- | -------- |
| Settings | `settings.css` | Tokens - colour, type stacks, type scale, space scale, layout. Two-tier: raw tokens (`--colour-blue-7`) plus semantic aliases (`--colour-link`). |
| Reset | `reset.css` | Box-sizing, margin/padding zeroing, list-style stripping where appropriate. |
| Elements | `elements.css` | Typography and link styles set on **element selectors only** (`body`, `h1`, `a`, `p`, …). No classes. |
| Components | `../../components/<name>/<name>.css` | One namespaced root class per component, all declarations nested under it with native `&`. No BEM. |
| Utilities | `utilities.css` | Single-purpose helper classes (`.muted`, `.mono`, `.visually-hidden`, `.stack`, `.cluster`). Win over component styles. |

## Component file pattern

- A component's CSS lives at `voyager/static/voyager/components/<name>/<name>.css` and its `<name>.j2` macro at `voyager/jinja2/voyager/components/<name>/<name>.j2` (Django keeps static files and templates in separate trees). The component's documentation page lives at `content/components/<name>.html`.
- The CSS file opens with a **root class** matching the component name; everything nests under it via `&`. Scoped element selectors under the root (`& li`, `& a`) are fine. A few components expose a small family of related roots (e.g. `form`, `information`, `summary-block`) rather than a single class.
- Variants are **extra flat classes composed in the markup** - not BEM modifiers. Example: `<a class="btn btn-primary btn-large">` not `<a class="btn btn--primary btn--large">`. The visual axes (kind, size, intent) compose via separate classes, so a `<button class="btn btn-primary">` can also be `<button class="btn btn-secondary btn-small">` without the modifier suffix proliferation.

## Tokens

Two-tier system on `:root` in `settings.css`:

1. **Raw tokens** - the underlying value: `--colour-grey-7: #1f2328;`
2. **Semantic aliases** - point at raw tokens by role: `--colour-fg: var(--colour-grey-7);`

Components reference **semantic** tokens, including the paired `--colour-fg-on-emphasis` for text on solid emphasis backgrounds (fg-strong, success, accent) - it flips with the theme, so components need no per-theme repairs for on-colour text. Documented exceptions: `--colour-white` on fixed saturated backgrounds that don't flip (the avatar colour pool), and some earlier components that pair raw white with a bespoke `data-theme="dark"` override block; new components should use `--colour-fg-on-emphasis`. Pages and themes can override semantic aliases without touching raw tokens.

## Rules

1. **No inline styles.** Anywhere. If a one-off margin or width is needed, add a utility class.
2. **No `style="..."` attributes** in component HTML or example pages.
3. **No *unscoped* element selectors in component files.** Bare `h1`/`a`/`p` belong in `elements.css`; element selectors *scoped under the root class* (`& li`, `& a`) are fine and used throughout.
4. **Components don't reference each other's classes.** A component is self-contained; composition happens in the markup. The one deliberate exception is `.icon`, a shared primitive that each host component (`.btn`, `.app-header`, `.sidebar-nav`, …) sizes to its own context.
5. **Utilities are last-resort and load last.** Prefer composing existing components.
6. **Accessibility is a quality bar.** AA contrast, visible focus rings, semantic HTML, no fake ARIA.

## Loading styles

Link to `index.css` to load the design system - the only stylesheet
consumers ship:

```html
<link rel="stylesheet" href="/voyager/assets/css/index.css">
```

It imports the component stylesheets and shared settings in layer
order. Each imported stylesheet remains a separate file and a separate
request - this is an entry point, not a compiled single-file bundle. If
request count ever matters, flatten the imports at build time.

## Docs-site chrome

The documentation site (Pelican) has its own chrome, kept entirely out of the
package so the shipped `voyager/static/` tree holds nothing but the design
system. `themes/voyager-docs/static/css/site.css` is the docs entry point
(header, sidebar, code-preview tabs) and `@import`s the per-page styles in
`themes/voyager-docs/static/css/pages/` (architecture diagrams, token swatches,
example-page layouts). Every doc/example page links both bundles - the shipped
system, then the docs chrome:

```html
<link rel="stylesheet" href="/theme/voyager/assets/css/index.css">
<link rel="stylesheet" href="/theme/css/site.css">
```
