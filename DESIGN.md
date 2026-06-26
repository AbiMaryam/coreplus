---
name: e-Faktur Multi-Period & Bulk Crediting Toolkit
description: Browser extension that enhances the Coretax e-Faktur portal with multi-period filtering, bulk credit operations, and batch PDF downloads
colors:
  brand-navy: "#212C5F"
  brand-navy-deep: "#161D3F"
  brand-navy-soft: "#1C254F"
  brand-gold: "#FFC91B"
  brand-gold-light: "#FFD241"
  neutral-bg: "#FAFAFA"
  neutral-surface: "#FFFFFF"
  neutral-body: "#5F6265"
  neutral-muted: "#6B7294"
  neutral-line: "rgba(33, 44, 95, .08)"
  extension-amber: "#FFD54A"
  extension-navy: "#121E53"
  extension-text: "#212529"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.8vw, 48px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(13.5px, 1.1vw, 16px)"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.011em"
  label:
    fontFamily: "Plus Jakarta Sans, ui-monospace, monospace"
    fontSize: "10.5px"
    fontWeight: 700
    letterSpacing: "0.16em"
    textTransform: uppercase
rounded:
  sm: "4px"
  md: "10px"
  lg: "15px"
  pill: "100px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "24px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    fontWeight: 700
  button-primary-hover:
    backgroundColor: "{colors.brand-navy-deep}"
  button-accent:
    backgroundColor: "{colors.brand-gold}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.sm}"
    padding: "6px 18px"
    fontWeight: 700
  button-accent-hover:
    backgroundColor: "{colors.brand-gold-light}"
  card-container:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    boxShadow: "0 15px 30px rgba(33, 44, 95, .08)"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    borderColor: "{colors.neutral-line}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  badge-pill:
    backgroundColor: "{colors.brand-navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: e-Faktur Multi-Period & Bulk Crediting Toolkit

## 1. Overview

**Creative North Star: "The Precision Console"**

The design system is purpose-built for tax professionals who process high volumes of e-Faktur invoices. Every pixel serves a function: this is a control panel, not a marketing page. The visual language draws directly from the Coretax portal it extends, ensuring injected toolbar elements feel native and trusted.

The system explicitly rejects decorative fluff, consumer-grade playfulness, and anything that undermines the user's confidence in the accuracy of financial data. No bright gradients, no rounded everything, no cartoon icons.

**Key Characteristics:**
- **Invisible extension:** the toolkit should feel like Coretax itself added these features
- **Utility-first:** batch operations are the hero; the UI gets out of the way
- **Professional restraint:** muted neutrals, deliberate use of accent color
- **Glass-informed:** the host portal uses glassmorphism (backdrop-filter, translucent surfaces); the extension respects that

## 2. Colors

The palette is anchored by the Coretax institutional navy and a warm gold accent. The extension layer uses a slightly warmer amber to visually distinguish injected controls from native ones.

### Primary
- **Navy Anchor** (#212C5F): Primary brand color. Used for top navigation bars, sidebar, primary buttons, and the portal's identity. Communicates trust, authority, and institutional stability.

### Accent
- **Gold Signal** (#FFC91B): Primary accent. Used for active states, hover highlights, decorative edges, and confirmation actions. Its rarity preserves its signal value.

### Extension Layer
- **Extension Amber** (#FFD54A): Used for the injected toolkit buttons and panels. Visually related to Gold Signal but warmer, creating a deliberate visual distinction between native Coretax controls and extension-injected ones.
- **Extension Navy** (#121E53): Used for the download button and key bulk-action controls. Slightly darker than Coretax navy for contrast against adjacent amber elements.

### Neutral
- **Surface White** (#FFFFFF): Card backgrounds, dropdowns, modals, input fields.
- **Background Tint** (#FAFAFA): Page background.
- **Body Text** (#5F6265): General prose, table data, ledes.
- **Muted Text** (#6B7294): Labels, secondary info, hints.
- **Line** (rgba(33, 44, 95, .08)): Borders, dividers, separators.

### Semantic
- **Sky Blue** (#39A9EA): Informational elements, links, help icons.
- **Status Red** (#EB5757): Errors, destructive actions, validation failures (inferred from Coretax patterns).
- **Status Green** (#28A745): Success states, completion confirmations.

### Named Rules
**The One Gold Rule.** Gold Signal appears on ≤10% of any given viewport. Its sparing use is what makes it read as a signal.

## 3. Typography

**Display & Body Font:** Plus Jakarta Sans (variable weight 200–800) with system-ui fallback.

**Character:** Clean, modern, and highly legible at small sizes. Plus Jakarta Sans has a large x-height and open apertures that make dense data tables and small UI labels readable. The variable font format allows precise weight control without loading multiple files.

### Hierarchy
- **Display** (800, clamp(28px, 3.8vw, 48px), 1.05): Page titles in the Coretax portal's deep navigation states.
- **Headline** (700, clamp(22px, 2.5vw, 32px), 1.1): Section headings, card titles.
- **Title** (700, 16px, 1.3): Component headers, panel titles.
- **Body** (500, clamp(13.5px, 1.1vw, 16px), 1.45): Table content, descriptions, prose. Max line length 65–75ch.
- **Label** (700, 10.5px, 1.0, 0.16em, uppercase): Badge text, meta labels, key-value field names.

### Extension Typography
The injected toolkit UI uses a slightly condensed scale:
- **Toolkit button labels:** 13px, bold
- **Toolkit panel headings:** 12px, bold
- **Toolkit status messages:** 13px, bold
- **Monospace inputs:** Courier New / Courier, 12px, bold (for FP number entry)

### Named Rules
**The Data Rule.** Table data and invoice numbers never use weights below 500. Legibility at a glance is more important than typographic elegance.

## 4. Elevation

The Coretax portal uses a **flat-with-glass** model: surfaces sit on the same depth plane, and hierarchy is expressed through translucent backdrops (`backdrop-filter: blur(22px) saturate(180%)`), subtle borders (`rgba(33, 44, 95, .08)`), and soft shadows rather than pronounced drop shadows.

Depth comes from:
- **Glass backdrops:** Translucent white overlays (`rgba(255, 255, 255, .62)`) with heavy blur separate panels from the page background without hard box-shadows.
- **Line borders:** 1px borders at 8%–14% navy opacity create surface boundaries.
- **Soft card shadow:** `0 15px 30px rgba(33, 44, 95, .08)` for cards and dropdowns.
- **Large shadow:** `0 25px 45px rgba(33, 44, 95, .12)` for modals and overlays.

The extension injects its UI as flat toolbar elements. These sit on the same depth plane as the native Coretax toolbar, using `z-index: 100050` only for dropdown panels that need to overlay the PrimeNG table.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat. Shadows and blur only appear to separate overlapping panels from underlying content.

## 5. Components

### Buttons

#### Native Coretax Buttons (host portal)
- **Shape:** 10px radius
- **Primary (Navy):** Background #212C5F, white text, 12px 24px padding
- **Hover:** Darken to #161D3F
- **Confirm Dialog Accept:** Full-width, 5px radius, #121E53 background

#### Extension Injected Buttons (toolkit controls)
- **Shape:** 4px radius (slightly sharper to distinguish from native)
- **Multi-Period / FP Filter:** Background #FFD54A (amber), 1px solid #e0b828, text #212529, 6px 18px padding, 56px height, bold 13px
- **Active state:** Box-shadow glow `0 0 6px rgba(255, 213, 74, 0.6)`
- **Bulk Run Button:** Background #FFD54A, no border, text #212529, 0 16px padding, 36px height
- **Bulk Download Button:** 56px × 56px square, background #121E53 (deep navy), white text, 22px font icon
- **Hover (download):** Background #1a296e

### Cards / Panels

- **Shape:** 15px radius
- **Background:** Surface white with optional glass treatment
- **Border:** 1px solid rgba(255, 255, 255, .7)
- **Shadow:** Glass shadow stack (`0 8px 28px rgba(33, 44, 95, .1), inset 0 1px 0 rgba(255, 255, 255, .85)`)
- **Internal padding:** 22–28px

### Navigation

- **Top Bar:** Glassmorphism backdrop, 76px height, sticky, 32px horizontal margin
- **Nav Items:** Inline-flex with icon + label, 40px icon buttons with amber hover
- **Active Indicator:** Gold underline (3px) for tab groups, gold left-border (5px) for sidebar items in deep mode
- **Breadcrumbs:** 13px, muted text, with arrow separators

### Data Table

- **Host system:** PrimeNG `p-datatable` with PrimeNG theming
- **Header actions:** Row with credit/uncredit buttons, monitoring and bulk process menus
- **Row selection:** Checkbox-based multi-select
- **Pagination:** Bottom paginator with page size selector

### Extension Dropdown Panels

- **Shape:** 6px radius
- **Border:** 2px solid #FFD54A (amber)
- **Shadow:** `0 6px 18px rgba(0, 0, 0, .12)`
- **Background:** White
- **Width:** 260px (multi-period), 280px (FP filter)
- **Grid layout:** 2-column checkbox grid for period selection

### Status Indicators

- **Loading:** Blue text (#004085)
- **Success:** Green text (#28a745)
- **Badge/Count:** Pill shape, navy background, white text, shown on active filter buttons
- **Progress:** "Proses: current/total (X Sukses, Y Gagal)" text pattern

### Inputs

- **Bulk target year:** 65px wide, amber border, centered bold text
- **FP textarea:** Full-width, 150px height, monospace font, amber focus ring
- **Select dropdowns:** 36px height, amber border

## 6. Do's and Don'ts

### Do:
- **Do** match Coretax's existing visual language so the extension feels native.
- **Do** use amber (#FFD54A) for injected controls to visually distinguish them from native portal elements.
- **Do** show clear progress counters for all batch operations (credit changes, PDF downloads).
- **Do** confirm destructive operations (credit status changes) before executing.
- **Do** use monospace fonts for FP (tax invoice) number inputs.
- **Do** keep toolbar buttons at 56px height to align with the Coretax action header bar.

### Don't:
- **Don't** use loud, playful, or consumer-grade design patterns (bright gradients, rounded everything, cartoon icons).
- **Don't** use dark mode with purple gradients, neon accents, or glassmorphism that distracts from data.
- **Don't** create nested cards — cards are the lazy answer and nested cards are always wrong.
- **Don't** use border-left greater than 3px as a colored stripe (stick to Coretax's 5px sidebar indicator max).
- **Don't** gate content visibility on class-triggered CSS transitions; headless renderers may never fire them.
- **Don't** use arbitrary z-index values like 9999 — use the semantic scale (dropdown → sticky → modal-backdrop → modal → toast → tooltip).
