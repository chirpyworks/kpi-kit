import type { ChartSeries, MultiSeriesPoint, SeriesPoint } from '../contracts.js';
export function validatePoints(points: readonly SeriesPoint[]) {
  if (points.length > 1000)
    throw new RangeError('At most 1000 points. Aggregate upstream.');
  const keys = new Set<string>();
  for (const p of points) {
    if (!p.key || !p.label || keys.has(p.key))
      throw new RangeError('Points need unique keys and labels.');
    if (p.value !== null && (!Number.isFinite(p.value) || Math.abs(p.value) > Number.MAX_SAFE_INTEGER))
      throw new RangeError('Points need safe finite values or null.');
    keys.add(p.key);
  }
}
export function zeroDomain(values: readonly (number | null)[]): [
  number,
  number
] {
  const numeric = values.filter((v): v is number => v !== null);
  if (numeric.some(v => !Number.isFinite(v) || Math.abs(v) > Number.MAX_SAFE_INTEGER))
    throw new RangeError('Unsafe domain.');
  const min = Math.min(0, ...numeric), max = Math.max(0, ...numeric);
  return min === max ? [0, 1] : [min, max];
}
/** Missing points break paths; isolated points remain individual points. */
export function seriesSegments(points: readonly SeriesPoint[]) {
  validatePoints(points);
  const segments: {
    index: number;
    value: number;
  }[][] = [];
  let current: {
    index: number;
    value: number;
  }[] = [];
  points.forEach((point, index) => {
    if (point.value === null) {
      if (current.length)
        segments.push(current);
      current = [];
    }
    else
      current.push({ index, value: point.value });
  });
  if (current.length)
    segments.push(current);
  return segments;
}
export function donutParts(points: readonly SeriesPoint[]) {
  validatePoints(points);
  if (points.length > 8)
    throw new RangeError('Donut supports at most 8 categories. Use bars for more.');
  if (points.some(p => p.value === null || p.value! < 0))
    throw new RangeError('Donut requires complete nonnegative parts.');
  const total = points.reduce((sum, p) => sum + p.value!, 0);
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER)
    throw new RangeError('Total exceeds supported range.');
  return { total, parts: points.map(p => ({ ...p, fraction: total ? p.value! / total : 0 })) };
}

/** Readable zero-inclusive display ticks; observations are never rounded. */
export function chartScale(values: readonly (number | null)[]) {
  const [rawMin, rawMax] = zeroDomain(values);
  const rawStep = (rawMax - rawMin) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = ([1, 2, 5, 10].find(n => n >= rawStep / magnitude) ?? 10) * magnitude;
  // Subnormal finite inputs can underflow when finding the base-10 interval.
  if (!(step > 0) || !Number.isFinite(step))
    return { min: rawMin, max: rawMax, ticks: [rawMin, rawMax] };
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  return { min, max, ticks };
}


export function validateMultiSeries(points: readonly MultiSeriesPoint[], series: readonly ChartSeries[], options: { stacked?: boolean } = {}) {
  if (series.length < 1 || series.length > 4)
    throw new RangeError('Grouped/stacked charts support 1 to 4 series.');
  if (points.length > 24)
    throw new RangeError('Grouped/stacked charts support at most 24 categories. Aggregate upstream.');
  const seriesKeys = new Set<string>();
  for (const item of series) {
    if (!item.key || !item.label || seriesKeys.has(item.key))
      throw new RangeError('Series need unique keys and labels.');
    seriesKeys.add(item.key);
  }
  const pointKeys = new Set<string>();
  for (const point of points) {
    if (!point.key || !point.label || pointKeys.has(point.key))
      throw new RangeError('Categories need unique keys and labels.');
    pointKeys.add(point.key);
    for (const key of Object.keys(point.values)) {
      if (!seriesKeys.has(key))
        throw new RangeError(`Unknown series key: ${key}`);
    }
    for (const seriesItem of series) {
      const value = point.values[seriesItem.key] ?? null;
      if (value !== null && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER))
        throw new RangeError('Multi-series values need safe finite numbers or null.');
      if (options.stacked && value !== null && value < 0)
        throw new RangeError('Stacked bars require nonnegative values.');
    }
  }
}

export function multiSeriesValues(points: readonly MultiSeriesPoint[], series: readonly ChartSeries[]) {
  validateMultiSeries(points, series);
  return points.flatMap(point => series.map(item => point.values[item.key] ?? null));
}

export function stackedTotals(points: readonly MultiSeriesPoint[], series: readonly ChartSeries[]) {
  validateMultiSeries(points, series, { stacked: true });
  return points.map(point => {
    let total = 0;
    let observed = false;
    for (const item of series) {
      const value = point.values[item.key] ?? null;
      if (value !== null) { total += value; observed = true; }
    }
    if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER)
      throw new RangeError('Stacked total exceeds supported range.');
    return observed ? total : null;
  });
}


export function waterfallSteps(start: number, changes: readonly SeriesPoint[]) {
  if (!Number.isFinite(start) || Math.abs(start) > Number.MAX_SAFE_INTEGER)
    throw new RangeError('Waterfall start must be a safe finite value.');
  validatePoints(changes);
  if (changes.length > 12)
    throw new RangeError('Waterfall supports at most 12 changes. Aggregate upstream.');
  let current = start;
  const steps: { key: string; label: string; from: number; to: number; value: number; kind: 'start' | 'change' | 'end' }[] = [
    { key: '__start__', label: 'Start', from: 0, to: start, value: start, kind: 'start' },
  ];
  for (const change of changes) {
    if (change.value === null) return { complete: false as const, end: null, steps };
    const next = current + change.value;
    if (!Number.isFinite(next) || Math.abs(next) > Number.MAX_SAFE_INTEGER)
      throw new RangeError('Waterfall cumulative value exceeds supported range.');
    steps.push({ key: change.key, label: change.label, from: current, to: next, value: change.value, kind: 'change' });
    current = next;
  }
  steps.push({ key: '__end__', label: 'End', from: 0, to: current, value: current, kind: 'end' });
  return { complete: true as const, end: current, steps };
}
