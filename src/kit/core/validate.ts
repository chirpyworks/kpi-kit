import type { MetricDataset, MetricView, Observation, Scope, Unit } from '../contracts.js';
export class ContractError extends Error {
  constructor(public readonly path: string, public readonly code: string) {
    // Do not copy potentially sensitive input values into errors or logs.
    super(`${path}: ${code}`);
    this.name = 'ContractError';
  }
}
const bad = (path: string, code: string): never => { throw new ContractError(path, code); };
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    bad(path, 'expected-object');
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], path: string) {
  if (Object.keys(value).some(key => !allowed.includes(key)))
    bad(path, 'unknown-field');
}
function text(value: unknown, path: string, max = 300): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    bad(path, 'expected-nonempty-text');
  return value as string;
}
function choice(value: unknown, values: readonly string[], path: string) {
  if (typeof value !== 'string' || !values.includes(value))
    bad(path, 'unsupported-value');
}
function finite(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)
    bad(path, 'expected-safe-finite-number');
}
export function isBusinessDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateScope(value: unknown, path = 'scope'): Scope {
  const o = object(value, path);
  keys(o, ['id', 'startDate', 'endDate', 'timeZone', 'segment', 'revision'], path);
  text(o.id, `${path}.id`);
  text(o.revision, `${path}.revision`);
  if (!isBusinessDate(o.startDate))
    bad(`${path}.startDate`, 'invalid-business-date');
  if (!isBusinessDate(o.endDate))
    bad(`${path}.endDate`, 'invalid-business-date');
  if ((o.startDate as string) > (o.endDate as string))
    bad(path, 'reversed-range');
  const timeZone = text(o.timeZone, `${path}.timeZone`);
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(0);
  }
  catch {
    bad(`${path}.timeZone`, 'invalid-time-zone');
  }
  const segment = object(o.segment, `${path}.segment`);
  if (Object.keys(segment).length > 30)
    bad(`${path}.segment`, 'too-many-segments');
  for (const [key, values] of Object.entries(segment)) {
    text(key, `${path}.segment`, 80);
    if (!Array.isArray(values) || values.length > 100)
      bad(`${path}.segment`, 'expected-short-string-array');
    (values as unknown[]).forEach(v => text(v, `${path}.segment`));
    if (new Set(values as string[]).size !== (values as string[]).length)
      bad(`${path}.segment`, 'duplicate-value');
  }
  return value as Scope;
}
export function validateUnit(value: unknown, path = 'unit'): Unit {
  const o = object(value, path);
  choice(o.kind, ['count', 'money', 'ratio', 'duration', 'number'], `${path}.kind`);
  if (o.kind === 'money') {
    keys(o, ['kind', 'currency', 'exponent'], path);
    if (typeof o.currency !== 'string' || !/^[A-Z]{3}$/.test(o.currency))
      bad(`${path}.currency`, 'expected-iso-currency-code');
    // Explicit upstream exponent. Do not infer an exchange rate or silently rescale money.
    if (!Number.isInteger(o.exponent) || (o.exponent as number) < 0 || (o.exponent as number) > 4)
      bad(`${path}.exponent`, 'invalid-exponent');
  }
  else if (o.kind === 'duration') {
    keys(o, ['kind', 'base'], path);
    if (o.base !== 'ms')
      bad(`${path}.base`, 'milliseconds-required');
  }
  else if (o.kind === 'number' || o.kind === 'count') {
    keys(o, ['kind', 'label'], path);
    if (o.kind === 'number' || o.label !== undefined)
      text(o.label, `${path}.label`, 80);
  }
  else
    keys(o, ['kind'], path);
  return value as Unit;
}
function unitValue(value: unknown, unit: Unit, path: string): asserts value is number {
  finite(value, path);
  if ((unit.kind === 'count' || unit.kind === 'money') && !Number.isSafeInteger(value))
    bad(path, 'integer-required');
  if ((unit.kind === 'count' || unit.kind === 'duration') && value < 0)
    bad(path, 'negative-value');
}
function observation(value: unknown, unit: Unit, path: string): Observation {
  const o = object(value, path);
  keys(o, ['value', 'quality', 'numerator', 'denominator'], path);
  const q = object(o.quality, `${path}.quality`);
  keys(q, ['coverage', 'freshness', 'reasons'], `${path}.quality`);
  choice(q.coverage, ['complete', 'partial', 'missing'], `${path}.quality.coverage`);
  choice(q.freshness, ['current', 'stale', 'unknown'], `${path}.quality.freshness`);
  if (q.reasons !== undefined) {
    if (!Array.isArray(q.reasons) || q.reasons.length > 10)
      bad(`${path}.quality.reasons`, 'expected-short-array');
    (q.reasons as unknown[]).forEach(v => text(v, `${path}.quality.reasons`));
  }
  if (q.coverage !== 'complete' && (!Array.isArray(q.reasons) || !q.reasons.length))
    bad(`${path}.quality.reasons`, 'reason-required');
  if (o.value === null) {
    if (q.coverage === 'complete')
      bad(`${path}.value`, 'complete-value-cannot-be-null');
  }
  else {
    unitValue(o.value, unit, `${path}.value`);
    if (q.coverage === 'missing')
      bad(`${path}.value`, 'missing-value-must-be-null');
  }
  if ((o.numerator === undefined) !== (o.denominator === undefined))
    bad(path, 'ratio-pair-required');
  if (o.numerator !== undefined) {
    if (unit.kind !== 'ratio')
      bad(path, 'ratio-unit-required');
    finite(o.numerator, `${path}.numerator`);
    finite(o.denominator, `${path}.denominator`);
    if (o.denominator < 0)
      bad(`${path}.denominator`, 'negative-denominator');
    if (o.denominator === 0) {
      if (o.value !== null)
        bad(`${path}.value`, 'zero-denominator-requires-null');
    }
    else {
      const ratio = o.numerator / o.denominator;
      if (!Number.isFinite(ratio) || Math.abs(ratio) > Number.MAX_SAFE_INTEGER)
        bad(`${path}.value`, 'ratio-overflow');
      if (typeof o.value !== 'number' || Math.abs(o.value - ratio) > 1e-10 * Math.max(1, Math.abs(ratio)))
        bad(`${path}.value`, 'ratio-does-not-reconcile');
    }
  }
  return value as Observation;
}
export function validateMetricView(value: unknown, path = 'metric'): MetricView {
  const o = object(value, path);
  keys(o, ['definition', 'current', 'previous', 'scope', 'previousScope', 'sourceLabel'], path);
  const d = object(o.definition, `${path}.definition`);
  keys(d, ['id', 'title', 'description', 'unit', 'aggregate', 'polarity', 'comparison', 'target'], `${path}.definition`);
  const id = text(d.id, `${path}.definition.id`, 80);
  if (!/^[a-z][a-z0-9-]*$/.test(id))
    bad(`${path}.definition.id`, 'invalid-id');
  text(d.title, `${path}.definition.title`, 150);
  text(d.description, `${path}.definition.description`, 1000);
  const unit = validateUnit(d.unit, `${path}.definition.unit`);
  choice(d.aggregate, ['sum', 'distinct', 'ratio', 'last', 'custom'], `${path}.definition.aggregate`);
  choice(d.polarity, ['higher-is-better', 'lower-is-better', 'neutral'], `${path}.definition.polarity`);
  choice(d.comparison, ['absolute', 'relative', 'percentage-points', 'none'], `${path}.definition.comparison`);
  if (d.comparison === 'percentage-points' && unit.kind !== 'ratio')
    bad(`${path}.definition.comparison`, 'ratio-unit-required');
  if (d.target !== undefined) {
    const target = object(d.target, `${path}.definition.target`);
    keys(target, ['value', 'relation'], `${path}.definition.target`);
    unitValue(target.value, unit, `${path}.definition.target.value`);
    choice(target.relation, ['at-least', 'at-most'], `${path}.definition.target.relation`);
  }
  observation(o.current, unit, `${path}.current`);
  validateScope(o.scope, `${path}.scope`);
  text(o.sourceLabel, `${path}.sourceLabel`);
  if ((o.previous === undefined) !== (o.previousScope === undefined))
    bad(path, 'previous-value-and-scope-required');
  if (o.previous !== undefined) {
    observation(o.previous, unit, `${path}.previous`);
    validateScope(o.previousScope, `${path}.previousScope`);
  }
  return value as MetricView;
}
export function validateMetricDataset(value: unknown): MetricDataset {
  const o = object(value, '$');
  keys(o, ['schemaVersion', 'name', 'isSample', 'metrics'], '$');
  if (o.schemaVersion !== 1)
    bad('$.schemaVersion', 'unsupported-version');
  text(o.name, '$.name');
  if (typeof o.isSample !== 'boolean')
    bad('$.isSample', 'boolean-required');
  if (!Array.isArray(o.metrics) || o.metrics.length < 1 || o.metrics.length > 100)
    bad('$.metrics', 'expected-1-to-100-metrics');
  const ids = new Set<string>();
  (o.metrics as unknown[]).forEach((m, i) => {
    const metric = validateMetricView(m, `$.metrics[${i}]`);
    if (ids.has(metric.definition.id))
      bad(`$.metrics[${i}].definition.id`, 'duplicate-id');
    ids.add(metric.definition.id);
  });
  return value as MetricDataset;
}
export function parseMetricDataset(text: string): MetricDataset {
  // File import also checks byte size. This character cap bounds other string callers.
  if (text.length > 5 * 1024 * 1024)
    bad('$', 'input-too-large');
  let value: unknown;
  try {
    value = JSON.parse(text);
  }
  catch {
    bad('$', 'invalid-json');
  }
  return validateMetricDataset(value);
}
