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
