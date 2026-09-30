import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateMetricDataset, compareMetric, donutParts, waterfallSteps,
  queryRows, rowsToCsv, ratioOfSums, stackedTotals
} from '../.test-build/src/kit/core/index.js';

const sample = JSON.parse(await readFile('public/examples/metrics.json','utf8'));
const dataset = validateMetricDataset(sample);

test('sample dataset validates and has unique metrics', () => {
  assert.equal(dataset.schemaVersion, 1);
  assert.equal(new Set(dataset.metrics.map(m=>m.definition.id)).size, dataset.metrics.length);
});

test('relative comparison preserves polarity', () => {
  const metric = dataset.metrics.find(m=>m.definition.id==='backlog');
  const result = compareMetric(metric);
  assert.equal(result.state, 'comparable');
  assert.equal(result.sentiment, 'positive');
  assert.ok(result.value < 0);
});

test('percentage point comparison is not relative percent', () => {
  const metric = dataset.metrics.find(m=>m.definition.id==='build-success');
  const result = compareMetric(metric);
  assert.equal(result.state, 'comparable');
  assert.ok(Math.abs(result.value - 1.5) < 1e-9);
});

test('ratio of sums uses underlying numerators and denominators', () => {
  const result = ratioOfSums([{numerator:1,denominator:2},{numerator:9,denominator:10}]);
  assert.equal(result.numerator,10);
  assert.equal(result.denominator,12);
  assert.ok(Math.abs(result.value - 10/12) < 1e-12);
});

test('donut rejects missing parts', () => {
  assert.throws(()=>donutParts([{key:'a',label:'A',value:1},{key:'b',label:'B',value:null}]));
});

test('waterfall withholds a closing value when a movement is missing', () => {
  const result=waterfallSteps(100,[{key:'a',label:'A',value:10},{key:'b',label:'B',value:null}]);
  assert.equal(result.complete,false);
  assert.equal(result.end,null);
});

test('stacked totals preserve fully missing categories', () => {
  const series=[{key:'a',label:'A'},{key:'b',label:'B'}];
  const totals=stackedTotals([{key:'x',label:'X',values:{a:null,b:null}},{key:'y',label:'Y',values:{a:2,b:3}}],series);
  assert.deepEqual(totals,[null,5]);
});

test('table query sorts and CSV neutralizes spreadsheet formulas', () => {
  const rows=[{id:1,name:'=cmd',value:2},{id:2,name:'Safe',value:10}];
  const columns=[{id:'name',label:'Name',value:r=>r.name},{id:'value',label:'Value',value:r=>r.value}];
  const sorted=queryRows(rows,columns,'',{id:'value',direction:'desc'});
  assert.equal(sorted[0].id,2);
  const csv=rowsToCsv(rows,columns);
  assert.match(csv,/"'=cmd"/);
});

test('signed chart intervals grow from the same zero baseline', async () => {
  const { chartInterval, chartPosition } = await import('../.test-build/src/kit/core/chart.js');
  const domain = [-20, 40];
  const negative = chartInterval(0, -20, domain);
  const positive = chartInterval(0, 40, domain);
  assert.equal(negative.start, 0);
  assert.equal(negative.end, chartPosition(0, domain));
  assert.equal(positive.start, negative.end);
  assert.equal(positive.end, 1);
  assert.ok(Math.abs(positive.size - 2 * negative.size) < 1e-12);
});

test('zero and missing intervals never gain a nonzero bar', async () => {
  const { chartInterval } = await import('../.test-build/src/kit/core/chart.js');
  assert.deepEqual(chartInterval(100, 100, [0, 200]), { start: .5, end: .5, size: 0 });
  assert.deepEqual(chartInterval(0, 0, [-20, 20]), { start: .5, end: .5, size: 0 });
  assert.equal(chartInterval(0, null, [0, 200]), null);
  assert.equal(chartInterval(null, 100, [0, 200]), null);
});

test('waterfall zero changes preserve the running value and render zero height', async () => {
  const { chartInterval } = await import('../.test-build/src/kit/core/chart.js');
  const result = waterfallSteps(100, [
    { key: 'zero', label: 'No movement', value: 0 },
    { key: 'loss', label: 'Loss', value: -120 },
    { key: 'zero-negative', label: 'Still unchanged', value: 0 },
  ]);
  assert.equal(result.end, -20);
  const zero = result.steps.find(step => step.key === 'zero');
  const negativeZero = result.steps.find(step => step.key === 'zero-negative');
  assert.equal(chartInterval(zero.from, zero.to, [-20, 100]).size, 0);
  assert.equal(chartInterval(negativeZero.from, negativeZero.to, [-20, 100]).size, 0);
  assert.equal(result.steps.find(step => step.key === 'loss').to, -20);
});

test('chart positions retain tiny safe observations without an artificial span floor', async () => {
  const { chartPosition, chartInterval } = await import('../.test-build/src/kit/core/chart.js');
  assert.equal(chartPosition(1e-15, [0, 2e-15]), .5);
  assert.equal(chartInterval(0, -1e-15, [-2e-15, 2e-15]).size, .25);
  assert.throws(() => chartPosition(1, [0, 0]), RangeError);
  assert.throws(() => chartPosition(1, [2, 1]), RangeError);
  assert.throws(() => chartPosition(Infinity, [0, 1]), RangeError);
  assert.throws(() => chartPosition(0, [-Number.MAX_VALUE, Number.MAX_VALUE]), RangeError);
});

test('chart scales and series paths distinguish missing data from zero', async () => {
  const { chartScale, seriesSegments, multiSeriesValues } = await import('../.test-build/src/kit/core/chart.js');
  assert.equal(chartScale([-7, null, 12]).ticks.includes(0), true);
  const points = [
    { key: 'one', label: 'One', value: -1 },
    { key: 'gap', label: 'Gap', value: null },
    { key: 'zero', label: 'Zero', value: 0 },
  ];
  assert.deepEqual(seriesSegments(points), [[{ index: 0, value: -1 }], [{ index: 2, value: 0 }]]);
  assert.deepEqual(multiSeriesValues([{ key: 'row', label: 'Row', values: { a: 0 } }], [
    { key: 'a', label: 'A' }, { key: 'b', label: 'B' },
  ]), [0, null]);
});
