# Handoff: Groove Vault — landing page & add-new flow

## Overview

Groove Vault is a vinyl collection manager. This handoff covers the **landing page** (collection identity + four collection actions, with "pick of the day" as a secondary area) and the **Add new** modal (scan-first flow for adding a record). Product intent: the app should feel like a listening ritual, not a database. The user should be able to get a record on the turntable with one click and near-zero typing.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. Recreate them in the target codebase's existing environment (React, Vue, SwiftUI, native, etc.) using its established patterns and libraries. If no environment exists yet, choose an appropriate framework and implement there.

Note on the HTML: these files use a small in-house component runtime (`<x-dc>`, `{{ }}` holes, `sc-if`). **Ignore the runtime.** Read the markup and inline styles for structure and visuals; everything visual is plain HTML + inline CSS.

## Fidelity

Two levels are included:

- **Hi-fi:** `Groove Vault.dc.html` — final colors, typography, spacing, motion. Recreate this closely.
- **Lo-fi:** `Groove Vault Wireframes.dc.html` — the approved wireframes (2a landing page, 3a add-new modal). Use for structure/intent only.

## Screens / Views

### 1. Landing page

**Purpose:** See the collection at a glance, jump to a collection action, or accept/re-roll today's pick.

**Layout:** Full-viewport art-deco background (see Assets). Content column `max-width: 1180px`, centered, page padding `clamp(16px, 2.4vw, 34px)`, vertical gap between blocks `clamp(16px, 2vw, 26px)`. Three stacked blocks:

1. Top bar (logo left, search + avatar right)
2. **Collection panel** (primary)
3. **Pick of the day panel** (secondary)

#### Top bar

- Logo mark: 32px circle, 1px `rgba(212,164,65,.75)` border, radial fill `#4a1316 → #230809`, 7px `#d4a441` dot centered.
- Wordmark "Groove Vault": Poiret One 19px, `letter-spacing: .34em`, uppercase, `#f0d18a`. Sub-line "Est. 1998 · Side A": Jost 300 8.5px, `.42em`, uppercase, `rgba(245,230,200,.42)`, 6px above-gap.
- Search field: `rgba(0,0,0,.35)` fill, 1px `rgba(212,164,65,.32)` border, no radius, padding `11px 17px`, min-width 238px. Leading 11px diamond (square rotated 45°, 1px gold border). Placeholder Jost 300 12.5px `.1em` `rgba(245,230,200,.5)`.
- Avatar: 38px square, 1px `rgba(212,164,65,.5)` border, Poiret One 14px `#f0d18a`.

#### Collection panel (primary)

- Container: `linear-gradient(170deg, rgba(38,10,11,.9), rgba(22,6,7,.94))`, 1px `rgba(212,164,65,.4)` border, padding `clamp(22px,3vw,44px)`, `backdrop-filter: blur(2px)`, shadow `0 34px 80px -34px rgba(0,0,0,.95)`. **Double-frame detail:** an absolutely positioned inset child at `inset: 7px` with 1px `rgba(212,164,65,.16)` border, `pointer-events:none`.
- Eyebrow: 26px × 1px gold rule + "THE COLLECTION" Jost 500 9.5px `.4em` uppercase `#d4a441`.
- **Collection name (h1):** Poiret One `clamp(40px, 6.6vw, 76px)`, line-height .94, `letter-spacing:.02em`, `#f5e6c8`, `text-shadow: 0 2px 24px rgba(212,164,65,.28)`. Dynamic — user-owned string.
- Tagline: Cormorant Garamond italic 15px/1.5 `rgba(245,230,200,.6)`.
- Stat block (right, wraps below on narrow): one bordered row `rgba(212,164,65,.32)` on `rgba(0,0,0,.28)`, three cells padded `15px 22px` split by 1px gold dividers. Value Poiret One 30px `#f0d18a`; label Jost 8.5px `.3em` uppercase `rgba(245,230,200,.5)`. Cells: 412 Records / 9 Crates / 1958 Oldest press.
- Divider: gold hairline fading at both ends with a centered 7px rotated-square diamond.
- **Four action cards:** `grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:14px`. Each card is arch-topped: `border-radius: 70px 70px 0 0`, 1px `rgba(212,164,65,.34)`, `linear-gradient(178deg, rgba(212,164,65,.07), transparent 70%)`, padding `22px 20px 20px`, centered column, 20px gap, deco line icon on top.
  - Hover (all four): background to `rgba(212,164,65,.18)` stop, border `rgba(212,164,65,.7)`, `translateY(-3px)`, transitions .22s ease.
  - Card title Poiret One 23px `.06em` `#f5e6c8`; caption Jost 8.5px `.28em` uppercase `rgba(245,230,200,.45)`.
  - **Browse** — "All 412 sleeves", icon = 5 vertical gold bars in a chevron height pattern (16/24/28/24/16px, 2px wide).
  - **Reorganize** — "Crates & order", icon = 28px arch (border-radius 50% 50% 0 0) with three vertical rules inside.
  - **Add new** (emphasized) — "Scan a sleeve". Border solid `#d4a441`, fill `linear-gradient(178deg, rgba(212,164,65,.26), rgba(212,164,65,.05) 75%)`, glow `0 0 34px -14px rgba(212,164,65,.6)`; title `#fdf0d4`, caption `rgba(240,209,138,.8)`. Icon = gold plus with a rotated 45° inner square. Hover lifts 4px. **Click opens the Add new modal.**
  - **Stats** — "Genres & decades", icon = 28px conic-gradient pie in three gold tints.
- **"On the shelf" strip:** label row (Jost 500 9px `.38em` uppercase `rgba(245,230,200,.55)`) with "See all →" in `#d4a441`. Then a horizontal row of 88px squares, gap 10px, 1px `rgba(212,164,65,.3)` border, fill `linear-gradient(150deg,#3d1013,#1d0708)`, each containing a 34px circle with 1px gold border and `box-shadow: 0 0 0 5px rgba(212,164,65,.08)`. Final tile is dashed with "+ 403 MORE". Strip sits on a 1px gold bottom rule. In production this is a horizontally scrollable list of real sleeve art; sleeve art replaces the placeholder circles.

#### Pick of the day panel (secondary)

- Container: `linear-gradient(168deg, rgba(45,12,13,.92), rgba(18,5,6,.96))`, 1px `rgba(212,164,65,.4)`, padding `clamp(20px,2.6vw,34px)`, same `inset:7px` inner frame. Layout `grid-template-columns: repeat(auto-fit, minmax(min(100%,290px),1fr)); gap: clamp(20px,2.8vw,36px)` — left = the pick, right = the actions rail.
- **Record art:** `flex: 0 0 clamp(130px,15vw,180px)`, square, 1px gold border, radial `#54181a → #1c0607`. Inside: 62%-width vinyl disc — `repeating-radial-gradient(circle,#120404 0 2px,#241010 2px 4px)`, inner 30% gold label `linear-gradient(140deg,#e7c274,#b98a2c)`, **rotating 360° over 7s linear infinite**. Real sleeve art replaces the frame fill; keep the spinning disc peeking if feasible.
- Eyebrow: 5px gold diamond (pulsing opacity .45↔1 over 2.4s) + "PICK OF THE DAY" Jost 500 9px `.4em` `#d4a441`.
- Title: Poiret One `clamp(28px,4vw,44px)`, `#f5e6c8`.
- Meta line: Jost 13px `.12em` uppercase `rgba(245,230,200,.55)` — "Artist · 1973 · Blue Note · BST-84195".
- **"Why this one" note:** Cormorant Garamond italic 16px/1.6 `rgba(245,230,200,.68)`, 1px `rgba(212,164,65,.6)` left border, 14px left padding, `max-width: 42ch`. Generated copy: last-played recency, crate, runtime.
- Buttons (flex, 10px gap, wrap):
  - **Put it on** — fill `linear-gradient(160deg,#e7c274,#b98a2c)`, text `#25090a`, Jost 500 10px `.3em` uppercase, padding `15px 28px`, no radius. Hover: brightness 1.1 + `translateY(-2px)`.
  - **Re-roll** and **Plan the evening** — 1px `rgba(212,164,65,.5)` outline, text `#f0d18a`, padding `15px 22px`. Hover fill `rgba(212,164,65,.14)`.
- **Actions rail (right):**
  - **Surprise me** — inverted arch: `border-radius: 0 0 90px 90px`, 1px `rgba(212,164,65,.55)`, fill `linear-gradient(160deg, rgba(212,164,65,.2), rgba(212,164,65,.03))`, glow `0 0 40px -18px rgba(212,164,65,.6)`, padding `22px 24px`. Label Poiret One 26px `.14em` uppercase `#fdf0d4`; sub "One record, no thinking" Jost 11.5px `.24em` uppercase. Right: 46px ring (1px `rgba(240,209,138,.8)`, `box-shadow 0 0 0 5px rgba(212,164,65,.08)`) with a 9px gold dot. Hover: stronger fill, `translateY(-3px)`.
  - **Mood field** — 1px `rgba(212,164,65,.28)` on `rgba(0,0,0,.3)`, padding `17px 19px`. Label "OR SET THE MOOD" Jost 500 8.5px `.36em` `#d4a441`. Input text Cormorant Garamond italic 17px; placeholder `"rainy sunday, no vocals"`. Free text → LLM/semantic match against the collection.
  - **Evening meter** — 7 bars, 3px gap, 16px tall; first four gold (`#d4a441`/`#f0d18a`) at 55/100/42/78% height, remaining three `rgba(212,164,65,.3)` at 28/20/34%. Caption "EVENING · 3 SIDES" Jost 8.5px `.3em`. Reflects queue length; clicking opens the plan-the-evening flow (not yet designed).

### 2. Add new modal

**Purpose:** Add a record with the camera; typing is the fallback.

- **Overlay:** `rgba(14,3,4,.86)` + `backdrop-filter: blur(5px)`, centered, 24px padding. Click overlay to dismiss; click inside must `stopPropagation`.
- **Dialog:** `width: min(470px, 100%)`, `linear-gradient(172deg,#3a0f11,#1a0506)`, 1px `rgba(212,164,65,.55)`, padding 28px, same `inset:7px` inner frame, shadow `0 50px 100px -34px rgba(0,0,0,.95)`, 19px gaps.
- Header: "RECORD 413" Jost 500 8.5px `.38em` `#d4a441`; title "Add to the vault" Poiret One 31px `#f5e6c8`. Close = 32px square, 1px `rgba(212,164,65,.5)`, "×" Jost 300 16px.
- **Scanner well:** 1px `rgba(212,164,65,.3)` on `radial-gradient(90% 80% at 50% 0%, rgba(212,164,65,.12), transparent 70%) #160405`, padding `32px 20px`, overflow hidden. Contains:
  - 96px ring, 1px `rgba(212,164,65,.5)`, `box-shadow: 0 0 0 8px rgba(212,164,65,.05), 0 0 0 9px rgba(212,164,65,.2)`; inside a 58px vinyl disc (same repeating-radial gradient) rotating 9s linear infinite with a 16px gold label.
  - **Scan line:** full-width 1px `linear-gradient(90deg,transparent,#f0d18a,transparent)` at `top:50%`, animating `translateY(-46px) → 46px → -46px` over 3.6s ease-in-out infinite.
  - Copy: "Hold the barcode up" Poiret One 25px; "Or snap the front cover — we'll match the pressing" Cormorant italic 15px `rgba(245,230,200,.6)`. In production this well is the live camera feed with the ring as the target reticle.
- "OR" divider: two gold hairlines fading outward, label Jost 500 8.5px `.34em`.
- **Manual lookup:** 1px `rgba(212,164,65,.35)` on `rgba(0,0,0,.32)`, padding `14px 18px`; placeholder "Artist, title, or catalog no." Jost 300 13px; right action "LOOK UP" Jost 500 9px `.28em` `#d4a441`.
- **Footer:** "Adding a whole stack?" Cormorant italic 15px + "KEEP SCANNING →" `#d4a441`, above a 1px `rgba(212,164,65,.18)` top rule. Keep-scanning = batch mode: stay in the camera, append each match to a session list, file everything into Unsorted by default.

## Interactions & Behavior

- **Add new card → modal open.** Modal is the only stateful piece in the prototype (`addOpen` boolean). Close on × , on overlay click, and (production) on Escape.
- **Re-roll / Surprise me** → fetch a new pick and swap the pick panel content. Prototype is a no-op; production should animate the swap (crossfade ≤ 250ms) and never repeat the previous pick.
- **Put it on** → marks the record as playing, stamps last-played.
- **Plan the evening** → opens a queue modal (designed only as a wireframe in an earlier round; not in this bundle).
- **Mood field** → submit on Enter, returns a single record with a "why this" rationale.
- **Hover states:** every card and button lifts 2–5px with a background/border shift; transitions .16–.22s ease.
- **Ambient motion:** spinning vinyl (7s / 9s), pulsing eyebrow diamond (2.4s), scan line (3.6s). All should respect `prefers-reduced-motion`.
- **Responsive:** action cards `auto-fit minmax(180px,1fr)`; both panels' inner grids `auto-fit minmax(min(100%,290px),1fr)` so the pick and its rail stack on narrow widths. Stat block wraps under the collection name. Type scales via `clamp()`. No fixed widths anywhere except the modal cap.

## State Management

- `collectionName: string` — user-owned, drives the h1.
- `stats: { records, crates, oldestPress, daysSinceLastSpin }`
- `shelf: Record[]` — recent/at-hand sleeves for the strip.
- `pick: { id, title, artist, year, label, catalogNo, why }` — today's pick; re-roll replaces.
- `moodQuery: string` — mood/vibe input.
- `queue: Record[]` — drives the evening meter.
- `addOpen: boolean` — modal visibility. Batch mode adds `sessionAdds: Record[]`.
- Data fetching: collection + stats on load; pick endpoint (accepts optional mood query, excludes recent picks); barcode/cover match endpoint for the scanner.

## Design Tokens

**Colors**

| Token            | Hex                     | Use                             |
| ---------------- | ----------------------- | ------------------------------- |
| Pine deep        | `#0f1c14`               | background base                 |
| Pine mid         | `#1d3123`               | panel base, modal               |
| Pine lit         | `#35573f`               | background top glow             |
| Panel ink        | `rgba(13,24,17,.94)`    | panel fill bottom stop          |
| Gold             | `#d4a441`               | primary accent, borders, labels |
| Gold light       | `#f0d18a`               | highlights, link/hover          |
| Gold deep        | `#b98a2c`               | button gradient end             |
| Gold pale        | `#e7c274`               | button gradient start           |
| Cream            | `#f5e6c8`               | primary text                    |
| Cream bright     | `#fdf0d4`               | emphasized text on gold         |
| Border gold      | `rgba(212,164,65,.4)`   | panel border                    |
| Border gold soft | `rgba(212,164,65,.16)`  | inner frame                     |
| Text muted       | `rgba(245,230,200,.55)` | meta text                       |
| Text faint       | `rgba(245,230,200,.28)` | footer                          |

**Typography** — Poiret One (400) display/titles; Jost (300/400/500) labels, meta, UI; Cormorant Garamond italic (400) descriptive/quoted copy.
Google Fonts: `https://fonts.googleapis.com/css2?family=Poiret+One&family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap`

| Role               | Font                      | Size                       | Tracking |
| ------------------ | ------------------------- | -------------------------- | -------- |
| Collection name    | Poiret One                | clamp(40px,6.6vw,76px)/.94 | .02em    |
| Panel title (pick) | Poiret One                | clamp(28px,4vw,44px)/1     | .02em    |
| Modal title        | Poiret One                | 31px                       | .04em    |
| Card title         | Poiret One                | 23px                       | .06em    |
| Stat value         | Poiret One                | 30px                       | —        |
| Button label       | Jost 500                  | 10px uppercase             | .3em     |
| Eyebrow label      | Jost 500                  | 8.5–9.5px uppercase        | .3–.4em  |
| Meta line          | Jost 400                  | 13px uppercase             | .12em    |
| Body/placeholder   | Jost 300                  | 12.5–13px                  | .1em     |
| Descriptive copy   | Cormorant Garamond italic | 15–17px/1.5–1.6            | —        |

Tracking is the signature: gold labels are always tiny, uppercase, and widely letterspaced. Poiret One is thin — never use it below ~20px.

**Spacing** — page `clamp(16px,2.4vw,34px)`; panel padding `clamp(20px,3vw,44px)`; block gap `clamp(16px,2vw,26px)`; intra-panel gap `clamp(20px,2.6vw,32px)`; card gap 14px; button gap 10px; inner frame offset 7px.

**Radius** — 0 everywhere except: arch cards `70px 70px 0 0`, inverted arch `0 0 90px 90px`, circles 50%.

**Shadows** — panel `0 34px 80px -34px rgba(0,0,0,.95)`; modal `0 50px 100px -34px rgba(0,0,0,.95)`; record art `0 20px 40px -18px rgba(0,0,0,.95)`; gold glow `0 0 34px -14px rgba(212,164,65,.6)`; ring halo `0 0 0 5px rgba(212,164,65,.08)`.

## Assets

**Background — replace with the user's own image.** The prototype draws the art-deco background in pure CSS (a stack of absolutely positioned layers: radial oxblood wash, fluted vertical hairlines, conic-gradient sunburst fan, concentric gold rings, dotted field, and a vignette). **The user has their own art-deco background image and wants to use it instead.** Replace the whole layer stack with:

```css
.page {
  min-height: 100vh;
  background:
    url("/assets/deco-bg.jpg") center / cover no-repeat fixed,
    #230809;
}
.page::after {
  /* keep the vignette so panels stay readable */
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    120% 90% at 50% 45%,
    transparent 30%,
    rgba(20, 5, 6, 0.8) 100%
  );
}
```

Keep the vignette and the panels' `backdrop-filter: blur(2px)` — both exist so gold text stays legible over a busy pattern. If the image is lighter or busier than the CSS version, deepen the panel fills toward `rgba(18,5,6,.96)` rather than lightening the type. **Palette note:** the original handoff was oxblood-based (`#230809` family); the final wallpaper (`public/background.png`) is deep pine green, so all oxblood fills were shifted to the pine equivalents above — golds and creams are unchanged.

Sleeve art, the record label, and avatars are placeholders — wire to real cover images from the collection data.

No icon library: every icon (bars, arch, plus, pie, diamond) is a few divs with borders/gradients. Reproduce as inline SVG in production.

## Files

- `Groove Vault.dc.html` — hi-fi landing page + add-new modal. **Primary reference.**
- `Groove Vault Wireframes.dc.html` — approved lo-fi wireframes (2a landing page, 3a add-new modal).
