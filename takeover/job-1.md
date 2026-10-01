# Project Takeover — Job 1 Record

Status: EXECUTING  
Project: KPI Kit  
Standard: v1.0  
Branch: `commercialization/project-takeover-demo`

## Job input

**Reconstruct the Revenue overview so the primary comparison is visibly dominant without changing the KPI/data contract or removing supported data states.**

No new product feature is requested.

## Applicable Standard

- S-01 — primary / secondary hierarchy
- S-02 — no feature-shaped fix
- S-03 — evidence before decoration
- S-04 — reject equal-weight KPI card wall
- S-05 — state completeness remains blocking

## Planned change

Convert the four visually independent KPI tiles into one continuous metric band:

- Net sales receives approximately golden-ratio emphasis relative to each supporting metric on desktop.
- Supporting metrics remain available but read as evidence, not competing destinations.
- Shared enclosure and separators replace four independent floating cards.
- Existing metric components, values, comparisons, sparklines and definitions remain intact.
- Mobile reconstructs the band so the primary metric spans the full width and supporting metrics follow at lower mass.

## Non-goals

- no metric calculation change;
- no new KPI;
- no chart-engine change;
- no new dashboard page;
- no removal of loading/error/partial states.

## Acceptance evidence required

- clean repository verification;
- rendered desktop and mobile screenshots;
- no horizontal page overflow;
- visual review that the first metric is materially dominant;
- data/state tests remain passing.

## Current status

Implementation pending in this record's initial revision.
