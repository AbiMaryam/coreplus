# Product

## Register

product

## Users

- **Tax professionals & consultants** — Indonesian tax practitioners, accountants, and consultants who manage large volumes of e-Faktur invoices across many tax periods. Their primary goal is to save time by bypassing Coretax's built-in 2-period filter limit and performing bulk operations.

- **Internal corporate finance teams** — Company accounting/finance staff who need to manage their own tax documents efficiently, running batch credit status changes and bulk PDF downloads without repetitive manual work.

## Product Purpose

The e-Faktur Multi-Period & Bulk Crediting Toolkit extends the Coretax portal (`coretaxdjp.pajak.go.id`) by removing artificial limits and adding batch workflows. It exists because the official portal restricts tax period filtering to 2 periods at a time, forcing repetitive work for anyone managing invoices across many months.

Success looks like: a tax professional can select any number of periods, filter invoices across all of them, bulk-change credit statuses, and batch-download PDFs — all from the familiar Coretax interface — without switching tabs or repeating the same clicks.

## Brand Personality

**Professional, Efficient, Reliable.** The extension should feel invisible — it's a power-up, not a separate product. No fluff, no distractions. The UX should communicate competence: every button, label, and transition should feel purposeful and precise.

## Anti-references

- Avoid loud, playful, or consumer-grade design patterns (bright gradients, rounded everything, cartoon icons).
- Avoid anything that looks like it might break the Coretax portal — the UX must inspire trust that it works correctly with official data.

## Design Principles

1. **Blend in, level up.** The extension lives inside the Coretax portal. It should match the portal's existing visual language so users feel it belongs there, while improving capability.

2. **Batch is the point.** Every feature exists to reduce repetitive work. Default to bulk operations; never ask the user to do something one at a time.

3. **Progress, not mystery.** Long-running batch operations (credit changes, PDF downloads) must show clear progress, success counts, and failure details. Never leave the user wondering what happened.

4. **Forgiving by design.** Destructive operations (changing credit status) need confirmation. The UI should protect users from costly mistakes without slowing down confident users.

5. **Performance is a feature.** Parallel requests, cache-first data, and snappy UI feedback make the tool feel fast even when processing hundreds of invoices.

## Accessibility & Inclusion

- Follow Coretax portal's existing contrast and readability conventions.
- Status messages must be visibly distinct (loading, success, error) without relying solely on color.
- All controls should be keyboard-accessible and screen-reader friendly.
