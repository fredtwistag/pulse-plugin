# Design system

The product UI is built on Tailwind v4. All tokens live in CSS `@theme` blocks rather than a JS config, so the dashboard auto-extracts them below.

## Token philosophy

- **Brand vs semantic.** `--color-brand-*` tokens are the canonical brand palette. Semantic tokens (`--color-fg`, `--color-bg`, `--color-accent`, `--color-canvas-subtle`) are what UI code uses. Components reach for semantic tokens 95% of the time; brand tokens are reserved for the literal logo / marketing surfaces.
- **Light + dark in one stylesheet.** Each token has a `@media (prefers-color-scheme: dark)` override at the same `@theme` definition site. No second theme file.
- **No hardcoded hex outside the token layer.** `/pulse-guard`'s convention-drift check is configured to flag raw hex colors in component files.

## Spacing & type

- Type scale is a small modular scale anchored at `1rem` body. Use the Tailwind utility classes; don't introduce ad-hoc font sizes.
- Spacing uses Tailwind's default scale (4px base). New scale entries require a token in `@theme` — not an inline arbitrary value.

## When to add a token

A token is forever. Add one when:

- The value appears in three or more components.
- The value is part of the brand identity (color, type, radius).
- The value needs to vary between light/dark.

Don't add a token for single-use values — use an arbitrary class.
