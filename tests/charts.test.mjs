import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const output = process.env.KPI_CHART_TEST_OUTDIR || '.test-build';
const compiled = file => import(pathToFileURL(resolve(output, 'src', file)).href);
const {
  BarChart, BulletChart, DonutChart, GroupedBarChart, SeriesChart,
  StackedBarChart, VerticalBarChart, WaterfallChart,
} = await compiled('kit/charts/Charts.js');

const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, { title: 'Test chart', ...props }));
const series = [{ key: 'negative', label: 'Negative series' }, { key: 'positive', label: 'Positive series' }];
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const seriesBar = (html, key) => {
  const group = html.match(new RegExp(`<g[^>]*data-series="${key}"[^>]*>([\\s\\S]*?)<\\/g>`));
  assert.ok(group, `Rendered series ${key}`);
  const rectangle = group[1].match(/<rect[^>]*>/);
  assert.ok(rectangle, `Rendered rectangle for ${key}`);
  return attributes(rectangle[0]);
};
const mixedPoints = [
  { key: 'negative', label: 'Negative', value: -5 },
  { key: 'positive', label: 'Positive', value: 10 },
  { key: 'zero', label: 'Zero', value: 0 },
  { key: 'missing', label: 'Missing', value: null },
];

test('grouped negative bars extend below zero rather than losing their sign', () => {
  const html = render(GroupedBarChart, { series, points: [{ key: 'a', label: 'A', values: { negative: -5, positive: 10 } }] });
  const negative = seriesBar(html, 'negative'), positive = seriesBar(html, 'positive');
  assert.ok(Number(negative.y) > Number(positive.y));
  assert.ok(Math.abs(Number(positive.y) + Number(positive.height) - Number(negative.y)) < 1e-8);
  assert.ok(Math.abs(Number(positive.height) - Number(negative.height) * 2) < 1e-8);
  assert.match(html, /data-negative="true"/);
  assert.match(html, /var\(--kk-chart-2/);
});

test('grouped zero bars are zero-height and omitted values remain missing', () => {
  const html = render(GroupedBarChart, { series, points: [{ key: 'a', label: 'A', values: { positive: 0 } }] });
  assert.equal(seriesBar(html, 'positive').height, '0');
  assert.doesNotMatch(html, /<g[^>]*data-series="negative"/);
  assert.match(html, /data-state="missing"/);
  assert.match(html, /<td>Missing<\/td>/);
});

test('waterfall zero movement does not produce a running-total-sized bar', () => {
  const html = render(WaterfallChart, { start: 100, changes: [{ key: 'zero', label: 'No change', value: 0 }] });
  assert.match(html, /data-kind="change"[^>]*data-from="100" data-to="100" data-state="zero"/);
  const group = html.match(/<g[^>]*data-kind="change"[^>]*>([\s\S]*?)<\/g>/);
  assert.equal(attributes(group[1].match(/<rect[^>]*>/)[0]).height, '0');
});

test('waterfall missing movement visibly withholds its closing value', () => {
  const html = render(WaterfallChart, { start: 100, changes: [{ key: 'gap', label: 'Unknown movement', value: null }] });
  assert.doesNotMatch(html, /data-kind="end"/);
  assert.match(html, /data-complete="false"/);
  assert.match(html, /Closing value withheld because a movement is missing/);
  assert.match(html, /Unknown movement/);
  assert.match(html, /<th scope="row">End<\/th><td>Missing<\/td>/);
});

test('horizontal and vertical charts keep signed, zero and missing observations distinct', () => {
  for (const Component of [BarChart, VerticalBarChart]) {
    const html = render(Component, { points: mixedPoints });
    assert.match(html, /data-negative="true"/);
    assert.match(html, /data-state="zero"/);
    assert.match(html, /data-state="missing"/);
    assert.match(html, /<td>Missing<\/td>/);
  }
});

test('series gaps are not connected and every isolated observation remains visible', () => {
  const html = render(SeriesChart, { points: [mixedPoints[0], mixedPoints[3], mixedPoints[2]], area: true });
  assert.doesNotMatch(html, /<polyline/);
  assert.doesNotMatch(html, /<polygon/);
  assert.equal((html.match(/class="kk-dot"/g) ?? []).length, 2);
  assert.match(html, /1 missing/);
});

test('all-missing grouped and vertical charts render an explicit empty state', () => {
  assert.match(render(GroupedBarChart, { series, points: [{ key: 'a', label: 'A', values: {} }] }), /No observed values to display/);
  assert.match(render(VerticalBarChart, { points: [mixedPoints[3]] }), /No observed values to display/);
});

test('stacked missing segments are labeled incomplete instead of implied complete totals', () => {
  const html = render(StackedBarChart, { series, points: [{ key: 'a', label: 'A', values: { positive: 10 } }] });
  assert.match(html, /data-partial="true"/);
  assert.match(html, /Incomplete categories show observed values only/);
  assert.match(html, /<td>Missing<\/td>/);
  assert.throws(() => render(StackedBarChart, { series, points: [{ key: 'a', label: 'A', values: { negative: -1 } }] }), RangeError);
});

test('multi-series tables respect units and axes expose visible labels', () => {
  const html = render(GroupedBarChart, {
    series, points: [{ key: 'a', label: 'A', values: { negative: 125, positive: 250 } }],
    unit: { kind: 'money', currency: 'USD', exponent: 2 }, xAxisLabel: 'Week', yAxisLabel: 'Revenue (USD)',
  });
  assert.match(html, /Revenue \(USD\)/);
  assert.match(html, />Week<\/p>/);
  assert.match(html, /<td>\$1.25<\/td>/);
  assert.match(html, /<td>\$2.50<\/td>/);
  assert.match(html, /aria-label="Legend"/);
  assert.match(html, /<th scope="row">A<\/th>/);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|\s|>)/);
});

test('chart names and descriptions use unique IDs in a composed dashboard', () => {
  const html = renderToStaticMarkup(React.createElement('div', null,
    React.createElement(SeriesChart, { title: 'Revenue trend', points: mixedPoints, description: 'Observed weekly revenue' }),
    React.createElement(DonutChart, { title: 'Channel mix', points: [{ key: 'one', label: 'One', value: 2 }] }),
  ));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  const references = [...html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)].flatMap(match => match[1].split(' '));
  assert.ok(references.every(reference => ids.includes(reference)));
  assert.match(html, /Observed weekly revenue/);
});

test('donut legends and arcs have matching distinct series tokens', () => {
  const html = render(DonutChart, { points: [1, 2, 3, 4].map(value => ({ key: String(value), label: `Part ${value}`, value })) });
  for (const token of ['--kk-accent', '--kk-chart-2', '--kk-chart-3', '--kk-chart-4']) {
    assert.ok((html.match(new RegExp(token, 'g')) ?? []).length >= 2, `${token} appears in its arc and legend`);
  }
  assert.match(html, /aria-label="Legend"/);
});

test('bullet charts provide accessible actual and target values with a data alternative', () => {
  const html = render(BulletChart, { actual: 0, target: 100, unit: { kind: 'count' } });
  assert.match(html, /role="img" aria-label="Actual 0 · Target 100"/);
  assert.match(html, /<th scope="row">Actual<\/th><td>0<\/td>/);
  assert.throws(() => render(BulletChart, { actual: Number.MAX_SAFE_INTEGER + 1, target: 0 }), RangeError);
});

test('responsive horizontal tracks place negative and positive bars on opposite sides of zero', () => {
  const html = render(BarChart, { points: mixedPoints });
  const negative = html.match(/<i[^>]*data-to="-5"[^>]*>/)[0];
  const positive = html.match(/<i[^>]*data-to="10"[^>]*>/)[0];
  const zero = html.match(/<i[^>]*data-to="0"[^>]*>/)[0];
  const styleValue = (tag, property) => Number(tag.match(new RegExp(`${property}:([\\d.]+)%`))[1]);
  assert.equal(styleValue(negative, 'left'), 0);
  assert.ok(Math.abs(styleValue(negative, 'width') - styleValue(positive, 'left')) < 1e-8);
  assert.ok(Math.abs(styleValue(positive, 'width') - 2 * styleValue(negative, 'width')) < 1e-8);
  assert.equal(styleValue(zero, 'width'), 0);
  assert.doesNotMatch(html, /<svg/);
});

test('hiding a data table still retains an accessible textual value description', () => {
  const html = render(SeriesChart, { points: mixedPoints, showDataTable: false });
  assert.doesNotMatch(html, /<details/);
  assert.match(html, /<desc[^>]*>[^<]*Negative: -5; Positive: 10; Zero: 0; Missing: Missing<\/desc>/);
  assert.match(html, /aria-describedby=/);
});

test('tiny signed observations remain nonzero in chart source tables and accessible descriptions', () => {
  const cases = [
    { unit: { kind: 'number', label: 'kg' }, value: .001, positive: '0.001 kg', negative: '-0.001 kg' },
    { unit: { kind: 'number', label: 'kg' }, value: 1e-15, positive: '1E-15 kg', negative: '-1E-15 kg' },
    { unit: { kind: 'count', label: 'events' }, value: .001, positive: '0.001 events', negative: '-0.001 events' },
    { unit: { kind: 'money', currency: 'USD', exponent: 2 }, value: .001, positive: '$0.00001', negative: '-$0.00001' },
    { unit: { kind: 'money', currency: 'USD', exponent: 0 }, value: .001, positive: '$0.001', negative: '-$0.001' },
    { unit: { kind: 'money', currency: 'USD', exponent: 2 }, value: 1e-7, positive: '$1E-9', negative: '-$1E-9' },
    { unit: { kind: 'ratio' }, value: 1e-12, positive: '1E-10%', negative: '-1E-10%' },
    { unit: { kind: 'duration', base: 'ms' }, value: .001, positive: '0.001 ms', negative: '-0.001 ms' },
    { unit: { kind: 'duration', base: 'ms' }, value: 1e-15, positive: '1E-15 ms', negative: '-1E-15 ms' },
  ];
  for (const { unit, value, positive, negative } of cases) {
    const html = render(GroupedBarChart, { series, unit, points: [{ key: 'a', label: 'A', values: { negative: -value, positive: value } }] });
    assert.deepEqual([...html.matchAll(/<td>([^<]*)<\/td>/g)].map(match => match[1]), [negative, positive], `${unit.kind} ${value} source values`);
    const description = html.match(/<desc[^>]*>([^<]*)<\/desc>/)[1];
    assert.ok(description.includes(`Negative series ${negative}`), `${unit.kind} signed negative description`);
    assert.ok(description.includes(`Positive series ${positive}`), `${unit.kind} signed positive description`);
    assert.ok(Number(seriesBar(html, 'negative').height) > 0);
    assert.ok(Number(seriesBar(html, 'positive').height) > 0);
  }
});

test('money precision fallback does not underflow while converting minor units', () => {
  const html = render(SeriesChart, {
    points: [{ key: 'tiny', label: 'Tiny amount', value: Number.MIN_VALUE }],
    unit: { kind: 'money', currency: 'USD', exponent: 2 },
  });
  assert.match(html, /<td>4\.94066E-326 USD<\/td>/);
  assert.match(html, /Tiny amount: 4\.94066E-326 USD/);
});

test('precision fallback preserves true zeros, missingness, and ordinary unit formatting', () => {
  const html = render(SeriesChart, {
    points: [
      { key: 'zero', label: 'Zero', value: 0 }, { key: 'missing', label: 'Missing', value: null },
      { key: 'normal', label: 'Normal', value: 125 }, { key: 'tiny', label: 'Tiny', value: .001 },
    ],
    unit: { kind: 'money', currency: 'USD', exponent: 2 },
  });
  assert.deepEqual([...html.matchAll(/<td>([^<]*)<\/td>/g)].map(match => match[1]), ['$0.00', 'Missing', '$1.25', '$0.00001']);
  const korean = render(SeriesChart, { locale: 'ko', points: [{ key: 'tiny', label: '미량', value: -.001 }], unit: { kind: 'number', label: 'kg' } });
  assert.match(korean, /<td>-0\.001 kg<\/td>/);
  assert.match(korean, /미량: -0\.001 kg/);
});

test('period comparisons align by index on a shared scale and retain original period labels', () => {
  const html = render(SeriesChart, {
    points: [{ key: 'c1', label: 'Sep 15', value: 0 }, { key: 'c2', label: 'Sep 16', value: 10 }],
    comparisonPoints: [{ key: 'p1', label: 'Sep 01', value: 0 }, { key: 'p2', label: 'Sep 02', value: 100 }],
  });
  assert.match(html, /data-line="dashed"/);
  assert.match(html, /class="kk-comparison-line"[^>]*stroke-dasharray="5 5"/);
  assert.match(html, /Previous period/);
  assert.match(html, /Periods align by observation order/);
  assert.match(html, /<th scope="row">Sep 15<\/th><td>0<\/td><td>Sep 01<\/td><td>0<\/td>/);
  assert.match(html, /<th scope="row">Sep 16<\/th><td>10<\/td><td>Sep 02<\/td><td>100<\/td>/);
  const current = [...html.matchAll(/<circle class="kk-dot"[^>]*>/g)].map(match => attributes(match[0]));
  const previous = [...html.matchAll(/<circle class="kk-comparison-dot"[^>]*>/g)].map(match => attributes(match[0]));
  assert.deepEqual(current.map(point => point.cx), previous.map(point => point.cx));
  assert.equal(current[0].cy, previous[0].cy);
  assert.ok(Number(current[1].cy) > Number(previous[1].cy));
  assert.ok(Math.abs((206 - Number(current[1].cy)) * 10 - (206 - Number(previous[1].cy))) < 1e-8);
});

test('comparison periods reject mismatched counts and invalid observations without fabricating an alignment', () => {
  const points = [{ key: 'a', label: 'A', value: 1 }];
  assert.throws(() => render(SeriesChart, { points, comparisonPoints: [] }), /same length/);
  assert.throws(() => render(SeriesChart, { points, comparisonPoints: [{ key: 'bad', label: 'Invalid', value: Infinity }] }), RangeError);
  assert.throws(() => render(SeriesChart, { points: [], comparisonPoints: points }), /same length/);
});

test('comparison gaps break paths independently and never create an area for previous observations', () => {
  const html = render(SeriesChart, {
    area: true,
    points: [1, 2, 3].map((value, index) => ({ key: String(index), label: `Current ${index}`, value })),
    comparisonPoints: [1, null, 3].map((value, index) => ({ key: String(index), label: `Previous ${index}`, value })),
  });
  assert.equal((html.match(/class="kk-dot"/g) ?? []).length, 3);
  assert.equal((html.match(/class="kk-comparison-dot"/g) ?? []).length, 2);
  assert.equal((html.match(/<polygon/g) ?? []).length, 1);
  assert.doesNotMatch(html, /class="kk-comparison-line"/);
  assert.match(html, /Previous period\. 2 observed values; 1 missing/);
});

test('all-missing current observations can show a clearly identified previous period without a current callout', () => {
  const html = render(SeriesChart, {
    points: [{ key: 'now', label: 'Now', value: null }],
    comparisonPoints: [{ key: 'before', label: 'Before', value: 9 }],
  });
  assert.match(html, /class="kk-comparison-dot"/);
  assert.doesNotMatch(html, /class="kk-dot"/);
  assert.doesNotMatch(html, /class="kk-chart-callout"/);
  assert.match(html, /Current period\. 0 observed values; 1 missing/);
  assert.match(html, /<th scope="row">Now<\/th><td>Missing<\/td><td>Before<\/td><td>9<\/td>/);
});

test('area gradients have unique referenced IDs when multiple charts are composed', () => {
  const points = [{ key: 'a', label: 'A', value: 10 }, { key: 'b', label: 'B', value: 20 }];
  const html = renderToStaticMarkup(React.createElement('div', null,
    React.createElement(SeriesChart, { title: 'One', points, area: true }),
    React.createElement(SeriesChart, { title: 'Two', points, area: true }),
  ));
  const ids = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map(match => match[1]);
  const references = [...html.matchAll(/fill:url\(#([^)]*)\)/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.deepEqual(references, ids);
  assert.match(html, /stop-opacity="0.28"/);
  assert.match(html, /stop-opacity="0.015"/);
});

test('latest callouts name the last observed value rather than a trailing missing observation', () => {
  const html = render(SeriesChart, {
    points: [{ key: 'a', label: 'Sep 15', value: 1e-15 }, { key: 'b', label: 'Sep 16', value: null }],
    unit: { kind: 'number', label: 'kg' },
  });
  const callout = html.match(/<g class="kk-chart-callout"[^>]*>[\s\S]*?<\/g>/)[0];
  assert.match(callout, /data-point-index="0" data-kind="latest"/);
  assert.match(callout, /Latest observed · Sep 15/);
  assert.match(callout, />1E-15 kg<\/text>/);
  assert.doesNotMatch(callout, /Sep 16/);
});

test('latest callouts stay inside the plot for positive, negative, zero and long-formatted values', () => {
  for (const [value, label] of [[100, 'kg'], [-100, 'kg'], [0, 'kg'], [Number.MIN_VALUE, 'a very long measurement label '.repeat(8)]]) {
    const html = render(SeriesChart, { points: [{ key: 'a', label: 'A', value }], unit: { kind: 'number', label } });
    const group = html.match(/<g class="kk-chart-callout"[^>]*>[\s\S]*?<\/g>/)[0];
    const box = attributes(group.match(/<rect[^>]*>/)[0]);
    assert.ok(Number(box.x) >= 76);
    assert.ok(Number(box.x) + Number(box.width) <= 540);
    assert.ok(Number(box.y) >= 16);
    assert.ok(Number(box.y) + Number(box.height) <= 206);
    if (label.length > 30) assert.match(group, /lengthAdjust="spacingAndGlyphs"/);
  }
});

test('optional point selection exposes one named keyboard stop with real selection controls', () => {
  const props = { points: [{ key: 'now', label: 'Sep 15', value: .001 }], unit: { kind: 'number', label: 'kg' } };
  const html = render(SeriesChart, { ...props, interactive: true });
  assert.match(html, /<svg[^>]*role="group"/);
  assert.match(html, /class="kk-chart-inspection-target"[^>]*tabindex="0" role="button" aria-label="Sep 15: 0.001 kg" aria-pressed="false"/);
  assert.match(html, /Use Left and Right arrows to inspect observations/);
  const staticHtml = render(SeriesChart, props);
  assert.match(staticHtml, /<svg[^>]*role="img"/);
  assert.doesNotMatch(staticHtml, /tabindex="0"/);
});

test('comparison labels localize and remain available with hidden source tables', () => {
  const html = render(SeriesChart, {
    locale: 'ko', showDataTable: false,
    points: [{ key: 'now', label: '현재 날짜', value: 1 }],
    comparisonPoints: [{ key: 'before', label: '이전 날짜', value: 2 }],
  });
  assert.match(html, /현재 기간/);
  assert.match(html, /이전 기간/);
  assert.match(html, /이전 날짜: 2/);
  assert.doesNotMatch(html, /<details/);
  assert.doesNotMatch(html, /데이터 표에서 확인/);
  const custom = render(SeriesChart, {
    points: [{ key: 'now', label: 'Now', value: 1 }], comparisonPoints: [{ key: 'before', label: 'Before', value: 2 }],
    seriesLabel: 'Selected window', comparisonLabel: 'Prior window',
  });
  assert.match(custom, /Selected window/);
  assert.match(custom, /Prior window/);
});

test('responsive series height limits preserve the viewBox and reject invalid dimensions', () => {
  const points = [{ key: 'a', label: 'A', value: 1 }];
  const html = render(SeriesChart, { points, maxHeight: 300 });
  assert.match(html, /viewBox="0 0 560 252"/);
  assert.match(html, /max-height:300px/);
  assert.match(html, /font-size:13px/);
  for (const maxHeight of [0, -1, Infinity, NaN]) assert.throws(() => render(SeriesChart, { points, maxHeight }), RangeError);
});

test('inline KPI trends retain accessible original values without changing displayed metric semantics', async()=>{
  const { MetricCard }=await compiled('kit/metrics/MetricCard.js');
  const { buildDashboard, INITIAL_RANGE, metricHistories }=await compiled('demo/dashboard-data.js');
  const model=buildDashboard('revenue',INITIAL_RANGE,'en'), metric=model.metrics[0];
  const html=renderToStaticMarkup(React.createElement(MetricCard,{metric,pattern:'comparison',trend:metricHistories(model,'en')['net-sales'],trendPlacement:'inline'}));
  assert.match(html,/kk-sparkline--inline/);
  assert.match(html,/role="img" aria-label="Net sales:/);
  assert.match(html,new RegExp(`data-value="${metric.current.value}"`));
  assert.match(html,/vs previous period/);
});


test('compact presentation moves original labels and exact values outside the uncovered plot', () => {
  const html = render(SeriesChart, {
    density: 'compact', area: true, description: 'Daily movement',
    points: [{ key: 'a', label: 'Current A', value: 1e-15 }, { key: 'b', label: 'Current B', value: null }],
    comparisonPoints: [{ key: 'p1', label: 'Previous A', value: -1e-15 }, { key: 'p2', label: 'Previous B', value: 0 }],
    unit: { kind: 'number', label: 'kg' },
    headerActions: React.createElement('button', { type: 'button' }, 'Change presentation'),
  });
  assert.match(html, /kk-series-chart--compact/);
  assert.match(html, /<figcaption class="kk-chart-heading">/);
  assert.equal((html.match(/>Test chart</g) ?? []).length, 2, 'one caption and one SVG accessible title');
  assert.match(html, /kk-chart-heading-actions[^]*>Change presentation<\/button>/);
  assert.match(html, /class="kk-series-unit">kg/);
  const readout = html.slice(html.indexOf('class="kk-series-readout"'), html.indexOf('class="kk-chart-stage"'));
  assert.match(readout, /data-point-index="0" data-kind="latest"/);
  assert.match(readout, /Latest observed/);
  assert.match(readout, /Current A/);
  assert.match(readout, /Previous A/);
  assert.match(readout, /1E-15 kg/);
  assert.match(readout, /-1E-15 kg/);
  assert.match(readout, /data-line="dashed"/);
  assert.doesNotMatch(html, /class="kk-chart-callout"/);
  assert.match(html, /Aligned by observation order/);
  assert.match(html, /<th scope="row">Current B<\/th><td>Missing<\/td><td>Previous B<\/td><td>0 kg<\/td>/);
});

test('compact chart changes plot allocation without changing normalized signed data geometry', () => {
  const props = { points: mixedPoints, comparisonPoints: mixedPoints.map(point => ({ ...point, value: point.value === null ? null : point.value * 2 })) };
  const comfortable = render(SeriesChart, props), compact = render(SeriesChart, { ...props, density: 'compact' });
  const dots = html => [...html.matchAll(/<circle class="kk-(?:comparison-)?dot"[^>]*>/g)].map(match => attributes(match[0]));
  const original = dots(comfortable), dense = dots(compact);
  assert.equal(original.length, dense.length);
  original.forEach((point, index) => {
    assert.equal(point.cx, dense[index].cx);
    assert.ok(Math.abs((206 - Number(point.cy)) / 190 - (186 - Number(dense[index].cy)) / 172) < 1e-12);
  });
  assert.match(compact, /viewBox="0 0 560 220"/);
  assert.match(compact, /min-width:560px/);
  assert.match(compact, /overflow-x:auto/);
  assert.match(compact, /font-size:13px/);
  assert.match(comfortable, /viewBox="0 0 560 252"/);
});

test('compact fallback identifies a previous observation when the current period is wholly missing', () => {
  const html = render(SeriesChart, {
    density: 'compact', locale: 'ko', showDataTable: false,
    points: [{ key: 'now', label: '현재 항목', value: null }],
    comparisonPoints: [{ key: 'before', label: '이전 항목', value: 0 }],
  });
  assert.match(html, /이전 기간의 최근 관측/);
  assert.match(html, /data-state="missing">누락<\/strong>/);
  assert.match(html, /data-state="zero">0<\/strong>/);
  assert.match(html, /현재 항목/);
  assert.match(html, /이전 항목/);
  assert.doesNotMatch(html, /<details/);
});

function descendants(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => descendants(child, predicate))];
}
// A narrow React 18 hook harness executes the real handlers and state transitions.
// It does not simulate a browser or claim layout, DOM-focus, or touch-device verification.
function seriesHarness(initialProps) {
  const states = [];
  let props = initialProps;
  const dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
  const renderTree = updates => {
    props = { ...props, ...updates };
    let cursor = 0, ids = 0;
    const previous = dispatcher.current;
    dispatcher.current = {
      useId: () => `chart-test-${ids++}`,
      useState: initial => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      },
    };
    try { return SeriesChart({ title: 'Inspection test', interactive: true, density: 'compact', ...props }); }
    finally { dispatcher.current = previous; }
  };
  return { render: renderTree };
}
const targetAt = (tree, index) => descendants(tree, node => node.props['data-inspection-index'] === index)[0];
const readoutAt = tree => descendants(tree, node => node.props.className === 'kk-series-readout')[0];
const buttonNamed = (tree, label) => descendants(tree, node => node.type === 'button' && node.props['aria-label'] === label)[0];

test('pointer preview is transient while tapping keeps the exact current/prior observation', () => {
  const harness = seriesHarness({ points: mixedPoints, comparisonPoints: mixedPoints.map(point => ({ ...point, label: `Prior ${point.label}` })) });
  let tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  targetAt(tree, 0).props.onPointerEnter({ pointerType: 'mouse' });
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 0);
  targetAt(tree, 0).props.onPointerLeave();
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  targetAt(tree, 1).props.onPointerEnter({ pointerType: 'touch' });
  assert.equal(readoutAt(harness.render()).props['data-point-index'], 2, 'touch hover does not change the selection');
  targetAt(tree, 1).props.onClick();
  tree = harness.render();
  assert.equal(targetAt(tree, 1).props['aria-pressed'], true);
  targetAt(tree, 0).props.onPointerEnter({ pointerType: 'pen' });
  assert.equal(readoutAt(harness.render()).props['data-point-index'], 0);
  targetAt(tree, 0).props.onPointerLeave();
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 1);
  assert.match(targetAt(tree, 1).props['aria-label'], /Positive: 10; Previous period, Prior Positive: 10/);
});

test('arrow, Home, End, Enter, Space and Escape handlers preserve missingness and one keyboard stop', () => {
  const harness = seriesHarness({ points: mixedPoints });
  let tree = harness.render(), prevented = 0, focusTarget = '';
  const event = key => ({ key, preventDefault: () => prevented++, currentTarget: { ownerSVGElement: { querySelector: selector => ({ focus: () => { focusTarget = selector; } }) } } });
  targetAt(tree, 2).props.onKeyDown(event('ArrowRight'));
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 3);
  assert.equal(focusTarget, '[data-inspection-index="3"]');
  assert.match(targetAt(tree, 3).props['aria-label'], /Missing: Missing/);
  const missingValue = descendants(readoutAt(tree), node => node.type === 'strong')[0];
  assert.equal(missingValue.props['data-state'], 'missing');
  assert.equal(missingValue.props.children, 'Missing');
  assert.equal(descendants(tree, node => node.props.className === 'kk-chart-inspection-target' && node.props.tabIndex === 0).length, 1);
  targetAt(tree, 3).props.onKeyDown(event('Home'));
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 0);
  targetAt(tree, 0).props.onKeyDown(event('Enter'));
  assert.equal(targetAt(harness.render(), 0).props['aria-pressed'], true);
  targetAt(tree, 0).props.onKeyDown(event('End'));
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 3);
  targetAt(tree, 3).props.onKeyDown(event(' '));
  assert.equal(targetAt(harness.render(), 3).props['aria-pressed'], true);
  targetAt(tree, 3).props.onKeyDown(event('Escape'));
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  assert.equal(readoutAt(tree).props['data-kind'], 'latest');
  assert.equal(prevented, 6);
});

test('native observation buttons reach missing values and report selection through a polite status', () => {
  const harness = seriesHarness({ points: mixedPoints });
  let tree = harness.render();
  buttonNamed(tree, 'Next observation').props.onClick();
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 3);
  assert.equal(buttonNamed(tree, 'Next observation').props.disabled, true);
  assert.equal(descendants(tree, node => node.props.role === 'status')[0].props.children, 'Missing: Missing');
  buttonNamed(tree, 'Previous observation').props.onClick();
  tree = harness.render();
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  assert.equal(descendants(readoutAt(tree), node => node.type === 'strong')[0].props['data-state'], 'zero');
  descendants(tree, node => node.props.className?.split(' ').includes('kk-series-reset'))[0].props.onClick();
  assert.equal(readoutAt(harness.render()).props['data-kind'], 'latest');
});

test('replaced point keys clear stale inspection and disabling interaction restores the latest observation', () => {
  const harness = seriesHarness({ points: mixedPoints });
  let tree = harness.render();
  targetAt(tree, 0).props.onClick();
  tree = harness.render({ points: mixedPoints.map(point => ({ ...point, key: `new-${point.key}` })) });
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  assert.equal(readoutAt(tree).props['data-kind'], 'latest');
  assert.equal(targetAt(tree, 0).props['aria-pressed'], false);
  targetAt(tree, 0).props.onClick();
  tree = harness.render({ interactive: false });
  assert.equal(readoutAt(tree).props['data-point-index'], 2);
  assert.equal(descendants(tree, node => node.props.className === 'kk-chart-inspection-target').length, 0);
});

test('chart craft styling keeps local scrolling, theme tokens, touch controls and reduced-motion boundaries', async () => {
  const css = await readFile(new URL('../src/kit/charts/chart-craft.css', import.meta.url), 'utf8');
  assert.match(css, /\.kk-series-chart \.kk-chart-scroll\{[^}]*max-width:100%[^}]*overscroll-behavior-x:contain/);
  assert.match(css, /@media\(pointer:coarse\)/);
  assert.match(css, /width:44px;min-height:44px/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /transition:none/);
  assert.doesNotMatch(css, /(?:#[a-fA-F0-9]{3,8}\b|@keyframes|stroke-dashoffset|scale\()/);
  assert.match(css, /var\(--kk-accent\)/);
});
