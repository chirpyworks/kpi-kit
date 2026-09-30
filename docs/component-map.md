# Component map — 0.1.0-alpha.5

KPI Kit covers the common assembly needs of a dashboard source app. It is not an authentication service, backend, router, spreadsheet engine or exhaustive application framework. Components are exported from `src/kit/index.ts`; import `src/kit/styles.css` for their scoped tokens and styles.

## Workbench inventory

The workbench keeps three composed dashboard templates separate from 38 selectable component patterns/examples. One selected scenario is shown at a time, with an Options / Data / Code inspector. English/Korean and light/dark presentation use the same components.

| Group | Selectable coverage | Reusable surface |
| --- | --- | --- |
| KPI | Number, comparison, sparkline, target, status, compact | `MetricCard` with validated `MetricView` |
| Charts | Line, area, horizontal/vertical/grouped/stacked bars, waterfall, donut, bullet | Eight chart renderers, nine presentations |
| Table | Search, stable sort, row/page selection, filtered/selected CSV, pagination, no results | `DataTable<Row>` |
| Navigation & layout | Dashboard shell, breadcrumbs, tabs, detail panel, pagination | `DashboardShell`, `PageHeader`, `SideNavigation`, `Breadcrumbs`, `Tabs`, `DetailPanel`, `Pagination` |
| Forms & feedback | Validated form, search/select/chip filters, modal, confirmation, dismissible notification, tooltip | `InputField`, `SelectField`, `Dialog`, `ConfirmDialog`, `Notification`, `Tooltip`, existing controls |
| Data states | Loading, empty source, no matching results, load error, offline, stale snapshot, partial coverage | `AsyncState`, `Skeleton`, lightweight `StatePanel` |
| Error pages | Permission denied (403), not found (404), server error (500), maintenance | `ErrorPage` with explicit caller-supplied recovery actions |

## Scope and behavior

### KPI and charts

Metric patterns change presentation, not data meaning. Units, quality, scope, denominator and polarity remain explicit. A comparison baseline must cover the declared prior period. Each inline mini trend uses that KPI's independently calculated daily values.

`SeriesChart` supports line/area gaps, a shared-scale prior-period overlay, accessible source data, and optional point inspection. Signed bars share a zero baseline. Stacked negative values are rejected. Waterfalls withhold an ending total when a movement is missing. Donuts require complete nonnegative parts of one whole. Tiny nonzero values remain nonzero in chart descriptions and source tables.

### Table and filters

`DataTable<Row>` owns client-side querying, stable sorting, page/row selection and CSV formatting. It is not a server query engine or virtualized million-row grid. The separate filter example demonstrates controlled search, select and chips on a small local fixture. Date filters on templates govern all their metrics, trends, categories and detail rows.

### Navigation and layout

`DashboardShell` is embeddable and adds no second main landmark. `SideNavigation` is controlled local-view navigation; application routing belongs to the consumer. `Breadcrumbs` can receive real links or local callbacks. `DetailPanel` is non-modal; the caller owns focus restoration. `Pagination` derives bounded page state from item count and page size. Existing keyboard-operable `Tabs` are reused.

### Forms and feedback

`InputField` and `SelectField` associate labels, hints and validation errors. Consumers own validation rules; the example rule form deliberately uses local, synthetic values. `ConfirmDialog` composes the existing native `Dialog` and separates cancel from confirmation. `Notification` supports explicit dismissal and semantic tones. No subscriptions, messages, remote writes or persistent settings are created by the demos.

### Data and page states

Empty means the source has no records; no-results means records exist but filters exclude them. A failed request is neither of those. Stale/partial/offline states can retain clearly labelled evidence. A 403 retry does not create permission. A 404 does not imply access denial. A 500 does not invent an empty dataset. Maintenance does not invent a confirmed restoration time.

State recovery examples are deterministic local demonstrations: retry/completion, re-failure, reset, filter clearing or return to a sample view. They do not test actual connectivity, grant access or heal a server. The reusable components render caller-supplied actions; the host application owns real lifecycle and authorization behavior.

## Common foundation primitives

`Button`, `Badge`, `Field`, `Checkbox`, `Switch`, `FilterChip`, `Tabs`, `Tooltip`, `DateRangeField`, `StatePanel`, `Dialog` remain available. New components compose or complement these exports instead of replacing their public contracts.

## Data utilities

Core exports include validation, metric comparison/formatting, chart domains and intervals, multi-series validation, waterfall reconciliation, table query/CSV helpers, ratio-of-sums and a latest-result async loader.

## Explicit exclusions

- Account creation, sign-in, authorization enforcement, invitation flows, user administration
- Live databases, APIs, uploads to external storage, real-time transport, email/alert delivery
- Rich text editors, drag-and-drop builders, scheduling calendars, arbitrary data-schema inference
- Every chart type, every browser engine, production security certification or visual acceptance by code tests alone

These are integration responsibilities or future additions justified by a concrete task, not hidden services required to run the kit.
