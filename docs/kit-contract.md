# Precomputed metric contract — schemaVersion 1

This contract belongs to `src/kit/`. The commerce example uses a separate orders contract.

## MetricDataset

A dataset contains `schemaVersion: 1`, a name, an `isSample` flag, and 1–100 metrics. Each metric has a definition, current observation, optional previous observation, current scope, and optional previous scope.

Definitions include a stable ID, title, description, aggregation semantics, polarity, comparison mode, unit, and optional target. Money is represented in minor units with an explicit currency and exponent. Ratios are fractions: 0.25 means 25%.

## Data quality

Observations preserve coverage and freshness separately. Missing is not zero. Partial coverage is not presented as a complete total. Ratio observations may include numerator and denominator and must reconcile with the displayed value.

## Scope and comparisons

Scopes carry inclusive calendar dates, time zone, segments, and revision. Previous/current comparisons require compatible periods and segment definitions. A zero baseline never becomes an infinite percentage change.

## Charts

Chart data is explicit and separate from metric data. Ordered series preserve nulls as gaps. Grouped and stacked charts keep missing values visible. Stacked negative segments are rejected. Waterfalls do not invent a closing result when a movement is missing. Donuts are limited to complete nonnegative parts of one whole.

## Loading

`createLatestLoader` discards stale asynchronous results so a late request cannot overwrite a newer result.

## Limits

The explorer accepts local JSON up to 5 MiB and preserves the prior dataset when validation fails. These are defensive input limits, not a performance guarantee.

See [component map](component-map.md), [usage](kit-usage.md), and the example dataset at [public/examples/metrics.json](../public/examples/metrics.json).
