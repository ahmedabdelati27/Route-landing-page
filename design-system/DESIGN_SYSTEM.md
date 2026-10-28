# Route Design System — Light & Dark

This is the reference for building or changing any UI on the Route website. The tokens live in [`tokens.css`](./tokens.css). That file is the code mirror of the Figma variables in **Route Landing Page (Copy)**, collection **Mapped** (modes: Light Mode / Dark Mode).

**Rule zero:** never write a hex color, a shadow, or a font size directly in a component. Always use a token (`var(--color-…)`). If no token fits, ask the designer and don't invent a color. Dark mode only works when every color comes from a token.

---

## 1. Setup

```html
<link rel="stylesheet" href="design-system/tokens.css">
```

Theme switching (the moon button in the header):

```js
const root = document.documentElement;
const saved = localStorage.getItem('theme');           // 'light' | 'dark' | null
if (saved) root.dataset.theme = saved;                 // no value → follows the OS
function toggleTheme() {
  const isDark = root.dataset.theme === 'dark' ||
    (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
}
```

Put the `saved` part in an inline `<script>` in `<head>`, before the CSS paints, so the page doesn't flash white in dark mode.

---

## 2. Which token goes where

### Backgrounds and elevation

Dark mode doesn't use shadows to separate layers. It uses **getting lighter step by step**. Each level up gets a lighter shade:

| Level | Light | Dark | Token |
|---|---|---|---|
| Page | `#ffffff` | `#000000` | `--color-surface-page` |
| Dashboard canvas (behind the cards) | `#f2f2f2` | `#000000` | `--color-surface-background` |
| Card / sidebar / panel / form | `#ffffff` | `#191919` | `--color-surface-card` |
| Element inside a card (chip, subtle fill) | `#f2f2f2` | `#191919` | `--color-surface-shade-1` |
| Raised element on a card (thumbnail, input, hover) | `#e5e5e5` | `#333333` | `--color-surface-shade-2` |
| Highest level (tooltip, selected) | `#cccccc` | `#4d4d4d` | `--color-surface-shade-3` |

**Common mistakes:**
- **A card on the page:** use `--color-surface-card`, **not** `--color-surface-page`. They look the same in light (both white), but in dark the card disappears into the page.
- **An element inside a card:** if it's `shade-1` it will be the same color as the card in dark (`#191919`). If it has to stand out from the card, use `shade-2`.
- **A section that sits on a grey background in light** (like the Contact panel and the dashboards): the background is `--color-surface-background` and the content is `--color-surface-card`. Don't do it the other way around.

### Text

| Use | Token |
|---|---|
| Headings, card titles | `--color-text-headings` |
| Paragraphs | `--color-text-body-1` |
| Captions, dates, meta | `--color-text-body-3` |
| Placeholder | `--color-text-body-4` |
| Links, highlighted word in a heading ("Brilliance") | `--color-text-action` |
| Text on a blue button | `--color-text-on-action` |
| Label above a section title ("Why Route?", "Testimonials" …) | `--color-text-eyebrow` |

### Buttons

| Type | Background | Text / icon | Border |
|---|---|---|---|
| Primary | `--color-surface-action` (hover: `-action-hover`) | `--color-text-on-action` | — |
| Outline (Login, Course Details) | transparent | `--color-text-action` | `--color-border-action` |
| White circle with an arrow inside the blue button | `--color-fixed-white` | `--color-surface-action` (**not** `icon-action`, which turns white in dark) | — |

### Icons

- Normal icons: `--color-icon-heading` / `--color-icon-default`.
- Brand icons, decorative patterns, logo letters: `--color-icon-action`. It's dark blue in light and light in dark.
- Footer social circles: background `--color-surface-action` and white icon.

### Borders

- Card borders and dividers: `--color-border-default`.
- Focus ring: `--color-border-focus`.

---

## 3. Dark mode rules learned from the design (important)

1. **Opacity is separate from color.** An overlay like "white at 20%" becomes `background: color-mix(in srgb, var(--color-surface-page) 20%, transparent)` or an `opacity` on a separate layer. Never use a solid color in place of a transparent overlay.
2. **Fades** (the bottom of the hero, the edges of the testimonials) use `--color-surface-page`, not white:
   ```css
   background: linear-gradient(to bottom, transparent, var(--color-surface-page));
   ```
3. **The big ROUTE letters** (hero watermark and footer) are a gradient from `--color-surface-page`, to `--color-surface-shade-1`, to `--color-surface-page`.
4. **Decorative patterns** (the 0/1s on card headers and the "14+" card) use `--color-icon-action` with the layer's original opacity (6–7%).
5. **Course card header:** `--color-surface-action-light`. It's light blue in light and `#1c2431` in dark.
6. **Things that stay the same in both modes** (do not bind them to theme tokens):
   - Partner logos and the Engineers Syndicate logo, which stay on a white plate.
   - Language icons (JS, React, Angular …) and the 3D images.
   - The ChatGPT / Claude / Gemini pills: always a white background (`--color-fixed-white`).
   - The blue "AI in every diploma" card and the brand cards: `--color-fixed-brand`.
   - Photos, and the white frames that are baked into the images.
7. **The "Noise & Texture" texture** must stay at **3% opacity**. At 100% it looks like TV static in dark.
8. **Graduate video carousel:** the side cards have a 20% overlay in the page color, so they recede behind the center card.

---

## 4. Typography

The font is **Urbanist**. Arabic text uses **IBM Plex Sans Arabic**.

| Role | Desktop | Mobile (393) |
|---|---|---|
| Hero title | 48 SemiBold (`--text-display-1`) | 34 |
| Section title | 40 Bold | **24** |
| Label above the title (eyebrow) | 20 SemiBold | **16** |
| Section description | 16 Regular | **12** |
| Card title | 20–24 SemiBold | 18–20 |
| Body | 16 / line-height 1.5 | 14–16 |

The section header roles switch on their own at the breakpoint via `--section-eyebrow-size`, `--section-title-size` and `--section-desc-size`.

---

## 5. Responsive rules (mobile 393)

The Figma mobile frames are named "… – Mobile 393" next to each desktop design.

- **Side padding** is 16px. Each section has 48px top and bottom (`--section-pad-x/y`).
- **Header:** logo, plus a theme button, plus a menu button. The nav links go inside the menu.
- **Card grids** (Why Route, Support, Learning Experience, events, albums) become one column at full width.
- **Rows of similar cards** become a horizontal row with `overflow-x: auto` and scroll-snap. This covers courses on the home page, related courses, graduates, testimonials, partner logos and album thumbnails. Course cards are about 320px wide on mobile.
- **Exception:** the courses listing page stacks the cards vertically at full width.
- **Mockups inside cards** (the mentor chat, the workshops calendar, recorded lectures): shrink the whole card proportionally (`transform: scale` or redraw it at a smaller size). Don't reflow what's inside.
- Buttons and chips **keep their natural width**. Don't stretch them to 100% unless the design says so (e.g. Enroll/Share in the price card).

---

## 6. Migrating the current site's variables

The current pages (`index.html`, `course.html` …) use old variables that have no dark mode. Replace them like this:

| Old variable | Value | New token |
|---|---|---|
| `--bg` | `#FFFFFF` | `--color-surface-page` (or `--color-surface-card` for a card) |
| `--alt` | `#F9FAFD` / `#E9F4FF` | `--color-surface-shade-1` / `--color-surface-action-light` |
| `--soft`, `--cyan-soft` | `#EEF3FF`, `#E6F4FB` | `--color-surface-action-light` |
| `--grid` | `#EEF1F6` | `--color-surface-shade-1` |
| `--dim` | `#DCE2EE` | `--color-surface-shade-2` |
| `--primary` | `#00298E` | `--color-surface-action` (background) / `--color-text-action` (text) / `--color-icon-action` (icon) |
| `--primary-deep` | `#001F6B` | `--color-surface-action-hover` |
| `--ink` | `#0E1320` | `--color-text-headings` |
| `--body`, `--muted` | `#4A5366`, `#5A6378` | `--color-text-body-1` |
| `--line`, `--line-2` | `#E4E7EE`, `#D5DAE4` | `--color-border-default` |
| `--alt-line` | `#D3E6FA` | `--color-border-action-light` |
| `--cyan`, `--pill` | `#1AA0DB`, `#0B78B8` | `--color-text-eyebrow` |
| `--sky`, `--cyan-ink` | decorative | leave as is (fixed in both modes) |

Hardcoded colors that showed up a lot in the design and how they map:
- `#161b26`, `#0b1020`, `#0e1320`, `#101323` → `--color-text-headings`
- `#5a6378`, `#5b6272`, `#626a80`, `#2a3142` → `--color-text-body-1`
- `#8a92a3`, `#7c8493`, `#8991a6` → `--color-text-body-3`
- `#f2f3f5`, `#f5f7fb`, `#f9f9f9` → `--color-surface-shade-1`
- `#e4e7ee`, `#d5def2`, `#e7eaf2` → `--color-border-default`

---

## 7. Known notes (from the designer)

- In dark, `Text/Body 2` (`#e5e5e5`) comes out lighter than `Body 1`, and `Body 3` is the same as `Body 1`. The ladder isn't final, so use only `body-1` and `body-3` for now.
- In dark, `Surface/Disabled` and `Surface/Warning-Light` and `Border/Disabled` are still the light-mode values, and haven't been adjusted yet.
- The eyebrow color `#00b2e4` on a white background has low contrast (~2.6:1). It may get a darker light-mode value later.

Any new color or a change to a dark value happens **in Figma first**, and then gets copied here.
