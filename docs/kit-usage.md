# Using KPI Kit

KPI Kit exposes reusable React/TypeScript pieces from `src/kit/`. The commerce page is an example, not a required data model.

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
