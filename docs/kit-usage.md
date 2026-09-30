# Using KPI Kit

KPI Kit exposes reusable React/TypeScript pieces from `src/kit/`. The composed dashboards are examples, not required business data models.

## Copy into a React application

1. Copy the complete `src/kit/` directory into your application's source directory (for example, `src/kit/`). Keep its directory structure intact.
2. Preserve this project's `LICENSE` alongside the copied source. Your application also needs React and React DOM; the demo is tested with 18.2.0.
3. Import components from `./kit/index.js` in a neighboring TSX module and load `./kit/styles.css` once in your entry point.
4. Wrap the integration in an element with `className="kk-root"` so scoped tokens/styles apply. Supply your own validated metric data.

The repository is a source-copy kit, not an npm package. You do not need `src/demo/`, the workbench, sample customer names, or any hosted backend to use the kit.

## MetricCard

Choose one of six presentation patterns: `number`, `comparison`, `sparkline`, `target`, `status`, or `compact`.

```tsx
import { MetricCard, validateMetricView } from '../src/kit/index.js';

const metric = validateMetricView(rawMetric);
<MetricCard metric={metric} pattern="comparison" />
```

Keep the metric definition, scope, unit, quality and comparison semantics explicit. Do not use a display pattern to change the meaning of the number.

## Charts

Available presentations are line, area, horizontal bar, vertical bar, grouped bar, stacked bar, waterfall, donut and bullet target comparison. Match the chart to the analytical question. Missing values remain missing.

## DataTable

`DataTable<Row>` is column-driven and supports search, stable sorting, pagination, optional row selection, current-page selection, filtered CSV and selected-row CSV.

## UI primitives

The kit includes analysis-oriented controls such as Button, Badge, Field, Checkbox, Switch, FilterChip, Tabs, Tooltip, DateRangeField, StatePanel and Dialog.

## Async data

`createLatestLoader` prevents a late request from replacing a newer result. The data adapter remains responsible for domain calculations and authorization.

See [component map](component-map.md) and [data contract](kit-contract.md).

## Composed dashboards and period scope

`src/demo/dashboard-data.ts` is an explicit, synthetic adapter example, kept outside the reusable kit. It exports `buildDashboard(kind, range, locale)` for `revenue`, `customers`, and `operations`. Each model supplies metrics, a daily trend, category totals and daily-category detail rows from the same filtered records.

- Fixture dates: 2026-08-18 through 2026-09-14, inclusive, UTC
- Current scope retains the requested start/end dates, even with partial coverage
- Comparison is the immediately preceding equal-length period; incomplete prior windows are withheld
- Revenue source amounts and MetricViews use USD cents; chart and table adapters convert to visible USD exactly once
- Activation/failure/refund rates use ratios of sums, with numerator and denominator preserved
- Mean processing time uses total duration divided by attempts, not an average of averages
- Closing accounts and queue metrics use the selected final-day snapshot, never summed daily snapshots
- Empty periods produce missing observations; invalid ranges produce a recovery state with no fabricated valid scope

Imported KPI JSON is scoped to the KPI component studio. Every imported metric can be selected. It does not relabel the synthetic dashboard, infer raw records, or fabricate a trend. Component samples remain fixed-scope and explicitly independent of dashboard date filters.

## Copyable examples

The inspector's Code tab returns complete TSX modules with imports, data and a default exported component. `chart-examples.ts` preserves the selected renderer and its units; `example-code.ts` includes three runnable dashboard integration modules, metric patterns, tables and state examples. Copied table records use column-adapted display values so raw cents cannot appear under USD labels. Tests compile the generated English and Korean examples against the real kit API.

Chart components preserve their existing props and add optional `description`, `xAxisLabel`, `yAxisLabel` and `showDataTable`. Source tables are collapsed by default. Structured `Unit` values still control formatting, independently of axis context labels.

## Technical dashboard composition

`DashboardPreview.tsx` composes the same public kit components into a domain-focused screen. The inline KPI plots come from `metricHistories`, which calculates each metric separately for every date and retains its native unit. A revenue mini trend is in cents; order counts, daily average order values and daily refund rates are not interchangeable.

`MetricCard` accepts optional `trendPlacement="inline"` while retaining the existing default below-card sparkline. Inline plots include their original values in the accessible image name.

`SeriesChart` additionally supports `comparisonPoints`, `seriesLabel`, `comparisonLabel`, `interactive` and `maxHeight`. Comparison periods share a scale, align by index, must have equal lengths, and keep both original date labels in the source table. The previous period is omitted when its coverage is incomplete. Keyboard/pointer inspection is opt-in; source and SSR tests do not substitute for browser interaction verification.

## Dashboard assembly studios

The component library adds four focused categories. Choose one example at a time; Code always follows the current selection.

- Navigation & layout: shell/header/sidebar, breadcrumbs, tabs, non-modal detail and standalone pagination
- Forms & feedback: field validation, native select, controlled search/filter chips, native modal, confirm/cancel, notifications and tooltip
- Data states: loading skeleton, empty source, no matching results, error/retry, offline, stale and partial evidence
- Error pages: 403, 404, 500 and planned maintenance

Each new studio exports a selectable live example and a self-contained React/TypeScript code module with the same bounded behavior. Generated snippets compile against the actual public kit exports in both locales. Controls and recovery use memory only; the Data inspector shows the example contract rather than claiming to inspect a real backend.

`StatePanel` remains a compact message primitive. Use `AsyncState` when a state needs retained evidence, metadata or multiple actions, and `ErrorPage` for a page-level failure. Supply real application callbacks when integrating. The examples' simulated retries must not be mistaken for network handling or authorization.

All supporting CSS is included through `src/kit/styles.css`; the new UI modules do not require extra runtime dependencies. See [component map](component-map.md) for coverage and deliberate exclusions.

## Compact chart composition

`SeriesChart` accepts `density="compact"` (default: `"comfortable"`) and an optional `headerActions` React node. Compact mode preserves the same data scale and units while placing current/prior observed values and their original dates outside the plot. A 560px plot minimum preserves axis legibility; only the plot scrolls on narrower hosts. Importing `kit/styles.css` includes its presentation styles.

With `interactive`, pointer hover previews an observation, click/tap retains it, Left/Right and Home/End move through points, Enter/Space retain the selection, and Escape or the reset control returns to the latest observation. Missing points remain selectable and explicitly missing. Parent actions such as Area/Line or comparison visibility should alter presentation, not underlying observations. See `DashboardPreview.tsx` for the controlled example. Real-browser focus/touch validation remains a separate gate.

KPI mini-trend color now follows `compareMetric` sentiment and declared polarity; unknown comparisons stay neutral. It does not imply target attainment. Metric definition text is constrained to its card heading width on narrow layouts. Surface motion respects `prefers-reduced-motion` and never animates data values, axes or scale geometry.
