# Changelog

## 0.1.0-alpha.5

Public-source preparation candidate.

- Six KPI presentation patterns from one explicit metric contract.
- Nine chart presentations: line, area, horizontal/vertical/grouped/stacked bars, waterfall, donut, and bullet.
- Generic searchable, sortable, paginated, selectable table with filtered and selected-row CSV export.
- Analysis controls and loading/empty/error/partial/stale states.
- English/Korean component workbench, light/dark themes, and local KPI JSON import.
- Repository hygiene, core tests, production build, and browser-verification gates.
- Clean-install lockfile is generated and reviewed through the public-repository verification path before stable-release language is used.

## Unreleased — workbench upgrade

- Replace the landing-page flow with a compact library / preview / inspector workspace and mobile panel navigation
- Add revenue, customer and operations compositions backed by deterministic daily synthetic records
- Connect date scope to metric aggregation, chart series, category breakdowns and detail rows; expose incomplete comparisons
- Correct negative bar baselines and zero-delta waterfall geometry; add visible axes, units, distinct legends and accessible source values
- Generate executable per-chart and composed TSX examples rather than a fixed generic chart snippet
- Keep imported metrics individually selectable and separate from dashboard fixtures
- Add actual npm lockfile, data/SSR/example compilation regressions and expanded browser behavior tests
- Browser rendering on this revision remains an explicit pending verification gate

### Reference-led visual refinement

- Establish technical navy/light-blue surface hierarchy, precise blue borders and purposeful cyan/teal/amber/red accents
- Separate template and component modes; prioritize the dashboard canvas with an optional inspector
- Add accurate daily mini trends for each metric, prior-period comparison overlays, graduated areas and data-derived value callouts
- Recompose the representative screen around one dominant trend with channel/target context and a detail/outcome row
- Preserve all 65 functional regressions and add 12 presentation/data-contract checks
- Pixel and full-browser acceptance remain unverified

### Practical dashboard assembly coverage

- Add reusable shell/header/sidebar/breadcrumb/detail/pagination patterns without introducing a router or backend
- Add accessible validated inputs/selects, local search/filter composition, confirmation and dismissible feedback
- Add retained-evidence async states and explicit 403/404/500/maintenance page patterns
- Make 22 new scenarios individually selectable with localized live interaction and standalone source examples
- Test local retry success/re-failure, denial preservation, empty/no-results distinctions, validation, confirmation, dismissal and pagination
- Keep templates and existing metric/chart contracts unchanged; document integration responsibilities and exclusions

### Responsive preview safeguards
- Use single-panel compact navigation through 1100 CSS pixels while retaining desktop composition at 1280px and above.
- Bound phone-width metric specimens and use two-column pattern selection.
- Validate standalone viewport metadata and add mobile-context browser regression assertions (runtime verification pending).

### React composition craft
- Align primary charts and source evidence on one shared desktop grid; prioritize the domain question and leading metric.
- Add compact SeriesChart composition, header action slots and persistent pointer/touch/keyboard observation selection with missingness preserved.
- Add working Area/Line and comparison presentation controls to all three synthetic templates.
- Derive sparkline color from declared metric polarity; strengthen target-state surfaces and table typography.
- Add theme-specific on-accent contrast, bounded metric definitions and reduced-motion surface transitions.
