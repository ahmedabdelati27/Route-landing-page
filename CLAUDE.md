# Route landing page

Static HTML site (`index.html`, `courses.html`, `course.html`, `leadership.html`, `privacy.html`, `terms.html`).

## UI work

Before writing or changing any UI (HTML/CSS, colors, typography, spacing, dark mode, mobile layout), read `design-system/DESIGN_SYSTEM.md` and use the tokens in `design-system/tokens.css`.

- Never hardcode hex colors, shadows or font sizes — use `var(--color-…)` / `var(--text-…)` tokens.
- Every new screen must work in both light and dark (`<html data-theme="dark">`) and at 393px wide.
- When touching existing code that uses the old variables (`--ink`, `--body`, `--line`, `--primary` …), migrate them using the table in section 6 of `DESIGN_SYSTEM.md`.
