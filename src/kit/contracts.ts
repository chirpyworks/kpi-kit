/** Domain-neutral display contracts. Importing this file never reads browser state. */
export type KitLocale = 'en' | 'ko';
export type Quality = {
  coverage: 'complete' | 'partial' | 'missing';
  freshness: 'current' | 'stale' | 'unknown';
  reasons?: readonly string[];
};
export type Unit = {
  kind: 'count';
  label?: string;
} | {
  kind: 'money';
  currency: string;
  exponent: number;
} | {
  kind: 'ratio';
} | {
  kind: 'duration';
  base: 'ms';
} | {
  kind: 'number';
  label: string;
};
export interface Scope {
  id: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  segment: Readonly<Record<string, readonly string[]>>;
  revision: string;
}
export interface Observation {
  value: number | null;
  quality: Quality;
  numerator?: number;
  denominator?: number;
}
export interface MetricDefinition {
  id: string;
  title: string;
  description: string;
  unit: Unit;
  aggregate: 'sum' | 'distinct' | 'ratio' | 'last' | 'custom';
  polarity: 'higher-is-better' | 'lower-is-better' | 'neutral';
  comparison: 'absolute' | 'relative' | 'percentage-points' | 'none';
  target?: {
    value: number;
    relation: 'at-least' | 'at-most';
  };
}
export interface MetricView {
  definition: MetricDefinition;
  current: Observation;
  previous?: Observation;
  scope: Scope;
  previousScope?: Scope;
  sourceLabel: string;
}
export interface MetricDataset {
  schemaVersion: 1;
  name: string;
  isSample: boolean;
  metrics: readonly MetricView[];
}
export interface SeriesPoint {
  key: string;
  label: string;
  value: number | null;
}
/** A named series used by grouped/stacked categorical charts. */
export interface ChartSeries {
  key: string;
  label: string;
}
/** Category rows for grouped/stacked charts. Values are keyed by ChartSeries.key. */
export interface MultiSeriesPoint {
  key: string;
  label: string;
  values: Readonly<Record<string, number | null>>;
}
export type MetricPattern = 'number' | 'comparison' | 'sparkline' | 'target' | 'status' | 'compact';
export interface DataProvider<Query, Result> {
  load(query: Query, signal: AbortSignal): Promise<Result>;
}
export type LoadOutcome<Result> = {
  status: 'ready';
  value: Result;
} | {
  status: 'discarded';
} | {
  status: 'error';
  error: Error;
};
