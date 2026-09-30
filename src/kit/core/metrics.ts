import type { MetricView, Scope, Unit } from '../contracts.js';
import { validateMetricView, validateScope } from './validate.js';
export interface MetricComparison {
  state: 'comparable' | 'new' | 'unavailable' | 'none';
  value: number | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  reason?: 'missing-baseline' | 'partial-data' | 'scope-mismatch' | 'negative-baseline' | 'overflow';
}
export function segmentKey(scope: Scope): string {
  return JSON.stringify(Object.keys(scope.segment).sort().map(k => [k, [...scope.segment[k]].sort()]));
}
/** Exact query identity: segment order does not alter meaning; revision does. */
export function scopeKey(scope: Scope): string {
  validateScope(scope);
  return JSON.stringify([scope.id, scope.startDate, scope.endDate, scope.timeZone, scope.revision, segmentKey(scope)]);
}
function days(scope: Scope) { return (Date.parse(scope.endDate) - Date.parse(scope.startDate)) / 86400000 + 1; }
export function scopesComparable(current: Scope, previous: Scope): boolean {
  validateScope(current);
  validateScope(previous);
  return current.timeZone === previous.timeZone && segmentKey(current) === segmentKey(previous)
    && days(current) === days(previous) && previous.endDate < current.startDate;
}
export function compareMetric(metric: MetricView): MetricComparison {
  validateMetricView(metric);
  const none = (reason: MetricComparison['reason']): MetricComparison => ({ state: 'unavailable', value: null, sentiment: 'neutral', reason });
  const { definition: d, current, previous, previousScope } = metric;
  if (d.comparison === 'none')
    return { state: 'none', value: null, sentiment: 'neutral' };
  if (!previous || !previousScope)
    return none('missing-baseline');
  if (!scopesComparable(metric.scope, previousScope))
    return none('scope-mismatch');
  if (current.quality.coverage !== 'complete' || previous.quality.coverage !== 'complete' || current.value === null || previous.value === null)
    return none('partial-data');
  const delta = current.value - previous.value;
  if (!Number.isFinite(delta) || Math.abs(delta) > Number.MAX_SAFE_INTEGER)
    return none('overflow');
  let value = delta;
  if (d.comparison === 'relative') {
    if (previous.value < 0)
      return none('negative-baseline');
    if (previous.value === 0 && current.value !== 0)
      return { state: 'new', value: delta, sentiment: 'neutral' };
    value = previous.value === 0 ? 0 : delta / previous.value * 100;
  }
  if (d.comparison === 'percentage-points')
    value *= 100;
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)
    return none('overflow');
  const positive = d.polarity === 'higher-is-better' ? delta > 0 : delta < 0;
  const sentiment = delta === 0 || d.polarity === 'neutral' ? 'neutral' : positive ? 'positive' : 'negative';
  return { state: 'comparable', value, sentiment };
}
export function formatMetricValue(value: number | null, unit: Unit, locale = 'en'): string {
  if (value === null)
    return '—';
  if (!Number.isFinite(value))
    throw new RangeError('Finite values required.');
  const number = (v: number, digits = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v);
  if (unit.kind === 'money')
    return new Intl.NumberFormat(locale, { style: 'currency', currency: unit.currency, minimumFractionDigits: unit.exponent, maximumFractionDigits: unit.exponent }).format(value / 10 ** unit.exponent);
  if (unit.kind === 'ratio') {
    // Avoid rounding observed downtime away as "100%", or nonzero rates into "0%".
    const percent = value * 100;
    let digits = 2;
    while (digits < 8 && ((percent !== 0 && Number(percent.toFixed(digits)) === 0) || (percent !== 100 && Number(percent.toFixed(digits)) === 100)))
      digits++;
    if (percent < 100 && Number(percent.toFixed(digits)) === 100)
      return '<100%';
    if (percent > 100 && Number(percent.toFixed(digits)) === 100)
      return '>100%';
    const formatted = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: digits }).format(value);
    if (percent > 0 && Number(percent.toFixed(digits)) === 0)
      return '<0.00000001%';
    if (percent < 0 && Number(percent.toFixed(digits)) === 0)
      return '>-0.00000001%';
    return formatted;
  }
  if (unit.kind === 'duration')
    return value < 1000 ? `${number(value, 2)} ms` : `${number(value / 1000, 2)} ${locale.startsWith('ko') ? '초' : 's'}`;
  return `${number(value, unit.kind === 'count' ? 0 : 2)}${unit.label ? ` ${unit.label}` : ''}`;
}
export function targetResult(metric: MetricView): {
  met: boolean | null;
  ratio: number | null;
} {
  validateMetricView(metric);
  const target = metric.definition.target;
  const value = metric.current.value;
  if (!target || value === null || metric.current.quality.coverage !== 'complete')
    return { met: null, ratio: null };
  const ratio = target.value > 0 ? value / target.value : null;
  return { met: target.relation === 'at-least' ? value >= target.value : value <= target.value, ratio: ratio !== null && Number.isFinite(ratio) ? ratio : null };
}
/** Explicit ratio-of-sums helper. Never averages percentages with unknown denominators. */
export function ratioOfSums(pairs: readonly {
  numerator: number;
  denominator: number;
}[]) {
  let numerator = 0, denominator = 0;
  for (const pair of pairs) {
    if (!Number.isFinite(pair.numerator) || !Number.isFinite(pair.denominator) || pair.denominator < 0)
      throw new RangeError('Invalid ratio pair.');
    numerator += pair.numerator;
    denominator += pair.denominator;
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(numerator) > Number.MAX_SAFE_INTEGER || denominator > Number.MAX_SAFE_INTEGER)
      throw new RangeError('Ratio sum exceeds supported range.');
  }
  const value = denominator === 0 ? null : numerator / denominator;
  if (value !== null && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER))
    throw new RangeError('Ratio result exceeds supported range.');
  return { numerator, denominator, value };
}
