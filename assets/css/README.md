# Voyager CSS architecture

Voyager is Janeway's design system. It is inspired by two systems we admire —
GitHub Primer (chrome density, admin patterns) and the UK Government Design
System (accessibility discipline, form conventions) — but every component is
hand-written. Voyager has no runtime dependency on Primer or GDS; the lessons
are theirs, the code is ours. It is plain modern CSS — no preprocessor, no
Tailwind, no framework. Native CSS nesting and custom properties only.

## Layer order

```
settings  →  reset  →  elements  →  components  →  utilities
```

Each layer is a file or set of files. Utilities are imported **last** so they
win on specificity. `index.css` imports the layers in order.

| Layer | File | Contains |
| ----- | ---- | -------- |
| Settings | `settings.css` | Tokens — colour, type stacks, type scale, space scale, radii, layout. Two-tier: raw tokens (`--colour-blue-7`) plus semantic aliases (`--colour-link`). |
| Reset | `reset.css` | Box-sizing, margin/padding zeroing, list-style stripping where appropriate. |
| Elements | `elements.css` | Typography and link styles set on **element selectors only** (`body`, `h1`, `a`, `p`, …). No classes. |
| Components | `../../components/<name>.css` | One namespaced root class per component, all declarations nested under it with native `&`. No BEM. |
| Utilities | `utilities.css` | Single-purpose helper classes (`.muted`, `.mono`, `.visually-hidden`, `.stack`, `.cluster`). Win over component styles. |

## Component file pattern

- Each component lives in `components/<name>/` as **two co-located files**: `component.html` (or `.j2` macro snippet) and `component.css`.
- The CSS file opens with **one root class** matching the component name. Every other declaration nests under it via `&`.
- Variants are **extra flat classes composed in the markup** — not BEM modifiers. Example: `<a class="btn btn-primary btn-large">` not `<a class="btn btn--primary btn--large">`. The visual axes (kind, size, intent) compose via separate classes, so a `<button class="btn btn-primary">` can also be `<button class="btn btn-secondary btn-small">` without the modifier suffix proliferation.

## Tokens

Two-tier system on `:root` in `settings.css`:

1. **Raw tokens** — the underlying value: `--colour-grey-9: #1f2328;`
2. **Semantic aliases** — point at raw tokens by role: `--colour-fg: var(--colour-grey-9);`

Components reference **semantic** tokens. Pages and themes can override semantic aliases without touching raw tokens.

## Rules

1. **No inline styles.** Anywhere. If a one-off margin or width is needed, add a utility class.
2. **No `style="..."` attributes** in component HTML or example pages.
3. **Element selectors stay in `elements.css`.** Don't add element selectors to component files. Reach for a class.
4. **Components don't reference each other's classes.** A component is self-contained. Composition happens in the markup.
5. **Utilities are last-resort and load last.** Prefer composing existing components.
6. **Accessibility is a quality bar.** AA contrast, real focus rings, semantic HTML, no fake ARIA.

## Bundle

`index.css` is the single entry point. Pages link only to that file:

```html
<link rel="stylesheet" href="/voyager/assets/css/index.css">
```

It uses `@import` to pull in every layer file in order. Authoring stays split;
the browser fetches one stylesheet (effectively — `@import` cascades).
