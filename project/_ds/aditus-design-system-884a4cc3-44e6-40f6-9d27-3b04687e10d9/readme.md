# ADITUS Design System

ADITUS is an assessment-led training company in India (Mumbai · Bandra, Bengaluru · Indiranagar). One body, four systems — **Movement, Breath, Recovery, Performance** — trained together for *sustainable longevity*. The business has four surfaces, all on one website:
- **Training** — Personal Training (1:1) and Group Training (Fundamentals, Mobility Lab, Breath Session, Recovery: Heat & Cold), always starting with an **Assessment**.
- **Shop** — tools ADITUS uses (fascia balls, toe spacers, bands, compression, amber eyewear, sleep). Shopify-backed (prices in paise, ADITUS metafields).
- **Library** — Exercises, Insights (articles), Client Stories.
- **Community** — events (Run & Plunge, workshops, Open Practice).
Plus account/practice pages (assessment results → personal practice plan) and a "Find your starting point" qualifier quiz.

## Sources
All provided as uploaded Design Component files (no Figma, no repo):
`uploads/ADITUS {Home, About, Account, Assessment, Community, Group Training, Personal Training, Library, Product, Shop, Qualify, Platform Map, Landing, Landing v2–v4}.dc.html`, `AditusNav / AditusFooter / AditusMark.dc.html`, `aditus-shared.js` (content model + canvas art helpers), `catalog.json` (Shopify product schema). Copies of the data files live in `assets/data/`.
Note: `ADITUS Landing`, `v2`, `v3` use an earlier direction (Archivo + IBM Plex Mono, no Bowlby). The current system is Home / v4 and all inner pages: **Bowlby One + Space Mono + Archivo**.

## Index
- `styles.css` — entry point (imports only) → `tokens/{fonts,colors,typography,spacing,effects,base}.css`
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Effects, Brand)
- `components/` — React primitives (see below), one `@dsCard` per folder
- `ui_kits/website/` — click-through recreation of the full site: Home, Shop, Product, Qualify, Personal Training, Group Training, Assessment, Library (index / exercise / insight), Community, About, Account (success → analysis → ready → training plan), Platform Map
- `assets/` — `image-slot.js` (placeholder web component used in source), `data/` (catalog.json, aditus-shared.js)
- `SKILL.md` — agent-skill entry

## Components
- **brand/** AditusMark
- **core/** Button, Tag, Label, Pill, TextLink
- **forms/** VariantSelector, OptionRow, ProgressBar, EmailSignup
- **content/** SectionHeader, SpecList, StepList, ImageSlot
- **cards/** CategoryCard, ProductCard, PracticeCard, EventCard, PathCard
- **navigation/** SiteNav, SiteFooter, CategoryBar

The source defines three true components (AditusNav → SiteNav, AditusFooter → SiteFooter, AditusMark). The rest are patterns repeated verbatim across the pages and extracted here.
**Intentional additions:** `ImageSlot` — a static stand-in for the source's `<image-slot>` web component so React components render photo placeholders without the runtime.

## CONTENT FUNDAMENTALS
- **Voice:** plain, grounded, slightly dry coach. Anti-hype and anti-woo: "This isn’t meditation. It’s mechanics." · "It isn’t a cure for anything — it’s practice." · "FIELD NOTES — ONE EMAIL A MONTH. NO HYPE." · "Most were just trying not to swear."
- **Person:** *we* (ADITUS, the coaches) talking to *you*. "Tools we use… Nothing we don’t use ourselves." "Train with us." "Your right hip loses control halfway."
- **Sentences:** short, declarative, often fragments. Imperatives for instructions ("Find the point, then stop moving."). Benefit stated in concrete everyday terms — carry the bags, take the stairs, finish the trek — never aesthetic/weight-loss language.
- **Casing:** headlines and CTAs in ALL CAPS (Bowlby One), always ending with a full stop when they are statements: "BUILD A BODY THAT CAN DO MORE." "PEOPLE TRAIN HERE." Kickers/meta in uppercase mono ("LIBRARY · THIS WEEK"). Body copy sentence case.
- **Punctuation:** middot ` · ` separates meta; en dash ranges (6:30–21:00, 30–90 s); em dash for asides; ` →` ends every navigational link/CTA ("All tools →"); curly quotes/apostrophes.
- **Numbers & units:** ₹ with Indian grouping (₹64,000), "6 min", "3 × 6", "In 4 · out 8", dates "Sat 17 Oct · 06:00". British spelling (practise, programme, organise).
- **Vocabulary:** capability, practice, system, assessment, starting point, load, range, control, recovery, adaptation. "Longevity is the outcome, not a vertical."
- **Emoji:** never. Unicode used only as functional glyphs: → ← ✓ + − × ·.

## VISUAL FOUNDATIONS
- **Overall:** Swiss/brutalist athletic editorial. White page, near-black ink (#101828), one saturated blue (#006DE0) and a family of blues (navy #1F3777, sky #31B1EF, ice #BDEBFF, periwinkle #879DDA). **#006DE0 is the single primary blue.** Some older pages (Shop, Product, Qualify, Assessment, Community) used cobalt #3056B7 — it is kept as `--cobalt` for reference only; do not use it in new work.
- **Type:** Bowlby One (display, always uppercase, line-height .84–.92, massive fluid sizes up to 168px). Space Mono is the *page default* — body, nav, meta, tags. Archivo for lead paragraphs (17–23px, −.015em), product names, prices (500–600 weight) and option labels.
- **Layout:** max-width 1480px column with 1px #E6E8EC side rules. Content sits in **ruled grids**: cells share 2px ink borders (home) or 1px hairlines (shop, PDP), using negative margins to collapse doubles. 12-col hero, auto-fit grids with min(…) tracks. Gutter clamp(20px,4vw,64px); section top padding clamp(56px,7vw,112px). Sticky 60px nav; shop adds a sticky chip bar at top:60px.
- **Backgrounds:** solid full-bleed colour blocks per section — white, sky (events), navy (community), blue (final CTA), ink (footer, editorial bands), ice (callouts). No gradients in UI. Imagery is full-bleed photography in grid cells (currently captioned placeholders). Generative "fascia" canvas art (translucent tissue sheets, halftone) exists in `aditus-shared.js` for editorial placeholders.
- **Highlighted headline:** words set on white/blue rectangular blocks that overlap the hero imagery (padding 0 .06em).
- **Imagery vibe:** documentary, hard daylight, bare feet, concrete, sea at dawn; natural light product shots on white. Captions follow "PHOTO: SUBJECT — description".
- **Corners:** square, always (radius 0). Exceptions: system Pills (999px) and quiz radio marks (50%).
- **Borders:** 2px ink for structure and buttons; 1.5px ink for chips/tags; 1px #E6E8EC hairlines for lists; rgba(255,255,255,.14) on dark.
- **Shadows:** none, except the hard offset hover: `translate(-3px,-3px)` + `6px 6px 0 #006DE0` (or sky / ink). No blur shadows anywhere.
- **Cards:** not floating boxes — cells in a ruled grid: image on top, 2px rule, padded text (16px 18px 20px). Filled square label pinned 12px top-left of image.
- **Hover:** links → blue text; outline buttons → ice fill; blue buttons → navy; ink buttons → offset shadow lift; list cells → ice or mist (#EEF4FA); menu links nudge right 10px. Product image swaps to in-use shot (opacity .35s).
- **Press/selection:** selected = ink fill + white text (variants, chips) or ice ground + 4px blue inset bar (quiz). No shrink.
- **Motion:** short and editorial — .2s colour/transform, .25s hamburger morph, .35–.4s background swaps, .7s fades on content change, headline words rise in 700ms staggered 140ms with cubic-bezier(.2,.7,.1,1). Mark loops ease 1.1s. Respect prefers-reduced-motion.
- **Transparency/blur:** almost none; sticky bar uses rgba(255,255,255,.97); cart scrim rgba(16,24,40,.4).

## ICONOGRAPHY
- No icon font or SVG icon set in the source. Navigation and affordances use **typographic glyphs**: → (links/CTAs), ← (back), + / − (expand), × (close), ✓ (selected), · (separator), and a two-bar CSS hamburger.
- The only graphic is the **ADITUS mark** — four interlocking rounded heptagon loops (one per system), generated from geometry in `AditusMark`.
- **Missing assets:** source references `assets/aditus-wordmark.png`, `assets/aditus-mark-white.svg` and `assets/favicon.svg`, which were not uploaded. The wordmark is set in Bowlby One here; the white mark is rendered by `<AditusMark color="#FFFFFF">`.
- Emoji: never.

## Fonts
Google Fonts via CSS import (same as source): Bowlby One, Space Mono 400/700, Archivo variable (wdth 62–125, wght 100–900). No binaries were provided.
