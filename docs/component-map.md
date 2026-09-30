# Component map — 0.1.0-alpha.5

KPI Kit is narrower than a full application UI framework. This is the reusable surface actually exported from `src/kit/`.

## KPI

`MetricCard` uses one validated `MetricView` contract with six patterns:

- `number` — one current value;
- `comparison` — comparable current/previous scopes;
- `sparkline` — compact time context;
- `target` — an explicit at-least/at-most threshold;
- `status` — value plus coverage/freshness;
- `compact` — secondary KPI in a dense region.

Patterns change hierarchy, not KPI meaning.

## Charts

- `SeriesChart` — line or area; null breaks the path.
- `BarChart` — horizontal signed category comparison.
- `VerticalBarChart` — bounded categorical comparison.
- `GroupedBarChart` — multiple series within categories.
- `StackedBarChart` — additive nonnegative series; negative segments are rejected.
- `WaterfallChart` — starting value plus signed movements; missing movement withholds the ending total.
- `DonutChart` — complete nonnegative parts of one whole, up to eight.
- `BulletChart` — one actual-versus-target comparison.

Every complex chart in the workbench keeps a textual/data alternative.

## Table

`DataTable<Row>` provides typed columns, search, stable sorting, pagination, optional row/page selection, indeterminate page selection, filtered CSV, selected-row CSV, and a no-results state.

It is not a spreadsheet editor, server query engine, or million-row virtualized grid.

## Controls and states

Exports include Button, Badge, Field, Checkbox, Switch, FilterChip, Tabs, Tooltip, DateRangeField, StatePanel, and Dialog.

## Data utilities

Core exports include contract validation, metric comparison/formatting, chart-domain helpers, multi-series validation, waterfall reconciliation, table query/CSV helpers, ratio-of-sums, and a latest-result async loader.

## Examples

- `/index.html` — full public workbench.
- `/kit.html` — direct component-workbench entry.
- `public/examples/metrics.json` — synthetic startup KPI dataset.
- `examples/metric-view.json` — one minimal metric.
- `examples/load-metrics.ts` — asynchronous adapter example.
