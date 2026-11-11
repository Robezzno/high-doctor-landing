# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: general public and patients (and their families) looking for reliable, plain-language information about cannabis and cannabinoids — what helps, what doesn't, what the risks are. They arrive with a question, often after reading a headline or a claim, and want a clear answer they can trust. Secondary: professionals (researchers, clinicians) and organisations, who should feel welcome but are not the first audience. (Confirmed by Saf, 2026-11-11.)

## Product Purpose
High Doctor Foundation is an independent non-profit that translates cannabis research into clear guides with sources anyone can check. Success on the home page: a visitor understands in seconds what the foundation is, finds the answer to their question (evidence by topic, guides, news) and trusts it. Reading and consulting is the primary action; joining the network is the secondary one. (Confirmed by Saf.)

## Positioning
Evidence-first and source-visible: every claim is tied to a named source and an evidence level; no products, no prescriptions, no miracle promises. Friendly in tone (the High Doctor mascot), rigorous in content.

## Operating Context
Visitors come from search, social posts and the Mary Jane Berlin fair, mostly on phones. 8 languages (en, es, de, fr, it, pt, nl, pl); blog only in ES and EN. Contact/join form via Web3Forms. Hosted on GitHub Pages; every push to `main` publishes.

## Capabilities and Constraints
- "What the evidence says" explorer: 10 topics with a 5-level verdict (NASEM 2017 scale, EMA for epilepsy) and a source link (`src/data/evidence.ts`).
- Blog/news (ES/EN), RSS, social cards; join form; legal pages.
- Sections for team, partners, stats and events exist but stay hidden until Saf provides real data (`src/config/site.ts`).
- Undecided: legal entity data, real numbers, team, partners, Mary Jane Berlin date.

## Brand Commitments
- Name and wordmark "HIGH DOCTOR" (chrome navy wordmark), star green #00B63F and navy #000C3C from the logo.
- The mascot (a cartoon "mad doctor" with head mirror, `src/assets/brand/logo-character.png`) is the face of the brand and should be a protagonist on the home page — as a guide, never illustrating medical verdicts. (Confirmed by Saf.)

## Evidence on Hand
- Evidence explorer data with sources (NASEM 2017, EMA 2019).
- Three blog posts per language (ES/EN).
- Archival public-domain/CC images in `src/assets/photos/` (credited).
- No members count, no testimonials, no partners, no press: never fabricate them.

## Product Principles
1. Answer first: the visitor's question beats the foundation's self-description.
2. Every claim shows its source and its level of certainty.
3. Friendly face, serious data: the mascot guides; the data speaks plainly.
4. Size follows priority: what matters most to the visitor gets the most space.
5. Nothing invented: hidden beats fake.

## Accessibility & Inclusion
WCAG AA, readable without JS, reduced-motion respected, evidence levels never conveyed by colour alone. Mobile-first.
